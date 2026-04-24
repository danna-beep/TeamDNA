'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, RadialBarChart, RadialBar,
} from 'recharts';
import { Download, RefreshCw, Trophy, Zap, Users2, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SESSION_ID, QUESTIONS, DANNA_ANSWERS } from '@/lib/questions';
import { computeMatchResults, getAvgMatchWithDanna, getChartDataForQuestion } from '@/lib/matching';
import { generateInsights, computeTeamStats } from '@/lib/insights';
import { Participant, Response, MatchResult } from '@/types';

const PIE_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
const RADIAL_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b'];

const CustomYAxisTick = ({ x, y, payload }: any) => {
  const text: string = payload.value ?? '';
  const maxLen = 20;
  const display = text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.45)" fontSize={10} textAnchor="end" dominantBaseline="middle">
      {display}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = item.payload?.name ?? item.name;
  const value = item.value;
  const pct = item.payload?.pct;
  return (
    <div style={{
      background: 'rgba(10, 7, 24, 0.95)',
      border: '1px solid rgba(124, 58, 237, 0.4)',
      borderRadius: 12,
      padding: '10px 14px',
      backdropFilter: 'blur(16px)',
    }}>
      {name && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 4 }}>{name}</p>}
      <p style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
        {value} {value === 1 ? 'persona' : 'personas'}
      </p>
      {pct !== undefined && (
        <p style={{ color: '#a78bfa', fontSize: 11, marginTop: 2 }}>{pct}% del equipo</p>
      )}
    </div>
  );
};

