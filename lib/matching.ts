import { Response, Participant, MatchResult } from '@/types';
import { DANNA_ANSWERS } from './questions';

const QUESTION_KEYS = Object.keys(DANNA_ANSWERS); // ['0','1','2','3','4','5']

export function calculateMatch(
  answersA: Record<string, string>,
  answersB: Record<string, string>
): number {
  let matches = 0;
  let compared = 0;
  for (const key of QUESTION_KEYS) {
    if (answersA[key] && answersB[key]) {
      compared++;
      if (answersA[key] === answersB[key]) matches++;
    }
  }
  if (compared === 0) return 0;
  return Math.round((matches / QUESTION_KEYS.length) * 100);
}

export function calculateMatchWithDanna(answers: Record<string, string>): number {
  return calculateMatch(answers, DANNA_ANSWERS);
}

export function computeMatchResults(
  participants: Participant[],
  responses: Response[]
): MatchResult[] {
  const responseMap = new Map<string, Response>();
  for (const r of responses) {
    responseMap.set(r.participant_id, r);
  }

  return participants
    .filter((p) => responseMap.has(p.id))
    .map((p) => {
      const myResponse = responseMap.get(p.id)!;
      const matchWithDanna = calculateMatchWithDanna(myResponse.answers);

      const topPeers = participants
        .filter((other) => other.id !== p.id && responseMap.has(other.id))
        .map((other) => ({
          name: other.name,
          match: calculateMatch(myResponse.answers, responseMap.get(other.id)!.answers),
        }))
        .sort((a, b) => b.match - a.match)
        .slice(0, 3);

      return {
        participantId: p.id,
        participantName: p.name,
        matchWithDanna,
        topPeers,
        answers: myResponse.answers,
      };
    })
    .sort((a, b) => b.matchWithDanna - a.matchWithDanna);
}

export function getAvgMatchWithDanna(results: MatchResult[]): number {
  if (results.length === 0) return 0;
  return Math.round(results.reduce((s, r) => s + r.matchWithDanna, 0) / results.length);
}

export function getChartDataForQuestion(
  responses: Response[],
  questionIndex: number,
  options: string[]
): Array<{ name: string; count: number; pct: number }> {
  const counts: Record<string, number> = {};
  for (const opt of options) counts[opt] = 0;

  for (const r of responses) {
    const answer = r.answers[String(questionIndex)];
    if (answer && counts[answer] !== undefined) counts[answer]++;
  }

  const total = responses.length || 1;
  return options.map((opt) => ({
    name: opt,
    count: counts[opt],
    pct: Math.round((counts[opt] / total) * 100),
  }));
}
