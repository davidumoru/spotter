import React from 'react';
import {StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {useSpotterLink} from './hooks/useSpotterLink';
import {SERVER_HOST} from './config';
import {PairView} from './components/PairView';
import {LiveView} from './components/LiveView';
import {SummaryView} from './components/SummaryView';
import {COLORS} from './theme';

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

export const App = () => {
  const link = useSpotterLink();
  const {width, height} = useWindowDimensions();
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);

  const statusText =
    link.status === 'connecting'
      ? `Connecting to ${SERVER_HOST}…`
      : link.phoneConnected
      ? 'Phone connected'
      : 'Waiting for your phone';

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.root,
          {
            left: (width - DESIGN_WIDTH) / 2,
            top: (height - DESIGN_HEIGHT) / 2,
            transform: [{scale}],
          },
        ]}>
        <View style={styles.header}>
          <Text style={styles.brand}>Spotter</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: link.phoneConnected
                    ? COLORS.good
                    : COLORS.muted,
                },
              ]}
            />
            <Text style={styles.headerStatus} testID="link-status">
              {statusText}
            </Text>
          </View>
        </View>

        {link.status === 'summary' ? (
          <SummaryView summary={link.summary} />
        ) : link.status === 'live' && link.state ? (
          <LiveView state={link.state} />
        ) : (
          <PairView code={link.code} joinUrl={link.joinUrl} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.bg},
  root: {
    position: 'absolute',
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 96,
    paddingVertical: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {color: COLORS.fg, fontSize: 40, fontWeight: '800'},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  dot: {width: 14, height: 14, borderRadius: 7},
  headerStatus: {color: COLORS.muted, fontSize: 24},
});
