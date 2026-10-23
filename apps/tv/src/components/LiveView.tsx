import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {RepState} from '@spotter/protocol';
import {CueBanner} from './CueBanner';
import {COLORS, TABULAR} from '../theme';

export const LiveView = ({state}: {state: RepState}) => {
  const depth = Math.max(0, Math.min(1, (180 - state.kneeAngle) / 90));
  const atDepth = depth >= 0.9;
  const status = !state.tracking ? 'Step into frame' : state.phase === 'down' ? 'Drive up!' : 'Squat down';

  return (
    <View style={styles.root}>
      <View style={styles.live}>
        <View style={styles.repsPanel}>
          <Text style={styles.label}>SQUATS</Text>
          <Text style={[styles.reps, TABULAR]} testID="reps">
            {state.reps}
          </Text>
        </View>
        <View style={styles.side}>
          <View style={styles.card}>
            <Text style={styles.label}>DEPTH</Text>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, {width: `${depth * 100}%`, backgroundColor: atDepth ? COLORS.good : COLORS.accent}]}
              />
            </View>
            <Text style={[styles.cardValue, TABULAR]}>
              {state.tracking ? `${state.kneeAngle}° knee${atDepth ? ' · parallel' : ''}` : '—'}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>STATUS</Text>
            <Text style={styles.cardValue}>{status}</Text>
          </View>
        </View>
      </View>
      <CueBanner cue={state.cue} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  live: {flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: 48},
  repsPanel: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  reps: {color: COLORS.fg, fontSize: 320, fontWeight: '800', lineHeight: 340, textAlign: 'center'},
  side: {flex: 1, gap: 32},
  card: {backgroundColor: COLORS.panel, borderRadius: 28, padding: 32},
  label: {color: COLORS.muted, fontSize: 22, fontWeight: '600', letterSpacing: 3, textAlign: 'center'},
  cardValue: {color: COLORS.fg, fontSize: 44, fontWeight: '700', marginTop: 12},
  barTrack: {height: 24, borderRadius: 12, backgroundColor: COLORS.track, marginTop: 20, overflow: 'hidden'},
  barFill: {height: '100%', borderRadius: 12},
});
