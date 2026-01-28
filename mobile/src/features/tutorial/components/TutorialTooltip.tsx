/**
 * RIVA - Tutorial Tooltip Component
 * Displays step information with navigation controls
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ArrowLeft, X } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ElementBounds, TooltipPosition } from '../types';
import { TUTORIAL_ANIMATION } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOOLTIP_WIDTH = SCREEN_WIDTH - 48;
const TOOLTIP_MARGIN = 24;
const ARROW_SIZE = 12;

interface TutorialTooltipProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  targetBounds: ElementBounds | null;
  preferredPosition?: TooltipPosition | 'auto';
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export const TutorialTooltip: React.FC<TutorialTooltipProps> = ({
  title,
  description,
  currentStep,
  totalSteps,
  targetBounds,
  preferredPosition = 'auto',
  onNext,
  onPrev,
  onSkip,
  isFirstStep,
  isLastStep,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  // Calculate tooltip position
  const { position, tooltipTop, arrowLeft } = useMemo(() => {
    if (!targetBounds) {
      return {
        position: 'bottom' as TooltipPosition,
        tooltipTop: SCREEN_HEIGHT / 2,
        arrowLeft: SCREEN_WIDTH / 2 - ARROW_SIZE,
      };
    }

    const targetCenterX = targetBounds.x + targetBounds.width / 2;
    const spaceAbove = targetBounds.y - insets.top;
    const spaceBelow = SCREEN_HEIGHT - (targetBounds.y + targetBounds.height) - insets.bottom;

    // Determine position
    let pos: TooltipPosition;
    if (preferredPosition === 'auto') {
      pos = spaceBelow > 200 ? 'bottom' : 'top';
    } else {
      pos = preferredPosition;
    }

    // Calculate top position
    let top: number;
    if (pos === 'bottom') {
      top = targetBounds.y + targetBounds.height + 20;
    } else {
      top = targetBounds.y - 20; // Will be adjusted with transform
    }

    // Calculate arrow position
    const arrowX = Math.min(
      Math.max(targetCenterX - TOOLTIP_MARGIN, 30),
      TOOLTIP_WIDTH - 30
    );

    return {
      position: pos,
      tooltipTop: top,
      arrowLeft: arrowX,
    };
  }, [targetBounds, preferredPosition, insets]);

  // Animate in when target changes
  useEffect(() => {
    opacity.value = 0;
    translateY.value = position === 'bottom' ? 20 : -20;

    opacity.value = withDelay(
      TUTORIAL_ANIMATION.SPOTLIGHT_MOVE_DURATION * 0.5,
      withTiming(1, {
        duration: TUTORIAL_ANIMATION.TOOLTIP_FADE_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    );

    translateY.value = withDelay(
      TUTORIAL_ANIMATION.SPOTLIGHT_MOVE_DURATION * 0.5,
      withTiming(0, {
        duration: TUTORIAL_ANIMATION.TOOLTIP_FADE_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [targetBounds, currentStep]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const styles = createStyles(theme, position, tooltipTop, arrowLeft);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Arrow */}
      <View style={styles.arrow} />

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>
              {currentStep + 1}/{totalSteps}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onSkip}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          {!isFirstStep ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onPrev}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color={theme.colors.textSecondary} />
              <Text style={styles.secondaryButtonText}>Înapoi</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Sări peste</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isLastStep ? 'Gata!' : 'Continuă'}
            </Text>
            {!isLastStep && (
              <ArrowRight size={18} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const createStyles = (
  theme: any,
  position: TooltipPosition,
  tooltipTop: number,
  arrowLeft: number
) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: position === 'bottom' ? tooltipTop : undefined,
      bottom: position === 'top' ? SCREEN_HEIGHT - tooltipTop : undefined,
      left: TOOLTIP_MARGIN,
      width: TOOLTIP_WIDTH,
      zIndex: 1000,
    },
    arrow: {
      position: 'absolute',
      left: arrowLeft,
      width: 0,
      height: 0,
      borderLeftWidth: ARROW_SIZE,
      borderRightWidth: ARROW_SIZE,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      ...(position === 'bottom'
        ? {
            top: -ARROW_SIZE,
            borderBottomWidth: ARROW_SIZE,
            borderBottomColor: theme.colors.surface,
          }
        : {
            bottom: -ARROW_SIZE,
            borderTopWidth: ARROW_SIZE,
            borderTopColor: theme.colors.surface,
          }),
    },
    content: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing[4],
      ...Platform.select({
        ios: theme.shadows.lg,
        android: { elevation: 8 },
      }),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[3],
    },
    stepBadge: {
      backgroundColor: theme.colors.primary.main,
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[1],
      borderRadius: theme.borderRadius.full,
    },
    stepText: {
      color: '#ffffff',
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing[2],
    },
    description: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
      marginBottom: theme.spacing[4],
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary.main,
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[3],
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing[2],
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[3],
      gap: theme.spacing[1],
    },
    secondaryButtonText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
    },
  });

export default TutorialTooltip;
