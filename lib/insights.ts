import { MatchResult, Response, TeamStats } from '@/types';

interface InsightItem {
  title: string;
  detail: string;
  highlight: boolean;
  icon: string;
}

function getMostCommonAnswer(responses: Response[], questionIndex: number): string {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    const answer = r.answers[String(questionIndex)];
    if (answer) counts[answer] = (counts[answer] || 0) + 1;
  }
  let max = 0;
  let top = '';
  for (const [ans, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      top = ans;
    }
  }
  return top;
}

export function generateInsights(
  responses: Response[],
  results: MatchResult[]
): InsightItem[] {
  if (responses.length === 0) return [];

  const topMotivation = getMostCommonAnswer(responses, 2);
  const topWorkStyle = getMostCommonAnswer(responses, 3);
  const topDecision = getMostCommonAnswer(responses, 1);
  const topProblem = getMostCommonAnswer(responses, 0);
  const avgMatch =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.matchWithDanna, 0) / results.length)
      : 0;

  const insights: InsightItem[] = [];

  if (topMotivation) {
    insights.push({
      title: `El equipo se mueve por "${topMotivation}"`,
      detail: `La motivación dominante indica un equipo orientado a ${topMotivation === 'Impacto' ? 'resultados concretos y medibles' : topMotivation === 'Aprender' ? 'crecimiento continuo' : topMotivation === 'Innovar' ? 'disrumpir y explorar nuevas ideas' : 'predictibilidad y proceso'}.`,
      highlight: topMotivation === 'Impacto' || topMotivation === 'Innovar',
      icon: '⚡',
    });
  }

  if (topWorkStyle) {
    insights.push({
      title: `Perfiles predominantemente "${topWorkStyle}"`,
      detail: `La forma de trabajar mayoritaria es ${topWorkStyle.toLowerCase()}. ${topWorkStyle === 'Colaborativo' ? 'Señal de alta cultura de equipo.' : topWorkStyle === 'Autónomo' ? 'Equipo de alta autogestión.' : topWorkStyle === 'Flexible' ? 'Alta adaptabilidad al contexto.' : 'Fuerte orientación al proceso.'}`,
      highlight: topWorkStyle === 'Colaborativo' || topWorkStyle === 'Flexible',
      icon: '💼',
    });
  }

  if (topDecision) {
    insights.push({
      title: `Decisiones guiadas por "${topDecision}"`,
      detail: `El equipo decide principalmente por ${topDecision.toLowerCase()}. ${topDecision === 'Datos' ? 'Alta madurez analítica.' : topDecision === 'Experiencia' ? 'Valoran el conocimiento acumulado.' : topDecision === 'Equipo' ? 'Alta orientación al consenso.' : 'Fuerte intuición de negocio.'}`,
      highlight: topDecision === 'Datos',
      icon: '🧠',
    });
  }

  if (topProblem) {
    insights.push({
      title: `Foco de aportes: "${topProblem}"`,
      detail: `El tipo de problema más valorado por el equipo es ${topProblem.toLowerCase()}, lo que define el área de mayor energía colectiva.`,
      highlight: false,
      icon: '🎯',
    });
  }

  insights.push({
    title: `Compatibilidad promedio con Danna: ${avgMatch}%`,
    detail:
      avgMatch >= 50
        ? 'Alta afinidad de valores y forma de pensar. El equipo y Danna comparten muchas perspectivas.'
        : 'La diversidad de perfiles genera complementariedad — exactamente lo que un equipo de alto rendimiento necesita.',
    highlight: true,
    icon: '🧬',
  });

  return insights;
}

export function computeTeamStats(results: MatchResult[], responses: Response[]): TeamStats {
  const completed = responses.filter((r) => r.completed);
  const avgMatch =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.matchWithDanna, 0) / results.length)
      : 0;

  return {
    totalParticipants: results.length,
    completionRate:
      responses.length > 0 ? Math.round((completed.length / responses.length) * 100) : 0,
    avgMatchWithDanna: avgMatch,
    topMotivation: getMostCommonAnswer(responses, 2),
    topWorkStyle: getMostCommonAnswer(responses, 3),
    topDecisionStyle: getMostCommonAnswer(responses, 1),
  };
}
