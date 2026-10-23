import {describe, expect, it} from 'vitest';
import type {WorkoutStats} from '@spotter/protocol';
import {describeSet, localCoaching} from './coach';

const base: WorkoutStats = {
  exercise: 'squat',
  reps: 8,
  partialReps: 0,
  durationSec: 40,
  avgDepth: 92,
  bestDepth: 80,
  avgRepSec: 2.4,
  repLog: [
    {depth: 95, durationMs: 2400},
    {depth: 80, durationMs: 2300},
  ],
};

describe('describeSet', () => {
  it('includes the numbers the model needs', () => {
    const text = describeSet(base);
    expect(text).toContain('Full reps: 8');
    expect(text).toContain('Deepest rep knee angle: 80 degrees');
    expect(text).toContain('95, 80');
  });

  it('omits depth lines when there were no full reps', () => {
    const text = describeSet({...base, reps: 0, avgDepth: null, bestDepth: null, avgRepSec: null, repLog: []});
    expect(text).not.toContain('Average bottom');
  });
});

describe('localCoaching', () => {
  it('praises depth below parallel', () => {
    expect(localCoaching(base)).toContain('below parallel');
  });

  it('cues depth when there were half reps', () => {
    expect(localCoaching({...base, partialReps: 3})).toContain("3 didn't reach depth");
  });

  it('cues tempo when reps are rushed', () => {
    expect(localCoaching({...base, avgRepSec: 1.1})).toContain('Slow the way down');
  });

  it('guides setup when nothing was counted', () => {
    const none = {...base, reps: 0, partialReps: 0, avgDepth: null, bestDepth: null, avgRepSec: null, repLog: []};
    expect(localCoaching(none)).toContain('side-on');
  });
});
