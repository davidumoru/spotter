import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSpotterLink} from './hooks/useSpotterLink';
import {SERVER_HOST} from './config';

const COLORS = {
  bg: '#0b0f14',
  panel: '#121821',
  fg: '#f5f7fa',
  muted: '#8a94a3',
  accent: '#ff6a1a',
  good: '#3ddc97',
};

export const App = () => {
  const link = useSpotterLink();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brand}>Spotter</Text>
        <Text style={styles.headerStatus} testID="link-status">
          {link.status === 'connecting' && `Connecting to ${SERVER_HOST}…`}
          {link.status === 'waiting' && 'Waiting for your phone'}
          {link.status === 'live' && '● Phone connected'}
        </Text>
      </View>

      {link.status === 'live' && link.state ? (
        <LiveView reps={link.state.reps} angle={link.state.kneeAngle} phase={link.state.phase} tracking={link.state.tracking} />
      ) : (
        <PairView code={link.code} />
      )}
    </View>
  );
};

const PairView = ({code}: {code?: string}) => (
  <View style={styles.center}>
    <Text style={styles.pairHint}>On your phone, open Spotter and enter</Text>
    <Text style={styles.code} testID="pair-code">
      {code ?? '····'}
    </Text>
    <Text style={styles.pairSub}>Prop your phone up so your whole body is in view.</Text>
  </View>
);

interface LiveProps {
  reps: number;
  angle: number;
  phase: 'up' | 'down';
  tracking: boolean;
}

const LiveView = ({reps, angle, phase, tracking}: LiveProps) => {
  const depth = Math.max(0, Math.min(1, (180 - angle) / 90));
  return (
    <View style={styles.live}>
      <View style={styles.repsPanel}>
        <Text style={styles.label}>SQUATS</Text>
        <Text style={styles.reps} testID="reps">
          {reps}
        </Text>
      </View>
      <View style={styles.side}>
        <View style={styles.card}>
          <Text style={styles.label}>DEPTH</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, {width: `${depth * 100}%`, backgroundColor: depth >= 0.9 ? COLORS.good : COLORS.accent}]} />
          </View>
          <Text style={styles.cardValue}>{tracking ? `${angle}° knee` : '—'}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>STATUS</Text>
          <Text style={styles.cardValue}>{!tracking ? 'Step into frame' : phase === 'down' ? 'Drive up!' : 'Squat down'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 96, paddingVertical: 56},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  brand: {color: COLORS.fg, fontSize: 40, fontWeight: '700'},
  headerStatus: {color: COLORS.muted, fontSize: 24},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  pairHint: {color: COLORS.muted, fontSize: 32},
  code: {color: COLORS.fg, fontSize: 200, fontWeight: '800', letterSpacing: 24, marginVertical: 16},
  pairSub: {color: COLORS.muted, fontSize: 24},
  live: {flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: 32},
  repsPanel: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  reps: {color: COLORS.fg, fontSize: 320, fontWeight: '800', lineHeight: 340},
  side: {flex: 1, gap: 32},
  card: {backgroundColor: COLORS.panel, borderRadius: 24, padding: 32},
  label: {color: COLORS.muted, fontSize: 22, fontWeight: '600', letterSpacing: 3},
  cardValue: {color: COLORS.fg, fontSize: 44, fontWeight: '700', marginTop: 12},
  barTrack: {height: 24, borderRadius: 12, backgroundColor: '#243041', marginTop: 20, overflow: 'hidden'},
  barFill: {height: '100%', borderRadius: 12},
});
