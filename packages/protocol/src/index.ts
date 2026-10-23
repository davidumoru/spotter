export type Role = 'tv' | 'phone';
export type Exercise = 'squat';
export type Phase = 'up' | 'down';

export type CueTone = 'good' | 'warn';

export interface Cue {
  id: number;
  text: string;
  tone: CueTone;
}

export interface RepState {
  exercise: Exercise;
  reps: number;
  phase: Phase;
  kneeAngle: number;
  tracking: boolean;
  cue?: Cue;
  ts: number;
}

export interface RepRecord {
  depth: number;
  durationMs: number;
}

export interface WorkoutStats {
  exercise: Exercise;
  reps: number;
  partialReps: number;
  durationSec: number;
  avgDepth: number | null;
  bestDepth: number | null;
  avgRepSec: number | null;
  repLog: RepRecord[];
}

export interface WorkoutSummary {
  stats: WorkoutStats;
  coaching: string;
  source: 'bedrock' | 'local';
}

export type ClientMessage =
  | {type: 'hello'; role: 'tv'}
  | {type: 'join'; role: 'phone'; code: string}
  | {type: 'state'; state: RepState}
  | {type: 'finish'; stats: WorkoutStats};

export type ServerMessage =
  | {type: 'room'; code: string; joinUrl?: string}
  | {type: 'joined'; code: string}
  | {type: 'peer'; role: Role; connected: boolean}
  | {type: 'state'; state: RepState}
  | {type: 'analyzing'}
  | {type: 'summary'; summary: WorkoutSummary}
  | {type: 'error'; message: string};

export const WS_PATH = '/ws';
export const SERVER_PORT = 8787;
export const PHONE_PORT = 5173;
