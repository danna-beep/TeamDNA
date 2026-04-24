'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const sqlRows = [
  { campo: 'edad', valor: '23', color: 'cyan' },
  { campo: 'cumpleaños', valor: "'14 de marzo de 2003'", color: 'green' },
  { campo: 'ciudad_actual', valor: "'Cali'", color: 'green' },
  { campo: 'origen', valor: "'Rola (Bogotá)'", color: 'green' },
  { campo: 'estudio', valor: "'Ingeniería de Datos e IA, UAO (8° sem / último)'", color: 'green' },
  { campo: 'lenguajes_fuertes', valor: "ARRAY['Python', 'SQL', 'JavaScript']", color: 'violet' },
  { campo: 'hobby', valor: "ARRAY['leer', 'escuchar música']", color: 'violet' },
  { campo: 'color_favorito', valor: "'azul'", color: 'green' },
  { campo: 'autor_favorito', valor: "'Mario Mendoza'", color: 'green' },
  { campo: 'caracteristicas', valor: "ARRAY['detallista', 'honesta', 'directa']", color: 'violet' },
  { campo: 'bugs', valor: "'expresiva'", color: 'yellow' },
  { campo: 'frase_tech', valor: "'Lo que no se mide no se controla y lo que no se controla no se mejora — Peter Drucker'", color: 'pink' },
  { campo: 'objetivo', valor: "'No quedarme en mi zona de confort'", color: 'pink' },
];

const valorColor: Record<string, string> = {
  cyan: 'text-cyan-300',
  green: 'text-emerald-300',
  violet: 'text-violet-300',
  yellow: 'text-yellow-300',
  pink: 'text-pink-300',
};

export default function TeamDNAPage() {
  const profileRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(profileRef, { once: true, margin: '-80px' });

  return (
    <main className="min-h-screen relative overflow-x-hidden">
      {/* Background orbs */}
      <div
        className="orb w-[700px] h-[700px] -top-60 -left-60 opacity-15"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }}
      />
      <div
        className="orb w-[500px] h-[500px] top-1/2 -right-60 opacity-10"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }}
      />

      {/* HERO */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 gap-5">
        <motion.p
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-xs tracking-[0.2em] text-violet-400/40 uppercase"
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
          transition={{ delay: 1.2, duration: 1 }}
          className="flex flex-col items-center gap-1.5 mt-6 text-white/25"
        >
          <span className="font-mono text-xs tracking-widest uppercase">scroll para ver mi perfil</span>
          <span className="font-mono text-base">↓</span>
        </motion.div>
      </section>

      {/* PROFILE */}
      <section ref={profileRef} className="relative z-10 pb-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center gap-6"
          >
            <div
              className="relative w-72 h-72 md:w-96 md:h-96 rounded-3xl overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(109,40,217,0.30), 0 0 120px rgba(37,99,235,0.12)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/danna.jpg"
                alt="Danna Salamanca"
                className="w-full h-full object-cover"
              />
              {/* gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b0818] to-transparent" />
            </div>

            <div className="text-center">
              <p className="text-2xl font-black text-white">Danna Salamanca</p>
              <p className="text-violet-300/70 font-mono text-xs mt-1.5 tracking-wide">
                Payments Operations Engineer · VAAS
              </p>
            </div>
          </motion.div>

          {/* SQL card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="glass-strong overflow-hidden"
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              borderRadius: '14px',
            }}
          >
            {/* Terminal header */}
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="text-white/25 text-xs ml-3">danna_salamanca.sql</span>
            </div>

            {/* Query */}
            <div className="px-5 py-3.5 text-xs text-white/35 border-b border-white/5">
              <span className="text-violet-400/80">SELECT</span>
              <span className="text-white/60"> *</span>
              <span className="text-violet-400/80"> FROM</span>
              <span className="text-cyan-300/80"> danna_salamanca</span>
              <span className="text-white/60">;</span>
            </div>

            {/* Result rows */}
            <div className="divide-y divide-white/4">
              {sqlRows.map((row, i) => (
                <motion.div
                  key={row.campo}
                  initial={{ opacity: 0, y: 8 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.35, delay: 0.3 + i * 0.045 }}
                  className="flex items-start gap-3 px-5 py-2.5 hover:bg-white/2 transition-colors"
                >
                  <span className="text-white/20 text-xs w-4 flex-shrink-0 pt-0.5 select-none">{i + 1}</span>
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="text-blue-300/80 flex-shrink-0 text-xs">{row.campo}</span>
                    <span className="text-white/15 flex-shrink-0 text-xs">=</span>
                    <span className={`text-xs break-words min-w-0 ${valorColor[row.color]}`}>
                      {row.valor}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Row count */}
            <div className="px-5 py-3 text-xs text-white/20 border-t border-white/5">
              {sqlRows.length} rows in set
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
