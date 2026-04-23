'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { QUESTIONS, SESSION_DURATION_SECONDS, SESSION_ID } from '@/lib/questions';
import { Session } from '@/types';
import { formatTime } from '@/lib/utils';

export default function SurveyPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const submittedRef = useRef(false);
  const router = useRouter();

  // Load participant from localStorage
  useEffect(() => {
    const pid = localStorage.getItem('teamdna_pid');
    const pname = localStorage.getItem('teamdna_name');
    if (!pid) {
      router.push('/join');
      return;
    }
    setParticipantId(pid);
    setParticipantName(pname || '');
  }, [router]);

  // Session subscription
  useEffect(() => {
    supabase
      .from('sessions')
      .select('*')
      .eq('id', SESSION_ID)
      .single()
      .then(({ data }) => {
        if (data) setSession(data as Session);
        setLoading(false);
      });

    const ch = supabase
      .channel('survey-session')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${SESSION_ID}` },
        (payload) => {
          const updated = payload.new as Session;
          setSession(updated);
          if (updated.status === 'completed' && !submittedRef.current) {
            handleAutoSubmit();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    if (!session?.started_at || session.status !== 'active') return;

    const startTime = new Date(session.started_at).getTime();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, SESSION_DURATION_SECONDS - Math.floor(elapsed / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && !submittedRef.current) {
        // Mark session completed (will trigger realtime for others)
        supabase
          .from('sessions')
          .update({ status: 'completed', ended_at: new Date().toISOString() })
          .eq('id', SESSION_ID)
          .then(() => handleAutoSubmit());
      }
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.started_at, session?.status]);

  const saveAnswers = useCallback(async (finalAnswers: Record<string, string>, done: boolean) => {
    if (!participantId) return;
    await supabase
      .from('responses')
      .upsert({
        participant_id: participantId,
        answers: finalAnswers,
        completed: done,
      }, { onConflict: 'participant_id' });
  }, [participantId]);

  const handleAutoSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    setAnswers((currentAnswers) => {
      saveAnswers(currentAnswers, true);
      return currentAnswers;
    });
    setTimeout(() => router.push('/results'), 1500);
  }, [saveAnswers, router]);

  const handleAnswer = (questionId: number, option: string) => {
    const newAnswers = { ...answers, [String(questionId)]: option };
    setAnswers(newAnswers);
    saveAnswers(newAnswers, false);
  };

  const handleSubmit = async () => {
    if (submitting || submittedRef.current) return;
    setSubmitting(true);
    submittedRef.current = true;
    await saveAnswers(answers, true);
    setSubmitted(true);
    setTimeout(() => router.push('/results'), 1500);
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;
  const progress = SESSION_DURATION_SECONDS > 0 && timeLeft !== null
    ? ((SESSION_DURATION_SECONDS - timeLeft) / SESSION_DURATION_SECONDS) * 100
    : 0;
  const timerWarning = timeLeft !== null && timeLeft <= 30;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </main>
    );
  }

  // Waiting state
  if (session?.status === 'waiting') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div className="orb w-80 h-80 top-0 right-0 opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="orb w-60 h-60 bottom-0 left-0 opacity-15"
          style={{ background: 'radial-gradient(circle, #0891b2, transparent)' }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong p-10 max-w-sm w-full text-center relative z-10"
        >
          <div className="text-5xl mb-6 animate-float">🧬</div>
          <h2 className="text-2xl font-black text-white mb-2">
            Hola, {participantName}
          </h2>
          <p className="text-white/60 mb-6">
            Estás registrado. En cuanto el experimento inicie, las preguntas aparecerán aquí.
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Esperando al presentador...</span>
          </div>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-violet-400 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </div>
        </motion.div>
      </main>
    );
  }

  // Submitted state
  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong p-10 max-w-sm w-full text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">¡Listo!</h2>
          <p className="text-white/60">Calculando tu compatibilidad...</p>
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin mx-auto mt-4" />
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-64 h-64 -top-20 -right-20 opacity-20"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-48 h-48 -bottom-10 -left-10 opacity-15"
        style={{ background: 'radial-gradient(circle, #0891b2, transparent)' }} />

      {/* Sticky header */}
      <div className="sticky top-0 z-50 glass border-b border-white/10 px-4 pt-4 pb-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/60">
                {answeredCount}/{QUESTIONS.length} respondidas
              </span>
            </div>
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold
                ${timerWarning
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-white/10 text-white'}`}>
                <Clock className={`w-4 h-4 ${timerWarning ? 'animate-pulse' : ''}`} />
                <span className="text-lg">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-4 relative z-10">
        {QUESTIONS.map((q, index) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`glass p-5 transition-all duration-200
              ${answers[String(q.id)] ? 'border-violet-500/30' : ''}`}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl flex-shrink-0">{q.emoji}</span>
              <div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
                  Pregunta {index + 1}
                </p>
                <p className="text-white font-semibold text-base leading-snug">{q.text}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt) => {
                const selected = answers[String(q.id)] === opt;
                return (
                  <motion.button
                    key={opt}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleAnswer(q.id, opt)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-150
                      ${selected
                        ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white border border-transparent'
                        : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                      {opt}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fixed submit button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={submitting || !allAnswered}
            className={`btn-gradient relative w-full py-4 rounded-2xl font-bold text-white text-base
              transition-all duration-200
              ${!allAnswered
                ? 'opacity-40 cursor-not-allowed'
                : 'opacity-100'}`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
              ) : allAnswered ? (
                <><CheckCircle2 className="w-5 h-5" /> Enviar respuestas</>
              ) : (
                `Faltan ${QUESTIONS.length - answeredCount} respuestas`
              )}
            </span>
          </motion.button>
        </div>
      </div>
    </main>
  );
}
