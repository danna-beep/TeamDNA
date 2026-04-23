'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie,
} from 'recharts';
import { Download, RefreshCw, Trophy, Zap, Users2, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SESSION_ID, QUESTIONS, DANNA_ANSWERS } from '@/lib/questions';
import { computeMatchResults, getAvgMatchWithDanna, getChartDataForQuestion } from '@/lib/matching';
import { generateInsights, computeTeamStats } from '@/lib/insights';
import { Participant, Response, MatchResult } from '@/types';

const CHART_COLORS = ['#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 text-xs">
      <p className="text-white font-bold">{label}</p>
      <p className="text-violet-300">{payload[0].value} personas ({payload[0].payload.pct}%)</p>
    </div>
  );
};

export default function DashboardPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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
        id: p.id,
        name: p.name,
        email: p.email,
        joinedAt: p.created_at,
      })),
      results: results.map((r) => ({
        name: r.participantName,
        matchWithDanna: r.matchWithDanna,
        answers: r.answers,
        topPeers: r.topPeers,
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

  const insights = generateInsights(responses, results);
  const stats = computeTeamStats(results, responses);
  const avgMatch = getAvgMatchWithDanna(results);

  // Chart data for questions 1 (decision), 2 (motivation), 3 (work style)
  const decisionData = getChartDataForQuestion(responses, 1, QUESTIONS[1].options);
  const motivationData = getChartDataForQuestion(responses, 2, QUESTIONS[2].options);
  const workStyleData = getChartDataForQuestion(responses, 3, QUESTIONS[3].options);
  const problemData = getChartDataForQuestion(responses, 0, QUESTIONS[0].options);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-white/50">Cargando datos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden pb-12">
      <div className="orb w-96 h-96 -top-20 -left-20 opacity-15"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-80 h-80 -bottom-20 -right-20 opacity-10"
        style={{ background: 'radial-gradient(circle, #0891b2, transparent)' }} />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🧬</span>
              <h1 className="text-3xl font-black gradient-text">Team DNA v1</h1>
              <div className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full live-dot" />
                <span className="text-emerald-400 text-xs font-bold">LIVE</span>
              </div>
            </div>
            <p className="text-white/40 text-sm">
              Última actualización: {lastUpdate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={refresh} className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-white/70 hover:text-white text-sm font-medium transition-all hover:bg-white/10">
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            <button onClick={exportData} className="btn-gradient relative flex items-center gap-2
              px-4 py-2.5 rounded-xl text-white text-sm font-bold">
              <Download className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Exportar JSON</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <Users2 className="w-5 h-5" />,
              label: 'Participantes',
              value: participants.length,
              sub: `${stats.completionRate}% completaron`,
              color: 'violet',
            },
            {
              icon: <TrendingUp className="w-5 h-5" />,
              label: 'Match promedio',
              value: `${avgMatch}%`,
              sub: 'compatibilidad con Danna',
              color: 'cyan',
            },
            {
              icon: <Zap className="w-5 h-5" />,
              label: 'Motivación top',
              value: stats.topMotivation || '—',
              sub: 'del equipo',
              color: 'violet',
            },
            {
              icon: <Trophy className="w-5 h-5" />,
              label: 'Estilo de trabajo',
              value: stats.topWorkStyle || '—',
              sub: 'predominante',
              color: 'cyan',
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-strong p-5"
            >
              <div className={`flex items-center gap-2 mb-3 ${card.color === 'violet' ? 'text-violet-400' : 'text-cyan-400'}`}>
                {card.icon}
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  {card.label}
                </span>
              </div>
              <p className="text-3xl font-black text-white mb-1">{card.value}</p>
              <p className="text-white/40 text-xs">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top Matches Leaderboard */}
          <div className="glass p-5 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-white font-bold">Top Matches con Danna</h2>
            </div>

            {results.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">
                Esperando respuestas...
              </p>
            ) : (
              <div className="space-y-2">
                {results.slice(0, 8).map((r, i) => (
                  <motion.div
                    key={r.participantId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/8 transition-all"
                  >
                    <span className={`text-sm font-bold w-5 text-center flex-shrink-0
                      ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-white/30'}`}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600
                      flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {r.participantName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium flex-1 truncate">
                      {r.participantName}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full progress-bar" style={{ width: `${r.matchWithDanna}%` }} />
                      </div>
                      <span className="text-white font-bold text-sm w-9 text-right font-mono">
                        {r.matchWithDanna}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Danna's profile */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Perfil de Danna</p>
              <div className="space-y-1.5">
                {QUESTIONS.map((q) => (
                  <div key={q.id} className="flex items-center gap-2">
                    <span className="text-sm">{q.emoji}</span>
                    <span className="text-white/40 text-xs flex-1">{DANNA_ANSWERS[String(q.id)]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="lg:col-span-2 space-y-4">
            {/* Motivation chart */}
            <div className="glass p-5">
              <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">
                ⚡ ¿Qué motiva al equipo?
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={motivationData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <defs>
                    <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#4338ca" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {motivationData.map((_, idx) => (
                      <Cell key={idx} fill="url(#barGrad1)" opacity={idx === 0 ? 1 : 0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Decision + Work style - side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-5">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">
                  🧠 Decisiones
                </p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={decisionData} barSize={20}>
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <defs>
                      <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0891b2" />
                        <stop offset="100%" stopColor="#0e7490" />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="url(#barGrad2)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass p-5">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">
                  💼 Estilo trabajo
                </p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={workStyleData} barSize={20}>
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <defs>
                      <linearGradient id="barGrad3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#047857" />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="url(#barGrad3)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Problem type chart */}
            <div className="glass p-5">
              <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">
                🎯 ¿En qué problemas aportan más?
              </p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={problemData} barSize={24}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <defs>
                    <linearGradient id="barGrad4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="url(#barGrad4)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div>
          <h2 className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-4">
            Insights del equipo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((ins, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`glass p-5 ${ins.highlight ? 'border-violet-500/30' : ''}`}
              >
                <div className="text-2xl mb-3">{ins.icon}</div>
                <p className="text-white font-bold text-sm mb-2">{ins.title}</p>
                <p className="text-white/50 text-xs leading-relaxed">{ins.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
