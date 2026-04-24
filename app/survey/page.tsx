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
        <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
      </main>
    );
  }

  // Waiting state
  if (session?.status === 'waiting') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div className="orb w-80 h-80 top-0 right-0 opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="orb w-60 h-60 bottom-0 left-0 opacity-10"
          style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong p-10 max-w-sm w-full text-center relative z-10"
        >
          <p className="font-mono text-xs tracking-widest text-violet-400/50 uppercase mb-5">Team DNA</p>
          <h2 className="text-xl font-bold text-white mb-2">
            Hola, {participantName}
          </h2>
          <p className="text-white/45 text-sm mb-6 leading-relaxed">
            Estás registrado. En cuanto el experimento inicie, las preguntas aparecerán aquí.
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-400/70">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-mono tracking-wide">Esperando al presentador...</span>
          </div>
          <div className="flex justify-center gap-1 mt-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-violet-500/60 rounded-full"
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
          <CheckCircle2 className="w-14 h-14 text-emerald-400/80 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Enviado</h2>
          <p className="text-white/45 text-sm">Calculando tu compatibilidad...</p>
          <Loader2 className="w-5 h-5 text-violet-400 animate-spin mx-auto mt-5" />
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-64 h-64 -top-20 -right-20 opacity-15"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-48 h-48 -bottom-10 -left-10 opacity-10"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />

      {/* Sticky header */}
      <div className="sticky top-0 z-50 px-4 pt-3 pb-3"
        style={{
          background: 'rgba(8, 5, 24, 0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-white/35 tracking-wide">
              {answeredCount}/{QUESTIONS.length} respondidas
            </span>
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-sm font-bold
                ${timerWarning
                  ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                  : 'text-white/60 border border-white/8'}`}>
                <Clock className={`w-3.5 h-3.5 ${timerWarning ? 'animate-pulse' : ''}`} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-white/6 rounded-full overflow-hidden">
            <div
              className="h-full progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-32 space-y-3.5 relative z-10">
        <AnimatePresence>
          {QUESTIONS.map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`glass p-5 transition-all duration-200
                ${answers[String(q.id)] ? 'border-violet-500/25' : ''}`}
            >
              <div className="mb-4">
                <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-2">
                  Q{String(index + 1).padStart(2, '0')}
                </p>
                <p className="text-white font-medium text-base leading-snug">{q.text}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                {q.options.map((opt) => {
                  const selected = answers[String(q.id)] === opt;
                  return (
                    <motion.button
                      key={opt}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(q.id, opt)}
                      className={`px-3.5 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-150
                        ${selected
                          ? 'bg-violet-600/20 border border-violet-500/50 text-white'
                          : 'bg-white/3 border border-white/7 text-white/60 hover:bg-white/6 hover:border-white/15 hover:text-white/90'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {selected && <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-violet-400" />}
                        <span>{opt}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Fixed submit button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={submitting || !allAnswered}
            className={`btn-gradient relative w-full py-3.5 rounded-xl font-bold text-white text-base
              transition-all duration-200
              ${!allAnswered
                ? 'opacity-35 cursor-not-allowed'
                : 'opacity-100'}`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : allAnswered ? (
                <><CheckCircle2 className="w-4 h-4" /> Enviar respuestas</>
              ) : (
                <span className="font-mono tracking-wide">
                  {QUESTIONS.length - answeredCount} respuestas restantes
                </span>
              )}
            </span>
          </motion.button>
        </div>
      </div>
    </main>
  );
}
