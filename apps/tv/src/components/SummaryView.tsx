import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {WorkoutSummary} from '@spotter/protocol';
import {COLORS, TABULAR} from '../theme';

const Stat = ({label, value}: {label: string; value: string}) => (
  <View style={styles.stat}>
    <Text style={[styles.statValue, TABULAR]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const SummaryView = ({summary}: {summary?: WorkoutSummary}) => {
  if (!summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.analyzing} testID="analyzing">
          Analyzing your set…
        </Text>
      </View>
    );
  }
  const {stats} = summary;
  return (
    <View style={styles.root} testID="summary">
      <Text style={styles.title}>Set complete</Text>
      <View style={styles.stats}>
        <Stat label="FULL REPS" value={String(stats.reps)} />
        <Stat label="DEEPEST" value={stats.bestDepth === null ? '—' : `${stats.bestDepth}°`} />
        <Stat label="AVG TEMPO" value={stats.avgRepSec === null ? '—' : `${stats.avgRepSec}s`} />
        <Stat label="HALF REPS" value={String(stats.partialReps)} />
      </View>
      <View style={styles.coachCard}>
        <Text style={styles.coachLabel}>
          {summary.source === 'bedrock' ? 'COACH · AMAZON BEDROCK' : 'COACH'}
        </Text>
        <Text style={styles.coaching}>{summary.coaching}</Text>
      </View>
      <Text style={styles.hint}>Tap “Start a new set” on your phone to go again</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  analyzing: {color: COLORS.fg, fontSize: 56, fontWeight: '700'},
  root: {flex: 1, justifyContent: 'center', gap: 36},
  title: {color: COLORS.fg, fontSize: 64, fontWeight: '800'},
  stats: {flexDirection: 'row', gap: 24},
  stat: {flex: 1, backgroundColor: COLORS.panel, borderRadius: 28, padding: 28},
  statValue: {color: COLORS.fg, fontSize: 72, fontWeight: '800'},
  statLabel: {color: COLORS.muted, fontSize: 20, fontWeight: '600', letterSpacing: 3, marginTop: 4},
  coachCard: {backgroundColor: COLORS.panel, borderRadius: 28, padding: 32, borderLeftWidth: 6, borderLeftColor: COLORS.accent},
  coachLabel: {color: COLORS.accent, fontSize: 20, fontWeight: '700', letterSpacing: 3},
  coaching: {color: COLORS.fg, fontSize: 38, lineHeight: 52, marginTop: 12},
  hint: {color: COLORS.muted, fontSize: 24},
});
