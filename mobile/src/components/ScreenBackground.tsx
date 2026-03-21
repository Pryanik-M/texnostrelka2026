import React from 'react';
import { View, StyleSheet, ImageBackground, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Theme } from '../theme';

type Props = {
  children: React.ReactNode;
};

export const ScreenBackground: React.FC<Props> = ({ children }) => {
  const resizeMode = Platform.OS === 'android' ? 'cover' : 'repeat';

  return (
    <ImageBackground
      source={require('../../assets/img/fon1.png')}
      style={styles.root}
      imageStyle={styles.image}
      resizeMode={resizeMode}
    >
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
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  image: {
    opacity: 1,
  },
  content: {
    flex: 1,
  },
});
