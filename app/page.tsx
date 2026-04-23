'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Play, BarChart3, RefreshCw, Wifi, WifiOff } from 'lucide-react';
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
      <div className="orb w-[600px] h-[600px] -top-40 -left-40 opacity-20"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-[500px] h-[500px] -bottom-40 -right-40 opacity-15"
        style={{ background: 'radial-gradient(circle, #0891b2, transparent)' }} />
      <div className="orb w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10"
        style={{ background: 'radial-gradient(circle, #4338ca, transparent)' }} />

      <div className="relative z-10 flex flex-col min-h-screen p-6 md:p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🧬</span>
              <h1 className="text-4xl md:text-5xl font-black gradient-text tracking-tight">
                Team DNA v1
              </h1>
            </div>
            <p className="text-violet-300 text-lg font-medium ml-12">
              Real-time compatibility layer
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className="flex items-center gap-2 glass px-3 py-2 rounded-full">
              {connected
                ? <Wifi className="w-4 h-4 text-emerald-400" />
                : <WifiOff className="w-4 h-4 text-red-400" />}
              <span className={`text-xs font-medium ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                {connected ? 'Conectado' : 'Reconectando...'}
              </span>
            </div>

            {/* Session status badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold
              ${status === 'waiting' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                'bg-violet-500/20 text-violet-300 border border-violet-500/30'}`}>
              {status === 'active' && (
                <span className="w-2 h-2 bg-emerald-400 rounded-full live-dot" />
              )}
              {status === 'waiting' ? '⏳ En espera' :
               status === 'active' ? 'LIVE' : '✓ Completado'}
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Left: Quote + QR */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Quote card */}
            <div className="glass p-8 flex-none">
              <p className="text-2xl md:text-3xl font-light text-white/80 leading-relaxed">
                No me voy a presentar de la forma tradicional.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-2 leading-relaxed">
                Voy a analizar qué tan compatibles somos como equipo.
              </p>
            </div>

            {/* QR Code card */}
            <div className="glass p-8 flex flex-col items-center gap-6 flex-1 justify-center">
              <p className="text-violet-300 text-sm font-semibold uppercase tracking-widest">
                Escanea para participar
              </p>

              {joinUrl ? (
                <div className="bg-white p-4 rounded-2xl shadow-2xl">
                  <QRCodeSVG
                    value={joinUrl}
                    size={220}
                    bgColor="#ffffff"
                    fgColor="#0d0a1e"
                    level="M"
                  />
                </div>
              ) : (
                <div className="w-[252px] h-[252px] bg-white/10 rounded-2xl animate-pulse" />
              )}

              <div className="text-center">
                <p className="text-white/50 text-sm mb-1">o ve directamente a</p>
                <p className="text-xl font-bold text-violet-300 font-mono tracking-wide">
                  {joinUrl || 'cargando...'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Participants */}
          <div className="lg:col-span-2 glass flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                <h2 className="text-white font-bold text-lg">Participantes</h2>
              </div>
              <div className="flex items-center gap-2">
                {status === 'active' && (
                  <span className="w-2 h-2 bg-emerald-400 rounded-full live-dot" />
                )}
                <span className="text-3xl font-black gradient-text">
                  {participants.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {participants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3 py-12">
                  <Users className="w-12 h-12" />
                  <p className="text-sm text-center">Esperando que las personas escaneen el QR...</p>
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
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all
                        ${newParticipantId === p.id
                          ? 'bg-violet-500/20 border border-violet-500/40'
                          : 'bg-white/5 hover:bg-white/8'}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600
                        flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{p.name}</p>
                        {p.email && (
                          <p className="text-white/40 text-xs truncate">{p.email}</p>
                        )}
                      </div>
                      {newParticipantId === p.id && (
                        <span className="text-xs text-emerald-400 font-medium ml-auto flex-shrink-0">nuevo</span>
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
              className="btn-gradient relative flex items-center gap-3 px-8 py-4 rounded-2xl
                font-bold text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5 relative z-10" />
              <span className="relative z-10">
                {isStarting ? 'Iniciando...' :
                 participants.length === 0 ? 'Esperando participantes...' :
                 'Iniciar experimento'}
              </span>
            </motion.button>
          )}

          {status === 'active' && (
            <div className="glass px-8 py-4 rounded-2xl flex items-center gap-3">
              <span className="w-3 h-3 bg-emerald-400 rounded-full live-dot" />
              <span className="text-white font-bold text-lg">Experimento en curso...</span>
            </div>
          )}

          {status === 'completed' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/dashboard'}
              className="btn-gradient relative flex items-center gap-3 px-8 py-4 rounded-2xl
                font-bold text-white text-lg"
            >
              <BarChart3 className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Ver Dashboard</span>
            </motion.button>
          )}

          {status !== 'waiting' && (
            <a
              href="/dashboard"
              className="glass flex items-center gap-2 px-6 py-4 rounded-2xl
                text-white/70 hover:text-white font-medium transition-all hover:bg-white/10"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard en vivo
            </a>
          )}

          <button
            onClick={resetSession}
            disabled={isResetting}
            className="flex items-center gap-2 px-4 py-4 rounded-2xl text-white/40
              hover:text-white/70 font-medium transition-all text-sm ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Reiniciando...' : 'Reiniciar sesión'}
          </button>
        </div>
      </div>
    </main>
  );
}