export default function DashboardPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const [{ data: parts }, { data: resps }] = await Promise.all([
      supabase.from('participants').select('*').eq('session_id', SESSION_ID).order('created_at'),
      supabase.from('responses').select('*'),
    ]);
    const p = (parts || []) as Participant[];
    const r = (resps || []) as Response[];
    setParticipants(p);
    setResponses(r);
    setResults(computeMatchResults(p, r));
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responses' }, () => refresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participants' }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  const exportData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      session: SESSION_ID,
      stats: computeTeamStats(results, responses),
      dannaAnswers: DANNA_ANSWERS,
      participants: participants.map((p) => ({
        id: p.id, name: p.name, email: p.email, joinedAt: p.created_at,
      })),
      results: results.map((r) => ({
        name: r.participantName, matchWithDanna: r.matchWithDanna,
        answers: r.answers, topPeers: r.topPeers,
      })),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-dna-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    if (!contentRef.current || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF }   = await import('jspdf');

      const el    = contentRef.current;
      const scale = 1.5;

      const canvas = await html2canvas(el, {
        backgroundColor: '#0b0818',
        scale,
        useCORS: true,
        logging: false,
        width:        el.offsetWidth,
        height:       el.scrollHeight,   // altura total, no solo viewport
        scrollX:      0,
        scrollY:      0,
        onclone: (_doc, cloned) => {
          cloned.querySelectorAll<HTMLElement>('.glass, .glass-strong').forEach((e) => {
            e.style.background     = 'rgba(20, 14, 50, 0.97)';
            e.style.backdropFilter = 'none';
          });
        },
      });

      // px → mm (96 DPI), dividir por scale para obtener tamaño real renderizado
      const mmW = (canvas.width  / scale) * (25.4 / 96);
      const mmH = (canvas.height / scale) * (25.4 / 96);
      const pdf = new jsPDF({ orientation: mmW > mmH ? 'landscape' : 'portrait', unit: 'mm', format: [mmW, mmH] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, mmW, mmH);
      pdf.save(`team-dna-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
    }
    setDownloadingPdf(false);
  };

  const insights = generateInsights(responses, results);
  const stats = computeTeamStats(results, responses);
  const avgMatch = getAvgMatchWithDanna(results);

  const decisionData = getChartDataForQuestion(responses, 1, QUESTIONS[1].options);
  const motivationData = getChartDataForQuestion(responses, 2, QUESTIONS[2].options);
  const workStyleData = getChartDataForQuestion(responses, 3, QUESTIONS[3].options);
  const problemData = getChartDataForQuestion(responses, 0, QUESTIONS[0].options);

  const workStyleRadial = workStyleData.map((d, i) => ({
    ...d,
    fill: RADIAL_COLORS[i % RADIAL_COLORS.length],
  }));

  const topMotivation = [...motivationData].sort((a, b) => b.count - a.count)[0];

  const matchDistData = [
    { name: '0–20%', range: '0–20%', count: 0, fill: '#ef4444' },
    { name: '21–40%', range: '21–40%', count: 0, fill: '#f59e0b' },
    { name: '41–60%', range: '41–60%', count: 0, fill: '#06b6d4' },
    { name: '61–80%', range: '61–80%', count: 0, fill: '#7c3aed' },
    { name: '81–100%', range: '81–100%', count: 0, fill: '#10b981' },
  ];
  results.forEach((r) => {
    const pct = r.matchWithDanna;
    if (pct <= 20) matchDistData[0].count++;
    else if (pct <= 40) matchDistData[1].count++;
    else if (pct <= 60) matchDistData[2].count++;
    else if (pct <= 80) matchDistData[3].count++;
    else matchDistData[4].count++;
  });

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-white/40 font-mono text-sm tracking-widest">cargando datos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden pb-16">
      <div className="orb w-[500px] h-[500px] -top-40 -left-40 opacity-15"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-96 h-96 -bottom-20 -right-20 opacity-10"
        style={{ background: 'radial-gradient(circle, #0891b2, transparent)' }} />

      <div ref={contentRef} className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🧬</span>
              <h1 className="text-3xl font-black gradient-text tracking-tight">Team DNA v1</h1>
              <div className="flex items-center gap-1.5 glass px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full live-dot" />
                <span className="text-emerald-400 text-xs font-bold tracking-[0.15em]">LIVE</span>
              </div>
            </div>
            <p className="text-white/30 text-xs font-mono ml-9">
              actualizado {lastUpdate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/55 hover:text-white text-sm font-medium transition-all hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            <button
              onClick={exportData}
              className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/55 hover:text-white text-sm font-medium transition-all hover:bg-white/10"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={downloadPdf}
              disabled={downloadingPdf}
              className="btn-gradient relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
            >
              {downloadingPdf
                ? <><RefreshCw className="w-4 h-4 animate-spin relative z-10" /><span className="relative z-10">Generando...</span></>
                : <><Download className="w-4 h-4 relative z-10" /><span className="relative z-10">PDF</span></>
              }
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {([
            { icon: <Users2 className="w-5 h-5" />, label: 'Participantes', value: String(participants.length), sub: `${stats.completionRate}% completaron`, accent: '#7c3aed' },
            { icon: <TrendingUp className="w-5 h-5" />, label: 'Match promedio', value: `${avgMatch}%`, sub: 'compatibilidad con Danna', accent: '#06b6d4' },
            { icon: <Zap className="w-5 h-5" />, label: 'Motivación top', value: stats.topMotivation || '—', sub: 'del equipo', accent: '#ec4899' },
            { icon: <Trophy className="w-5 h-5" />, label: 'Estilo líder', value: stats.topWorkStyle || '—', sub: 'predominante', accent: '#10b981' },
          ] as const).map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-strong p-5 relative overflow-hidden"
              style={{ borderLeft: `3px solid ${card.accent}` }}
            >
              <div
                className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none"
                style={{ background: card.accent, opacity: 0.06, transform: 'translate(35%, -35%)', filter: 'blur(24px)' }}
              />
              <div className="flex items-center gap-2 mb-3" style={{ color: card.accent }}>
                {card.icon}
                <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  {card.label}
                </span>
              </div>
              <p className="text-2xl font-black text-white mb-1 leading-none">{card.value}</p>
              <p className="text-white/30 text-xs">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── MAIN ROW: leaderboard + donut + radial ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* Leaderboard */}
          <div className="glass p-5">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <h2 className="text-white font-bold text-xs uppercase tracking-widest">Top Matches con Danna</h2>
            </div>

            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/20 gap-2">
                <span className="text-4xl">⏳</span>
                <p className="text-xs">Esperando respuestas...</p>
              </div>
            ) : (
              <div className="space-y-2 mb-5">
                {results.slice(0, 7).map((r, i) => {
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                  return (
                    <motion.div
                      key={r.participantId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/4 hover:bg-white/7 transition-all"
                    >
                      {medal ? (
                        <span className="text-sm w-6 text-center flex-shrink-0">{medal}</span>
                      ) : (
                        <span className="text-white/20 text-xs font-bold w-6 text-center flex-shrink-0">{i + 1}</span>
                      )}
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {r.participantName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white text-sm font-medium flex-1 truncate">{r.participantName}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full progress-bar" style={{ width: `${r.matchWithDanna}%` }} />
                        </div>
                        <span className="text-white font-bold text-xs w-9 text-right font-mono tabular-nums">
                          {r.matchWithDanna}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 border-t border-white/8">
              <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Perfil de Danna</p>
              <div className="space-y-1.5">
                {QUESTIONS.map((q) => (
                  <div key={q.id} className="flex items-start gap-2">
                    <span className="text-sm flex-shrink-0">{q.emoji}</span>
                    <span className="text-white/40 text-xs leading-relaxed">{DANNA_ANSWERS[String(q.id)]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Donut — Motivación */}
          <div className="glass p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
              <h2 className="text-white font-bold text-xs uppercase tracking-widest">⚡ Motivación del equipo</h2>
            </div>

            {motivationData.every((d) => d.count === 0) ? (
              <div className="flex-1 flex items-center justify-center text-white/20 text-xs">Sin datos aún</div>
            ) : (
              <>
                <div className="relative" style={{ height: 190 }}>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={motivationData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="52%"
                        outerRadius="78%"
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {motivationData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {topMotivation && topMotivation.count > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-white font-black text-3xl tabular-nums leading-none">{topMotivation.pct}%</p>
                      <p className="text-white/35 text-xs text-center mt-1 max-w-[72px] leading-tight">{topMotivation.name}</p>
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-1.5">
                  {motivationData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-white/45 text-xs flex-1 truncate">{d.name}</span>
                      <span className="text-white text-xs font-bold tabular-nums">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Radial bar — Estilo de trabajo */}
          <div className="glass p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <h2 className="text-white font-bold text-xs uppercase tracking-widest">💼 Estilo de trabajo</h2>
            </div>

            {workStyleRadial.every((d) => d.count === 0) ? (
              <div className="flex-1 flex items-center justify-center text-white/20 text-xs">Sin datos aún</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="90%"
                    data={workStyleRadial}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar dataKey="count" cornerRadius={6} label={false} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {workStyleRadial.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                      <span className="text-white/45 text-xs flex-1 truncate">{d.name}</span>
                      <span className="text-white text-xs font-bold tabular-nums">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── SECONDARY: barras horizontales ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

          {/* Decisiones — horizontal */}
          <div className="glass p-5">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              <h2 className="text-white font-bold text-xs uppercase tracking-widest">🧠 Toma de decisiones</h2>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={decisionData} layout="vertical" barSize={14} margin={{ left: 4, right: 8 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={<CustomYAxisTick />}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <defs>
                  <linearGradient id="hCyan" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0e7490" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="url(#hCyan)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Problemas — horizontal */}
          <div className="glass p-5">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <h2 className="text-white font-bold text-xs uppercase tracking-widest">🎯 Tipo de problema</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={problemData} layout="vertical" barSize={14} margin={{ left: 4, right: 8 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={<CustomYAxisTick />}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <defs>
                  <linearGradient id="hAmber" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#b45309" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="url(#hAmber)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── DISTRIBUCIÓN DE COMPATIBILIDAD ── */}
        {results.length > 0 && (
          <div className="glass p-5 mb-7">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" />
                <h2 className="text-white font-bold text-xs uppercase tracking-widest">📊 Distribución de compatibilidad</h2>
              </div>
              <span className="text-white/25 text-xs font-mono">¿cómo se distribuye el equipo?</span>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={matchDistData} barSize={52}>
                <XAxis
                  dataKey="range"
                  tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {matchDistData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── INSIGHTS ── */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" />
            <h2 className="text-white font-bold text-xs uppercase tracking-widest">Insights del equipo</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((ins, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={`glass p-5 hover:bg-white/7 transition-all ${ins.highlight ? 'border-violet-500/25' : ''}`}
              >
                <div className="text-2xl mb-3">{ins.icon}</div>
                <p className="text-white font-bold text-sm mb-2 leading-snug">{ins.title}</p>
                <p className="text-white/40 text-xs leading-relaxed">{ins.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
