'use client';

import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const valorColor: Record<string, string> = {
  cyan:   'text-cyan-300',
  green:  'text-emerald-300',
  violet: 'text-violet-300',
  yellow: 'text-yellow-300',
  pink:   'text-pink-300',
};

const slides = [
  {
    label: 'Identidad',
    query: "WHERE type = 'identity'",
    rows: [
      { campo: 'edad',          valor: '23',                        color: 'cyan'  },
      { campo: 'cumpleaños',    valor: "'14 de marzo de 2003'",      color: 'green' },
      { campo: 'ciudad_actual', valor: "'Cali'",                    color: 'green' },
      { campo: 'origen',        valor: "'Rola (Bogotá)'",           color: 'green' },
    ],
  },
  {
    label: 'Profesional',
    query: "WHERE type = 'professional'",
    rows: [
      { campo: 'estudio',          valor: "'Ingeniería de Datos e IA, UAO (8° sem / último)'", color: 'green'  },
      { campo: 'lenguajes_fuertes',valor: "ARRAY['Python', 'SQL', 'JavaScript']",              color: 'violet' },
    ],
  },
  {
    label: 'Personal',
    query: "WHERE type = 'personal'",
    rows: [
      { campo: 'hobby',         valor: "ARRAY['leer', 'escuchar música']", color: 'violet' },
      { campo: 'color_favorito',valor: "'azul'",                          color: 'green'  },
      { campo: 'autor_favorito',valor: "'Mario Mendoza'",                 color: 'green'  },
    ],
  },
  {
    label: 'Mindset',
    query: "WHERE type = 'mindset'",
    rows: [
      { campo: 'caracteristicas', valor: "ARRAY['detallista', 'honesta', 'directa']",                                                   color: 'violet' },
      { campo: 'bugs',            valor: "'expresiva'",                                                                                  color: 'yellow' },
      { campo: 'frase_tech',      valor: "'Lo que no se mide no se controla y lo que no se controla no se mejora — Peter Drucker'",      color: 'pink'   },
      { campo: 'objetivo',        valor: "'No quedarme en mi zona de confort'",                                                          color: 'pink'   },
    ],
  },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const } },
  exit:   (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.22 } }),
};

interface Sparkle {
  id: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
  delay: number;
}

