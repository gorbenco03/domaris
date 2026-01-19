/**
 * IMOBI - Divider Component
 * Horizontal divider with optional text
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface DividerProps {
  text?: string;
  style?: ViewStyle;
}

const Divider: React.FC<DividerProps> = ({ text, style }) => {
  const { theme } = useTheme();

  if (!text) {
    return (
      <View
        style={[
          styles.simpleDivider,
          { backgroundColor: theme.colors.divider },
          style,
        ]}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.line, { backgroundColor: theme.colors.divider }]} />
      <Text
        style={[
          styles.text,
          {
            color: theme.colors.textTertiary,
            fontSize: theme.typography.fontSize.sm,
            paddingHorizontal: theme.spacing[4],
          },
        ]}
      >
        {text}
      </Text>
      <View style={[styles.line, { backgroundColor: theme.colors.divider }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  simpleDivider: {
    height: 1,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
  },
  text: {},
});

export default Divider;
