import {reduce, type SpotterLink} from '../src/hooks/useSpotterLink';

const waiting: SpotterLink = {status: 'waiting', code: '1234', phoneConnected: false};
const state = {exercise: 'squat' as const, reps: 3, phase: 'up' as const, kneeAngle: 170, tracking: true, ts: 0};
const summary = {
  stats: {exercise: 'squat' as const, reps: 3, partialReps: 0, durationSec: 10, avgDepth: 90, bestDepth: 88, avgRepSec: 2, repLog: []},
  coaching: 'Nice.',
  source: 'local' as const,
};

describe('reduce', () => {
  it('stores the pairing code and join url', () => {
    const next = reduce({status: 'connecting', phoneConnected: false}, {type: 'room', code: '1234', joinUrl: 'https://x/?code=1234'});
    expect(next).toMatchObject({status: 'waiting', code: '1234', joinUrl: 'https://x/?code=1234'});
  });

  it('goes live on phone state', () => {
    expect(reduce(waiting, {type: 'state', state})).toMatchObject({status: 'live', phoneConnected: true, state});
  });

  it('shows analyzing then the summary after a set', () => {
    const analyzing = reduce({...waiting, status: 'live', state}, {type: 'analyzing'});
    expect(analyzing).toMatchObject({status: 'summary', summary: undefined});
    expect(reduce(analyzing, {type: 'summary', summary})).toMatchObject({status: 'summary', summary});
  });

  it('returns to live when a new set starts', () => {
    const done = {...waiting, status: 'summary' as const, summary};
    expect(reduce(done, {type: 'state', state})).toMatchObject({status: 'live', summary: undefined});
  });

  it('returns to pairing when the phone leaves', () => {
    const live = {...waiting, status: 'live' as const, phoneConnected: true, state};
    expect(reduce(live, {type: 'peer', role: 'phone', connected: false})).toMatchObject({status: 'waiting', phoneConnected: false});
  });
});
