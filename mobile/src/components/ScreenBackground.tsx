import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Theme } from '../theme';

type Props = {
  children: React.ReactNode;
};

export const ScreenBackground: React.FC<Props> = ({ children }) => {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[
          Theme.colors.gradientTop,
          Theme.colors.gradientMid,
          Theme.colors.gradientBottom,
        ]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.orbPrimary} />
      <View style={styles.orbAccent} />
      <View style={styles.orbWarm} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
  },
  orbPrimary: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 140,
    backgroundColor: 'rgba(91, 124, 250, 0.18)',
  },
  orbAccent: {
    position: 'absolute',
    top: 160,
    right: -90,
    width: 220,
    height: 220,
    borderRadius: 140,
    backgroundColor: 'rgba(77, 230, 199, 0.2)',
  },
  orbWarm: {
    position: 'absolute',
    bottom: -120,
    left: 40,
    width: 260,
    height: 260,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 180, 84, 0.12)',
  },
});
