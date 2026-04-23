export type SessionStatus = 'waiting' | 'active' | 'completed';

export interface Session {
  id: string;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  name: string;
  email: string | null;
  created_at: string;
}

export interface Response {
  id: string;
  participant_id: string;
  answers: Record<string, string>;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  text: string;
  emoji: string;
  options: string[];
}

export interface MatchResult {
  participantId: string;
  participantName: string;
  matchWithDanna: number;
  topPeers: Array<{ name: string; match: number }>;
  answers: Record<string, string>;
}

export interface TeamStats {
  totalParticipants: number;
  completionRate: number;
  avgMatchWithDanna: number;
  topMotivation: string;
  topWorkStyle: string;
  topDecisionStyle: string;
}

export interface ChartDataPoint {
  name: string;
  count: number;
  pct: number;
}
