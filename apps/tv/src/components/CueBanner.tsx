import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text} from 'react-native';
import type {Cue} from '@spotter/protocol';
import {COLORS} from '../theme';

export const CueBanner = ({cue}: {cue?: Cue}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!cue) return;
    opacity.setValue(1);
    const fade = Animated.timing(opacity, {toValue: 0, duration: 200, delay: 1600, useNativeDriver: true});
    fade.start();
    return () => fade.stop();
  }, [cue?.id, opacity]);

  if (!cue) return null;
  const color = cue.tone === 'good' ? COLORS.good : COLORS.warn;
  return (
    <Animated.View style={[styles.banner, {opacity, borderColor: color}]} testID="cue">
      <Text style={[styles.icon, {color}]}>{cue.tone === 'good' ? '✓' : '↓'}</Text>
      <Text style={[styles.text, {color}]}>{cue.text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 3,
    backgroundColor: COLORS.panel,
  },
  icon: {fontSize: 40, fontWeight: '800'},
  text: {fontSize: 44, fontWeight: '800'},
});
