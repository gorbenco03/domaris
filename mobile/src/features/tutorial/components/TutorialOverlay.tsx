/**
 * RIVA - Tutorial Overlay Component
 * Main component that combines spotlight, tooltip, and progress
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useUIStore } from '@/core/stores/uiStore';
import { useTutorialContext } from '../contexts/TutorialContext';
import { TUTORIAL_STEPS, TUTORIAL_ANIMATION } from '../constants';
import { ElementBounds } from '../types';
import SpotlightMask from './SpotlightMask';
import TutorialTooltip from './TutorialTooltip';
import TutorialProgress from './TutorialProgress';

export const TutorialOverlay: React.FC = () => {
  const {
    isTutorialActive,
    currentTutorialStep,
    nextTutorialStep,
    prevTutorialStep,
    endTutorial,
  } = useUIStore();

  const { getTargetBounds } = useTutorialContext();

  const [targetBounds, setTargetBounds] = useState<ElementBounds | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Animation for overlay fade
  const overlayOpacity = useSharedValue(0);

  // Current step data
  const currentStep = TUTORIAL_STEPS[currentTutorialStep];
  const totalSteps = TUTORIAL_STEPS.length;
  const isFirstStep = currentTutorialStep === 0;
  const isLastStep = currentTutorialStep === totalSteps - 1;

  // Measure target element when step changes
  const measureTarget = useCallback(async () => {
    if (!currentStep) return;

    const bounds = await getTargetBounds(currentStep.targetKey);
    setTargetBounds(bounds);
  }, [currentStep, getTargetBounds]);

  // Handle tutorial activation
  useEffect(() => {
    if (isTutorialActive) {
      setIsVisible(true);
      overlayOpacity.value = withTiming(1, {
        duration: TUTORIAL_ANIMATION.OVERLAY_FADE_DURATION,
      });
      // Small delay to ensure elements are mounted
      setTimeout(measureTarget, 100);
    } else {
      overlayOpacity.value = withTiming(0, {
        duration: TUTORIAL_ANIMATION.OVERLAY_FADE_DURATION,
      }, () => {
        runOnJS(setIsVisible)(false);
      });
    }
  }, [isTutorialActive]);

  // Re-measure when step changes
  useEffect(() => {
    if (isTutorialActive && currentStep) {
      measureTarget();
    }
  }, [currentTutorialStep, isTutorialActive]);

  // Handlers
  const handleNext = useCallback(() => {
    if (isLastStep) {
      endTutorial(true);
    } else {
      nextTutorialStep();
    }
  }, [isLastStep, endTutorial, nextTutorialStep]);

  const handlePrev = useCallback(() => {
    prevTutorialStep();
  }, [prevTutorialStep]);

  const handleSkip = useCallback(() => {
    endTutorial(false);
  }, [endTutorial]);

  // Handle tap on highlighted area (advance to next)
  const handleSpotlightTap = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!isVisible || !currentStep) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <Animated.View style={[styles.container, animatedOverlayStyle]}>
        {/* Spotlight Mask */}
        <SpotlightMask
          targetBounds={targetBounds}
          padding={currentStep.highlightPadding}
          borderRadius={currentStep.highlightBorderRadius}
        />

        {/* Touchable area over spotlight (to advance) */}
        {targetBounds && (
          <TouchableWithoutFeedback onPress={handleSpotlightTap}>
            <View
              style={[
                styles.spotlightTouchArea,
                {
                  left: targetBounds.x - (currentStep.highlightPadding || 8),
                  top: targetBounds.y - (currentStep.highlightPadding || 8),
                  width: targetBounds.width + (currentStep.highlightPadding || 8) * 2,
                  height: targetBounds.height + (currentStep.highlightPadding || 8) * 2,
                },
              ]}
            />
          </TouchableWithoutFeedback>
        )}

        {/* Tooltip */}
        <TutorialTooltip
          title={currentStep.title}
          description={currentStep.description}
          currentStep={currentTutorialStep}
          totalSteps={totalSteps}
          targetBounds={targetBounds}
          preferredPosition={currentStep.tooltipPosition || 'auto'}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />

        {/* Progress Indicator */}
        <TutorialProgress
          currentStep={currentTutorialStep}
          totalSteps={totalSteps}
        />
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  spotlightTouchArea: {
    position: 'absolute',
    zIndex: 10,
  },
});

export default TutorialOverlay;
