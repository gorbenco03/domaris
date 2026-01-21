/**
 * IMOBI - Tutorial Progress Component
 * Step indicator dots for tutorial
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';

interface TutorialProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const TutorialProgress: React.FC<TutorialProgressProps> = ({
  currentStep,
  totalSteps,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = createStyles(theme, insets.bottom);

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <ProgressDot
          key={index}
          isActive={index === currentStep}
          isPast={index < currentStep}
          theme={theme}
        />
      ))}
    </View>
  );
};

interface ProgressDotProps {
  isActive: boolean;
  isPast: boolean;
  theme: any;
}

const ProgressDot: React.FC<ProgressDotProps> = ({ isActive, isPast, theme }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const width = withTiming(isActive ? 24 : 8, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });

    const backgroundColor = isActive
      ? theme.colors.primary.main
      : isPast
      ? theme.colors.primary.light
      : 'rgba(255, 255, 255, 0.3)';

    return {
      width,
      backgroundColor,
    };
  }, [isActive, isPast]);

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          marginHorizontal: 3,
        },
        animatedStyle,
      ]}
    />
  );
};

const createStyles = (theme: any, bottomInset: number) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: bottomInset + 100,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default TutorialProgress;
