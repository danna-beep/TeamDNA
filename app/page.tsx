'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Play, BarChart3, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SESSION_ID } from '@/lib/questions';
import { Session, Participant } from '@/types';

export default function PresenterPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [joinUrl, setJoinUrl] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [connected, setConnected] = useState(true);
  const [newParticipantId, setNewParticipantId] = useState<string | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    setJoinUrl(`${base}/join`);
  }, []);

  // Session subscription
  useEffect(() => {
    supabase
      .from('sessions')
      .select('*')
      .eq('id', SESSION_ID)
      .single()
      .then(({ data }) => { if (data) setSession(data as Session); });

    const ch = supabase
      .channel('presenter-session')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${SESSION_ID}` },
        (payload) => setSession(payload.new as Session)
      )
      .on('system', {}, (status) => setConnected(status === 'SUBSCRIBED'))
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(ch); };
  }, []);

  // Participants subscription
  useEffect(() => {
    supabase
      .from('participants')
      .select('*')
      .eq('session_id', SESSION_ID)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setParticipants(data as Participant[]); });

    const ch = supabase
      .channel('presenter-participants')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants' },
        (payload) => {
          const p = payload.new as Participant;
          setParticipants((prev) => {
            if (prev.find((x) => x.id === p.id)) return prev;
            return [...prev, p];
          });
          setNewParticipantId(p.id);
          setTimeout(() => setNewParticipantId(null), 2000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  const startSession = useCallback(async () => {
    if (isStarting || participants.length === 0) return;
    setIsStarting(true);
    await supabase
      .from('sessions')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', SESSION_ID);
    setIsStarting(false);
  }, [isStarting, participants.length]);

  const resetSession = useCallback(async () => {
    if (isResetting) return;
    setIsResetting(true);
    await supabase.from('participants').delete().eq('session_id', SESSION_ID);
    await supabase
      .from('sessions')
      .update({ status: 'waiting', started_at: null, ended_at: null })
      .eq('id', SESSION_ID);
    setParticipants([]);
    setIsResetting(false);
  }, [isResetting]);

  const status = session?.status ?? 'waiting';

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background orbs */}
      <div className="orb w-[600px] h-[600px] -top-40 -left-40 opacity-15"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-[500px] h-[500px] -bottom-40 -right-40 opacity-10"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />
      <div className="orb w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-8"
        style={{ background: 'radial-gradient(circle, #4338ca, transparent)' }} />

      <div className="relative z-10 flex flex-col min-h-screen p-6 md:p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black gradient-text tracking-tight">
              Team DNA v1
            </h1>
            <p className="text-white/35 text-sm font-mono mt-1 tracking-wide">
              Real-time compatibility layer
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className="font-mono text-xs tracking-wide">
              <span className={`flex items-center gap-1.5 ${connected ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 live-dot' : 'bg-red-400'}`} />
                {connected ? 'CONNECTED' : 'RECONNECTING'}
              </span>
            </div>

            {/* Session status badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono tracking-widest uppercase
              ${status === 'waiting'
                ? 'border border-amber-500/25 text-amber-400/80 bg-transparent'
                : status === 'active'
                ? 'border border-emerald-500/25 text-emerald-400'
                : 'border border-violet-500/25 text-violet-300'}`}>
              {status === 'active' && (
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full live-dot" />
              )}
              {status === 'waiting' ? 'WAITING' :
               status === 'active' ? 'LIVE' : 'COMPLETED'}
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 mb-8">
          {/* Left: Quote + QR */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Quote card */}
            <div className="glass p-8 flex-none border-l-2 border-violet-500/60" style={{ borderRadius: '14px' }}>
              <p className="font-mono text-xs tracking-widest text-violet-400/60 uppercase mb-4">
                Opening Statement
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
                Voy a analizar qué tan compatibles somos como equipo.
              </p>
            </div>

            {/* QR Code card */}
            <div className="glass p-8 flex flex-col items-center gap-6 flex-1 justify-center">
              <p className="font-mono text-xs tracking-widest text-white/35 uppercase">
                Escanea para participar
              </p>

              {joinUrl ? (
                <div className="bg-white p-4 rounded-xl shadow-2xl">
                  <QRCodeSVG
                    value={joinUrl}
                    size={220}
                    bgColor="#ffffff"
                    fgColor="#0b0818"
                    level="M"
                  />
                </div>
              ) : (
                <div className="w-[252px] h-[252px] bg-white/5 rounded-xl animate-pulse" />
              )}

              <div className="text-center">
                <p className="text-white/35 text-xs font-mono mb-1.5">o ve directamente a</p>
                <p className="text-base font-bold text-violet-300/90 font-mono tracking-wide">
                  {joinUrl || 'cargando...'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Participants */}
          <div className="lg:col-span-2 glass flex flex-col">
            <div className="p-5 border-b border-white/6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400/70" />
                <h2 className="text-white/80 font-mono text-xs tracking-widest uppercase">Participantes</h2>
              </div>
              <div className="flex items-center gap-2">
                {status === 'active' && (
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full live-dot" />
                )}
                <span className="text-2xl font-black gradient-text font-mono">
                  {participants.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {participants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3 py-12">
                  <Users className="w-10 h-10" />
                  <p className="text-xs text-center font-mono tracking-wide">Esperando participantes...</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {participants.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-all
                        ${newParticipantId === p.id
                          ? 'bg-violet-500/15 border border-violet-500/30'
                          : 'bg-white/3 hover:bg-white/6 border border-transparent'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-700 to-blue-600
                        flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white/90 font-medium text-sm truncate">{p.name}</p>
                        {p.email && (
                          <p className="text-white/30 text-xs truncate font-mono">{p.email}</p>
                        )}
                      </div>
                      {newParticipantId === p.id && (
                        <span className="text-xs text-emerald-400/80 font-mono ml-auto flex-shrink-0">new</span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {status === 'waiting' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startSession}
              disabled={isStarting || participants.length === 0}
              className="btn-gradient relative flex items-center gap-3 px-7 py-3.5 rounded-xl
                font-bold text-white text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 relative z-10" />
              <span className="relative z-10">
                {isStarting ? 'Iniciando...' :
                 participants.length === 0 ? 'Esperando participantes...' :
                 'Iniciar experimento'}
              </span>
            </motion.button>
          )}

          {status === 'active' && (
            <div className="glass px-7 py-3.5 rounded-xl flex items-center gap-3">
              <span className="w-2 h-2 bg-emerald-400 rounded-full live-dot" />
              <span className="text-white font-medium text-base">Experimento en curso</span>
            </div>
          )}

          {status === 'completed' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/dashboard'}
              className="btn-gradient relative flex items-center gap-3 px-7 py-3.5 rounded-xl
                font-bold text-white text-base"
            >
              <BarChart3 className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Ver Dashboard</span>
            </motion.button>
          )}

          {status !== 'waiting' && (
            <a
              href="/dashboard"
              className="glass flex items-center gap-2 px-5 py-3.5 rounded-xl
                text-white/50 hover:text-white/80 font-medium transition-all text-sm hover:bg-white/6"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard en vivo
            </a>
          )}

          <button
            onClick={resetSession}
            disabled={isResetting}
            className="flex items-center gap-2 px-4 py-3.5 rounded-xl text-white/30
              hover:text-white/60 font-medium transition-all text-sm ml-auto font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Reiniciando...' : 'Reiniciar sesión'}
          </button>
        </div>
      </div>
    </main>
  );
}
