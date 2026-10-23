import {describe, expect, it} from 'vitest';
import {SquatCounter, angleAt, type Point} from './squat';

function pose(kneeDeg: number): Point[] {
  const lm: Point[] = Array.from({length: 33}, () => ({x: 0, y: 0, visibility: 0}));
  const rad = (kneeDeg * Math.PI) / 180;
  lm[23] = {x: 0.5, y: 0.4, visibility: 0.9};
  lm[25] = {x: 0.5, y: 0.6, visibility: 0.9};
  lm[27] = {x: 0.5 + 0.2 * Math.sin(rad), y: 0.6 - 0.2 * Math.cos(rad), visibility: 0.9};
  return lm;
}

function run(counter: SquatCounter, angles: number[], frames = 10) {
  for (const a of angles) for (let i = 0; i < frames; i++) counter.update(pose(a));
}

describe('angleAt', () => {
  it('measures the knee angle', () => {
    const lm = pose(90);
    expect(Math.round(angleAt(lm[23], lm[25], lm[27]))).toBe(90);
  });
});

describe('SquatCounter', () => {
  it('counts full squats', () => {
    const c = new SquatCounter();
    run(c, [175, 90, 175, 90, 175]);
    expect(c.state().reps).toBe(2);
  });

  it('flags half squats as partial and cues to go lower', () => {
    const c = new SquatCounter();
    run(c, [175, 125, 175]);
    expect(c.state().reps).toBe(0);
    expect(c.stats().partialReps).toBe(1);
    expect(c.state().cue).toMatchObject({text: 'Go lower', tone: 'warn'});
  });

  it('ignores small knee bends', () => {
    const c = new SquatCounter();
    run(c, [175, 150, 175]);
    expect(c.stats()).toMatchObject({reps: 0, partialReps: 0});
  });

  it('praises deep reps and records depth and tempo', () => {
    let t = 0;
    const c = new SquatCounter(() => t);
    for (const a of [175, 70, 175]) {
      for (let i = 0; i < 10; i++) {
        t += 100;
        c.update(pose(a));
      }
    }
    expect(c.state().cue?.text).toBe('1! Great depth');
    const stats = c.stats();
    expect(stats.reps).toBe(1);
    expect(stats.bestDepth).toBeLessThanOrEqual(75);
    expect(stats.avgRepSec).toBeGreaterThan(1);
  });

  it('reports not tracking when no person is visible', () => {
    const c = new SquatCounter();
    expect(c.update(undefined).tracking).toBe(false);
  });
});
