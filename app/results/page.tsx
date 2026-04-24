'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Loader2, Heart, Sparkles, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SESSION_ID, DANNA_ANSWERS, QUESTIONS } from '@/lib/questions';
import { calculateMatchWithDanna, calculateMatch } from '@/lib/matching';
import { Participant, Response } from '@/types';

interface PeerMatch {
  name: string;
  match: number;
}

function MatchCircle({ pct }: { pct: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="url(#matchGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
        <defs>
          <linearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <motion.span
          className="text-4xl font-black gradient-text font-mono"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {pct}%
        </motion.span>
        <span className="text-white/30 text-xs font-mono">match</span>
      </div>
    </div>
  );
}

function getInsightText(pct: number, answers: Record<string, string>): string {
  const workStyle = answers['3'];
  const motivation = answers['2'];
  const decision = answers['1'];

  if (pct >= 67) return `Alta compatibilidad con Danna. Comparten perspectiva en ${[workStyle, motivation].filter(Boolean).join(' y ')}.`;
  if (pct >= 33) return `Buena base de afinidad. ${decision === DANNA_ANSWERS['1'] ? 'Coinciden en cómo toman decisiones.' : 'Perspectivas complementarias que enriquecen el equipo.'}`;
  return `Perfiles diversificados — exactamente lo que un equipo multidisciplinario necesita para ser robusto.`;
}

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [myAnswers, setMyAnswers] = useState<Record<string, string>>({});
  const [matchWithDanna, setMatchWithDanna] = useState(0);
  const [topPeers, setTopPeers] = useState<PeerMatch[]>([]);
  const [myName, setMyName] = useState('');
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const pid = localStorage.getItem('teamdna_pid');
    const pname = localStorage.getItem('teamdna_name');
    if (!pid) {
      router.push('/join');
      return;
    }
    setMyName(pname || 'tú');

    const loadResults = async () => {
      // Get my response
      const { data: myResp } = await supabase
        .from('responses')
        .select('*')
        .eq('participant_id', pid)
        .single();

      if (!myResp) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const myAns = myResp.answers as Record<string, string>;
      setMyAnswers(myAns);
      setMatchWithDanna(calculateMatchWithDanna(myAns));

      // Get all other participants + their responses for peer matching
      const { data: allParticipants } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', SESSION_ID);

      const { data: allResponses } = await supabase
        .from('responses')
        .select('*');

      if (allParticipants && allResponses) {
        const responseMap = new Map<string, Response>();
        for (const r of allResponses) {
          responseMap.set(r.participant_id, r as Response);
        }

        const peers = allParticipants
          .filter((p: Participant) => p.id !== pid && responseMap.has(p.id))
          .map((p: Participant) => ({
            name: p.name,
            match: calculateMatch(myAns, responseMap.get(p.id)!.answers),
          }))
          .sort((a: PeerMatch, b: PeerMatch) => b.match - a.match)
          .slice(0, 3);

        setTopPeers(peers);
      }

      setLoading(false);
    };

    loadResults();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
        <p className="text-white/35 text-xs font-mono tracking-wide">Calculando compatibilidad...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-strong p-8 max-w-sm w-full text-center">
          <p className="text-white/50 mb-4 text-sm">No encontramos tus respuestas.</p>
          <button onClick={() => router.push('/join')}
            className="btn-gradient relative px-6 py-2.5 rounded-xl text-white font-bold text-sm">
            <span className="relative z-10">Volver al inicio</span>
          </button>
        </div>
      </main>
    );
  }

  const insight = getInsightText(matchWithDanna, myAnswers);

  return (
    <main className="min-h-screen relative overflow-hidden pb-10">
      <div className="orb w-80 h-80 -top-20 -right-20 opacity-15"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-60 h-60 -bottom-20 -left-20 opacity-10"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />

      <div className="max-w-sm mx-auto px-4 pt-8 space-y-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <p className="font-mono text-xs tracking-[0.2em] text-white/25 uppercase mb-4">Team DNA v1</p>
          <h1 className="text-2xl font-black text-white">
            Tu compatibilidad, <span className="gradient-text">{myName}</span>
          </h1>
        </motion.div>

        {/* Match with Danna */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-strong p-6 text-center"
          style={{ boxShadow: '0 0 60px rgba(109,40,217,0.15)' }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-3.5 h-3.5 text-violet-400/70" />
            <p className="font-mono text-xs tracking-widest text-white/35 uppercase">
              Compatibilidad con Danna
            </p>
          </div>
          <MatchCircle pct={matchWithDanna} />
          <p className="text-white/50 text-sm mt-4 leading-relaxed">{insight}</p>
        </motion.div>

        {/* My answers summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-violet-400/70" />
            <p className="font-mono text-xs tracking-widest text-white/35 uppercase">Tu perfil</p>
          </div>
          <div className="space-y-2">
            {QUESTIONS.map((q) => {
              const myAns = myAnswers[String(q.id)];
              const dannaAns = DANNA_ANSWERS[String(q.id)];
              const match = myAns === dannaAns;
              return (
                <div key={q.id} className="flex items-center justify-between gap-2">
                  <span className="text-white/35 text-xs flex items-center gap-1.5 min-w-0">
                    <span className="flex-shrink-0">{q.emoji}</span>
                    <span className="truncate">{q.text.replace('¿', '').replace('?', '').trim()}</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`font-mono text-xs px-2 py-0.5 rounded-md
                      ${match
                        ? 'bg-emerald-500/15 text-emerald-400/80 border border-emerald-500/20'
                        : 'bg-white/5 text-white/55 border border-white/8'}`}>
                      {myAns || '—'}
                    </span>
                    {match && <span className="text-emerald-400/70 text-xs">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top peer matches */}
        {topPeers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5 text-violet-400/70" />
              <p className="font-mono text-xs tracking-widest text-white/35 uppercase">
                Más afines a ti
              </p>
            </div>
            <div className="space-y-2">
              {topPeers.map((peer, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-700 to-blue-600
                    flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {peer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white/80 font-medium text-sm flex-1 truncate">{peer.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full progress-bar"
                        style={{ width: `${peer.match}%` }}
                      />
                    </div>
                    <span className="text-white/40 text-xs font-mono w-8 text-right">
                      {peer.match}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-2"
        >
          <p className="text-white/20 text-xs font-mono">
            Resultados completos del equipo en la pantalla del presentador
          </p>
        </motion.div>
      </div>
    </main>
  );
}
