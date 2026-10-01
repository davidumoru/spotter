import type {Phase, RepState} from '@spotter/protocol';

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
  private phase: Phase = 'up';
  private smoothed: number | null = null;
  private tracking = false;

  update(landmarks: Point[] | undefined): RepState {
    const side = landmarks && pickSide(landmarks);
    if (!landmarks || !side) {
      this.tracking = false;
      return this.state();
    }

    this.tracking = true;
    const raw = angleAt(landmarks[side.hip], landmarks[side.knee], landmarks[side.ankle]);
    this.smoothed = this.smoothed === null ? raw : this.smoothed + SMOOTHING * (raw - this.smoothed);

    if (this.phase === 'up' && this.smoothed < DOWN_ANGLE) {
      this.phase = 'down';
    } else if (this.phase === 'down' && this.smoothed > UP_ANGLE) {
      this.phase = 'up';
      this.reps += 1;
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
      ts: Date.now(),
    };
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
