export type Role = 'tv' | 'phone';
export type Exercise = 'squat';
export type Phase = 'up' | 'down';

export interface RepState {
  exercise: Exercise;
  reps: number;
  phase: Phase;
  kneeAngle: number;
  tracking: boolean;
  ts: number;
}

export type ClientMessage =
  | {type: 'hello'; role: 'tv'}
  | {type: 'join'; role: 'phone'; code: string}
  | {type: 'state'; state: RepState};

export type ServerMessage =
  | {type: 'room'; code: string}
  | {type: 'joined'; code: string}
  | {type: 'peer'; role: Role; connected: boolean}
  | {type: 'state'; state: RepState}
  | {type: 'error'; message: string};

export const WS_PATH = '/ws';
export const SERVER_PORT = 8787;