export default function TeamDNAPage() {
  const profileRef = useRef<HTMLDivElement>(null);
  const isInView   = useInView(profileRef, { once: true, margin: '-80px' });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction,    setDirection]    = useState(1);

  const [sparkles,     setSparkles]     = useState<Sparkle[]>([]);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    const colors = ['#c4b5fd', '#818cf8', '#93c5fd', '#a78bfa', '#60a5fa', '#f0abfc', '#fb7185'];
    setSparkles(
      Array.from({ length: 28 }, (_, i) => ({
        id:       i,
        angle:    (i / 28) * 360 + Math.random() * 13,
        distance: 100 + Math.random() * 340,
        color:    colors[i % colors.length],
        size:     2 + Math.random() * 5,
        delay:    Math.random() * 0.45,
      }))
    );
    const t = setTimeout(() => setShowSparkles(true), 950);
    return () => clearTimeout(t);
  }, []);

  const next = () => {
    setDirection(1);
    setCurrentSlide((p) => (p + 1) % slides.length);
  };
  const prev = () => {
    setDirection(-1);
    setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);
  };
  const goTo = (i: number) => {
    setDirection(i > currentSlide ? 1 : -1);
    setCurrentSlide(i);
  };

  return (
    <main className="min-h-screen relative overflow-x-hidden">
      {/* Orbs */}
      <div className="orb w-[700px] h-[700px] -top-60 -left-60 opacity-15"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-[500px] h-[500px] top-1/2 -right-60 opacity-10"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />

      {/* ── HERO ── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 gap-5 overflow-hidden">

        {/* Sparkle burst */}
        {showSparkles && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {sparkles.map((s) => {
              const rad = (s.angle * Math.PI) / 180;
              const tx  = Math.cos(rad) * s.distance;
              const ty  = Math.sin(rad) * s.distance;
              const isSquare = s.id % 4 === 0;
              return (
                <motion.span
                  key={s.id}
                  className="absolute block"
                  style={{
                    width:        s.size,
                    height:       s.size,
                    borderRadius: isSquare ? '2px' : '50%',
                    background:   s.color,
                    boxShadow:    `0 0 ${s.size * 3}px ${s.color}80`,
                  }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={{
                    x:       tx,
                    y:       ty,
                    scale:   [0, 1.6, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.6 + s.size * 0.08,
                    delay:    s.delay,
                    ease:     'easeOut',
                  }}
                />
              );
            })}
          </div>
        )}

        <motion.p
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-xs tracking-[0.22em] text-violet-400/40 uppercase"
        >
          {'-- SELECT * FROM danna_salamanca;'}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-black leading-tight"
        >
          <span className="text-white">Hola a todos,</span>
          <br />
          <span className="gradient-text">soy Danna Salamanca</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 1 }}
          className="flex flex-col items-center gap-1.5 mt-6 text-white/25"
        >
          <span className="font-mono text-xs tracking-widest uppercase">scroll para ver mi perfil</span>
          <span className="font-mono text-base animate-bounce inline-block">↓</span>
        </motion.div>
      </section>

      {/* ── PROFILE ── */}
      <section ref={profileRef} className="relative z-10 pb-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Photo — sin recorte */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center gap-6"
          >
            <div
              className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(109,40,217,0.28), 0 0 120px rgba(37,99,235,0.10)',
                border:    '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/danna.png"
                alt="Danna Salamanca"
                className="w-full h-auto block"
              />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0b0818] to-transparent" />
            </div>

            <div className="text-center">
              <p className="text-2xl font-black text-white">Danna Salamanca</p>
              <p className="text-violet-300/60 font-mono text-xs mt-1.5 tracking-wide">
                Payments Operations Engineer · VAAS
              </p>
            </div>
          </motion.div>

          {/* SQL Carousel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="glass-strong overflow-hidden"
            style={{ fontFamily: "'Courier New', Courier, monospace", borderRadius: '14px' }}
          >
            {/* Terminal header — estático */}
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="text-white/25 text-xs ml-3">danna_salamanca.sql</span>
              <span className="ml-auto font-mono text-xs text-violet-400/50">
                {currentSlide + 1}/{slides.length}
              </span>
            </div>

            {/* Área animada */}
            <div className="overflow-hidden" style={{ minHeight: '260px' }}>
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={currentSlide}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {/* Query line */}
                  <div className="px-5 py-3.5 text-xs border-b border-white/5">
                    <span className="text-violet-400/80">SELECT</span>
                    <span className="text-white/55"> * </span>
                    <span className="text-violet-400/80">FROM</span>
                    <span className="text-cyan-300/80"> danna_salamanca </span>
                    <span className="text-white/35">{slides[currentSlide].query}</span>
                    <span className="text-white/55">;</span>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-white/4">
                    {slides[currentSlide].rows.map((row, i) => (
                      <motion.div
                        key={row.campo}
                        initial={{ opacity: 0, y: 7 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.07 }}
                        className="flex items-start gap-3 px-5 py-3 hover:bg-white/2 transition-colors"
                      >
                        <span className="text-white/18 text-xs w-4 flex-shrink-0 pt-0.5 select-none">{i + 1}</span>
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="text-blue-300/75 flex-shrink-0 text-xs">{row.campo}</span>
                          <span className="text-white/15 flex-shrink-0 text-xs">=</span>
                          <span className={`text-xs break-words min-w-0 ${valorColor[row.color]}`}>
                            {row.valor}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation footer */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}
            >
              {/* Dots */}
              <div className="flex items-center gap-2">
                {slides.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="flex items-center gap-1 group"
                  >
                    <span
                      className="block h-1 rounded-full transition-all duration-300"
                      style={{
                        width:      i === currentSlide ? 24 : 6,
                        background: i === currentSlide ? '#7c3aed' : 'rgba(255,255,255,0.2)',
                      }}
                    />
                  </button>
                ))}
                <span className="text-white/25 font-mono text-xs ml-1">
                  {slides[currentSlide].label}
                </span>
              </div>

              {/* Arrows */}
              <div className="flex items-center gap-1">
                <button
                  onClick={prev}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all text-white/30 hover:text-white hover:bg-white/8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={next}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all text-white/30 hover:text-white hover:bg-white/8"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </section>
    </main>
  );
}
