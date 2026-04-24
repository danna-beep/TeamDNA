import { Question } from '@/types';

export const QUESTIONS: Question[] = [
  {
    id: 0,
    text: '¿En qué tipo de problemas disfrutas aportar más?',
    emoji: '🎯',
    options: [
      'Entender al usuario / cliente',
      'Optimizar procesos',
      'Analizar información y tomar decisiones',
      'Diseñar soluciones / experiencias',
      'Ejecutar y hacer que las cosas pasen',
    ],
  },
  {
    id: 1,
    text: 'Cuando tomas decisiones importantes, ¿qué pesa más?',
    emoji: '🧠',
    options: ['Datos y evidencia', 'Experiencia previa', 'Intuición', 'Consenso del equipo'],
  },
  {
    id: 2,
    text: '¿Qué te motiva más en tu trabajo?',
    emoji: '⚡',
    options: ['Impacto real', 'Aprender constantemente', 'Estabilidad', 'Innovar / crear cosas nuevas'],
  },
  {
    id: 3,
    text: '¿Cómo prefieres trabajar?',
    emoji: '💼',
    options: ['Muy estructurado', 'Flexible', 'Autónomo', 'Colaborativo'],
  },
  {
    id: 4,
    text: 'En tu tiempo libre, ¿qué disfrutas más?',
    emoji: '🎮',
    options: ['Deporte', 'Leer / aprender', 'Series / películas', 'Socializar', 'Gaming'],
  },
  {
    id: 5,
    text: '¿Qué tipo de contenido te gusta más?',
    emoji: '📺',
    options: ['Sci-fi', 'Documentales', 'Comedia', 'Negocios / emprendimiento'],
  },
];

// Danna's predefined answers
export const DANNA_ANSWERS: Record<string, string> = {
  '0': 'Analizar información y tomar decisiones',
  '1': 'Datos y evidencia',
  '2': 'Impacto real',
  '3': 'Flexible',
  '4': 'Leer / aprender',
  '5': 'Documentales',
};

export const SESSION_DURATION_SECONDS = 180; // 3 minutes
export const SESSION_ID = 'main';
