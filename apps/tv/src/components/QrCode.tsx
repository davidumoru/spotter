import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import qrcode from 'qrcode-generator';

interface Props {
  value: string;
  size: number;
}

export const QrCode = ({value, size}: Props) => {
  const matrix = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    return Array.from({length: n}, (_, r) => Array.from({length: n}, (_, c) => qr.isDark(r, c)));
  }, [value]);

  const cell = Math.floor(size / (matrix.length + 4));
  return (
    <View style={[styles.quiet, {padding: cell * 2}]} testID="pair-qr">
      {matrix.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((dark, c) => (
            <View key={c} style={{width: cell, height: cell, backgroundColor: dark ? '#000' : '#fff'}} />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  quiet: {backgroundColor: '#fff', borderRadius: 16},
  row: {flexDirection: 'row'},
});
