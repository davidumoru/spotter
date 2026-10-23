import type {Cue, CueTone, Phase, RepRecord, RepState, WorkoutStats} from '@spotter/protocol';

export interface Point {
  x: number;
  y: number;
  visibility?: number;
}

const LEFT = {hip: 23, knee: 25, ankle: 27};
const RIGHT = {hip: 24, knee: 26, ankle: 28};

const MIN_VISIBILITY = 0.5;
const DOWN_ANGLE = 100;
const UP_ANGLE = 160;
const PARTIAL_ANGLE = 140;
const DEEP_ANGLE = 85;
const SMOOTHING = 0.4;

export function angleAt(a: Point, b: Point, c: Point): number {
  const ab = Math.atan2(a.y - b.y, a.x - b.x);
  const cb = Math.atan2(c.y - b.y, c.x - b.x);
  let deg = Math.abs(((ab - cb) * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return deg;
}

export class SquatCounter {
  private reps = 0;
  private partialReps = 0;
  private phase: Phase = 'up';
  private smoothed: number | null = null;
  private tracking = false;
  private lowest = 180;
  private repStart: number | null = null;
  private repLog: RepRecord[] = [];
  private cue?: Cue;
  private cueId = 0;
  private readonly startedAt: number;

  constructor(private now: () => number = Date.now) {
    this.startedAt = now();
  }

  update(landmarks: Point[] | undefined): RepState {
    const side = landmarks && pickSide(landmarks);
    if (!landmarks || !side) {
      this.tracking = false;
      return this.state();
    }

    this.tracking = true;
    const raw = angleAt(landmarks[side.hip], landmarks[side.knee], landmarks[side.ankle]);
    const angle = this.smoothed === null ? raw : this.smoothed + SMOOTHING * (raw - this.smoothed);
    this.smoothed = angle;

    if (angle < UP_ANGLE && this.repStart === null) this.repStart = this.now();
    this.lowest = Math.min(this.lowest, angle);

    if (this.phase === 'up' && angle < DOWN_ANGLE) {
      this.phase = 'down';
    } else if (angle > UP_ANGLE) {
      if (this.phase === 'down') this.completeRep();
      else if (this.lowest < PARTIAL_ANGLE) this.partialRep();
      this.phase = 'up';
      this.lowest = 180;
      this.repStart = null;
    }
    return this.state();
  }

  state(): RepState {
    return {
      exercise: 'squat',
      reps: this.reps,
      phase: this.phase,
      kneeAngle: Math.round(this.smoothed ?? 180),
      tracking: this.tracking,
      cue: this.cue,
      ts: this.now(),
    };
  }

  stats(): WorkoutStats {
    const depths = this.repLog.map((r) => r.depth);
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    const avgDepth = avg(depths);
    const avgRepMs = avg(this.repLog.map((r) => r.durationMs));
    return {
      exercise: 'squat',
      reps: this.reps,
      partialReps: this.partialReps,
      durationSec: Math.round((this.now() - this.startedAt) / 1000),
      avgDepth: avgDepth === null ? null : Math.round(avgDepth),
      bestDepth: depths.length ? Math.round(Math.min(...depths)) : null,
      avgRepSec: avgRepMs === null ? null : Math.round(avgRepMs / 100) / 10,
      repLog: this.repLog,
    };
  }

  private completeRep() {
    this.reps += 1;
    this.repLog.push({
      depth: Math.round(this.lowest),
      durationMs: this.repStart === null ? 0 : this.now() - this.repStart,
    });
    this.setCue(this.lowest <= DEEP_ANGLE ? `${this.reps}! Great depth` : String(this.reps), 'good');
  }

  private partialRep() {
    this.partialReps += 1;
    this.setCue('Go lower', 'warn');
  }

  private setCue(text: string, tone: CueTone) {
    this.cueId += 1;
    this.cue = {id: this.cueId, text, tone};
  }
}

function pickSide(lm: Point[]) {
  const score = (s: typeof LEFT) =>
    Math.min(lm[s.hip]?.visibility ?? 0, lm[s.knee]?.visibility ?? 0, lm[s.ankle]?.visibility ?? 0);
  const l = score(LEFT);
  const r = score(RIGHT);
  const best = l >= r ? LEFT : RIGHT;
  return Math.max(l, r) >= MIN_VISIBILITY ? best : undefined;
}
