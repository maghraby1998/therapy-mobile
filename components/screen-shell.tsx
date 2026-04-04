import { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

type ScreenShellProps = {
  children: ReactNode;
};

export function ScreenShell({ children }: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  background: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: '#30267A',
    opacity: 0.55,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: '#163D70',
    opacity: 0.45,
  },
  content: {
    flex: 1,
  },
});
