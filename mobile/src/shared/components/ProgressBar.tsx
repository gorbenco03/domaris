/**
 * RIVA - Progress Bar Component
 * Multi-step wizard progress indicator
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  height?: number;
  style?: ViewStyle;
  testID?: string;
}

// ============================================
// COMPONENT
// ============================================

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  showLabel = true,
  showPercentage = true,
  height = 4,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  const percentage = Math.round((currentStep / totalSteps) * 100);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: currentStep / totalSteps,
      duration: theme.animation.duration.normal,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, style]} testID={testID}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.stepLabel, { color: theme.colors.textSecondary }]}>
            Pasul {currentStep} din {totalSteps}
          </Text>
          {showPercentage && (
            <Text style={[styles.percentageLabel, { color: theme.colors.textTertiary }]}>
              {percentage}%
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: theme.colors.divider,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              width,
              backgroundColor: theme.colors.accent.main,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  percentageLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

export default ProgressBar;
