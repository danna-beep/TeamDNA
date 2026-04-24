'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SESSION_ID } from '@/lib/questions';
import { Session } from '@/types';

export default function JoinPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  // Check if already registered
  useEffect(() => {
    const pid = localStorage.getItem('teamdna_pid');
    if (pid) {
      router.push('/survey');
    }
  }, [router]);

  // Fetch session
  useEffect(() => {
    supabase
      .from('sessions')
      .select('*')
      .eq('id', SESSION_ID)
      .single()
      .then(({ data }) => { if (data) setSession(data as Session); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    const { data, error: err } = await supabase
      .from('participants')
      .insert({
        session_id: SESSION_ID,
        name: name.trim(),
        email: email.trim() || null,
      })
      .select()
      .single();

    if (err || !data) {
      setError('Hubo un problema al unirte. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    // Create an empty response record
    await supabase
      .from('responses')
      .insert({
        participant_id: data.id,
        answers: {},
        completed: false,
      });

    localStorage.setItem('teamdna_pid', data.id);
    localStorage.setItem('teamdna_name', data.name);
    router.push('/survey');
  };

  if (session?.status === 'completed') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="orb w-96 h-96 top-0 right-0 opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="glass-strong p-10 max-w-md w-full text-center relative z-10">
          <p className="font-mono text-xs tracking-widest text-white/25 uppercase mb-6">Session Closed</p>
          <h2 className="text-xl font-bold text-white mb-2">Experimento cerrado</h2>
          <p className="text-white/40 text-sm">El tiempo de respuesta ha finalizado.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-80 h-80 -top-20 -right-20 opacity-20"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-64 h-64 -bottom-20 -left-20 opacity-15"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <p className="font-mono text-xs tracking-[0.25em] text-white/30 uppercase mb-5">
            TEAM DNA
          </p>
          <h1 className="text-3xl font-black text-white mb-2">
            Únete al
            <span className="gradient-text"> experimento</span>
          </h1>
          {/* Thin gradient line below heading */}
          <div className="mx-auto mt-3 mb-4 h-px w-24"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(109,40,217,0.6), rgba(37,99,235,0.5), transparent)' }}
          />
          <p className="text-white/40 text-sm leading-relaxed">
            6 preguntas · 3 minutos · datos en tiempo real
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-strong p-6 space-y-4">
          <div>
            <label className="block font-mono text-xs tracking-widest text-white/40 uppercase mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="¿Cómo te llaman?"
              autoFocus
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block font-mono text-xs tracking-widest text-white/40 uppercase mb-2">
              Correo <span className="text-white/25 normal-case font-normal tracking-normal">(opcional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              className="input-field"
            />
          </div>

          {error && (
            <p className="text-red-400/80 text-sm text-center font-mono">{error}</p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={loading || !name.trim()}
            className="btn-gradient relative w-full flex items-center justify-center gap-2
              py-3.5 rounded-xl font-bold text-white text-base
              disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uniéndome...
                </>
              ) : (
                <>
                  Unirme al experimento
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </span>
          </motion.button>

          <p className="text-white/20 text-xs text-center font-mono pt-1">
            Solo usaremos tu nombre para el análisis. Sin spam.
          </p>
        </form>
      </motion.div>
    </main>
  );
}
