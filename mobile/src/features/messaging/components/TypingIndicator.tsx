/**
 * IMOBI - Typing Indicator Component
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface TypingIndicatorProps {
  visible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ visible }) => {
  const { theme } = useTheme();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    const createAnim = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );

    const a1 = createAnim(dot1, 0);
    const a2 = createAnim(dot2, 150);
    const a3 = createAnim(dot3, 300);
    a1.start(); a2.start(); a3.start();

    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [visible]);

  if (!visible) return null;

  const dotStyle = (val: Animated.Value) => ({
    transform: [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
  });

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.textTertiary }, dotStyle(dot1)]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.textTertiary }, dotStyle(dot2)]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.textTertiary }, dotStyle(dot3)]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 4, alignItems: 'flex-start' },
  bubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

export default TypingIndicator;
