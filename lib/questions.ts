import { Question } from '@/types';

export const QUESTIONS: Question[] = [
  {
    id: 0,
    text: '¿En qué tipo de problemas disfrutas aportar más?',
    emoji: '🎯',
    options: ['Usuario', 'Procesos', 'Datos', 'Diseño', 'Ejecución'],
  },
  {
    id: 1,
    text: '¿Cómo tomas decisiones?',
    emoji: '🧠',
    options: ['Datos', 'Experiencia', 'Intuición', 'Equipo'],
  },
  {
    id: 2,
    text: '¿Qué te motiva?',
    emoji: '⚡',
    options: ['Impacto', 'Aprender', 'Estabilidad', 'Innovar'],
  },
  {
    id: 3,
    text: '¿Cómo trabajas mejor?',
    emoji: '💼',
    options: ['Estructurado', 'Flexible', 'Autónomo', 'Colaborativo'],
  },
  {
    id: 4,
    text: '¿Qué haces en tu tiempo libre?',
    emoji: '🎮',
    options: ['Deporte', 'Leer', 'Series', 'Social', 'Gaming'],
  },
  {
    id: 5,
    text: '¿Qué tipo de contenido consumes?',
    emoji: '📺',
    options: ['Sci-fi', 'Documentales', 'Comedia', 'Negocios'],
  },
];

// Danna's predefined answers
export const DANNA_ANSWERS: Record<string, string> = {
  '0': 'Datos',
  '1': 'Datos',
  '2': 'Impacto',
  '3': 'Flexible',
  '4': 'Leer',
  '5': 'Documentales',
};

export const SESSION_DURATION_SECONDS = 180; // 3 minutes
export const SESSION_ID = 'main';
