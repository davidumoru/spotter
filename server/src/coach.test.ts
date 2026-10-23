import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {WorkoutStats} from '@spotter/protocol';

const send = vi.hoisted(() => vi.fn());
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: class {
    send = send;
  },
  ConverseCommand: class {
    constructor(public input: unknown) {}
  },
}));

import {describeSet, localCoaching, summarize} from './coach';

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

describe('summarize', () => {
  beforeEach(() => {
    send.mockReset();
  });

  it('returns Bedrock coaching with the set in the prompt', async () => {
    send.mockResolvedValue({output: {message: {content: [{text: ' Great set. Sit lower. '}]}}});
    const summary = await summarize(base);
    expect(summary).toEqual({stats: base, coaching: 'Great set. Sit lower.', source: 'bedrock'});
    const {input} = send.mock.calls[0][0];
    expect(input.modelId).toBe('us.amazon.nova-lite-v1:0');
    expect(input.messages[0].content[0].text).toBe(describeSet(base));
  });

  it('falls back to local coaching when Bedrock fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    send.mockRejectedValue(new Error('Error 002'));
    const summary = await summarize(base);
    expect(summary).toEqual({stats: base, coaching: localCoaching(base), source: 'local'});
  });

  it('falls back when Bedrock returns no text', async () => {
    send.mockResolvedValue({output: {message: {content: []}}});
    expect((await summarize(base)).source).toBe('local');
  });
});
