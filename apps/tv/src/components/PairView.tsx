import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {QrCode} from './QrCode';
import {COLORS, TABULAR} from '../theme';

export const PairView = ({code, joinUrl}: {code?: string; joinUrl?: string}) => (
  <View style={styles.root}>
    <View style={styles.copy}>
      <Text style={styles.title}>Your phone is the camera.</Text>
      <Text style={styles.step}>1. Scan the code with your phone camera</Text>
      <Text style={styles.step}>2. Prop it up so your whole body is in view</Text>
      <Text style={styles.step}>3. Squat. Spotter counts and coaches.</Text>
      <Text style={styles.codeLabel}>Or enter this code on your phone</Text>
      <Text style={[styles.code, TABULAR]} testID="pair-code">
        {code ?? '····'}
      </Text>
    </View>
    {joinUrl && <QrCode value={joinUrl} size={420} />}
  </View>
);

const styles = StyleSheet.create({
  root: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 64},
  copy: {flex: 1},
  title: {color: COLORS.fg, fontSize: 64, fontWeight: '800', marginBottom: 32},
  step: {color: COLORS.fg, fontSize: 30, marginBottom: 14},
  codeLabel: {color: COLORS.muted, fontSize: 24, marginTop: 40},
  code: {color: COLORS.accent, fontSize: 120, fontWeight: '800', letterSpacing: 16},
});
