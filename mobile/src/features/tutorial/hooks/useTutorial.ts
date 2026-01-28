/**
 * RIVA - useTutorial Hook
 * Main hook for controlling the tutorial flow
 */

import { useCallback } from 'react';
import { useUIStore } from '@/core/stores/uiStore';
import { TUTORIAL_STEPS } from '../constants';

/**
 * Hook providing tutorial control functions and state
 *
 * @example
 * ```tsx
 * const { startTutorial, isActive, currentStep } = useTutorial();
 *
 * // Start tutorial from settings
 * <Button onPress={startTutorial} title="Replay Tutorial" />
 * ```
 */
export const useTutorial = () => {
  const {
    hasSeenTutorialPrompt,
    hasCompletedTutorial,
    isTutorialActive,
    currentTutorialStep,
    setTutorialPromptSeen,
    startTutorial: storeStartTutorial,
    nextTutorialStep,
    prevTutorialStep,
    endTutorial: storeEndTutorial,
    resetTutorial: storeResetTutorial,
  } = useUIStore();

  /**
   * Start the tutorial
   */
  const startTutorial = useCallback(() => {
    storeStartTutorial();
  }, [storeStartTutorial]);

  /**
   * End the tutorial
   * @param completed - Whether the tutorial was completed (vs skipped)
   */
  const endTutorial = useCallback(
    (completed: boolean = false) => {
      storeEndTutorial(completed);
    },
    [storeEndTutorial]
  );

  /**
   * Reset tutorial state (for replay)
   */
  const resetTutorial = useCallback(() => {
    storeResetTutorial();
  }, [storeResetTutorial]);

  /**
   * Mark prompt as seen without starting tutorial
   */
  const dismissPrompt = useCallback(() => {
    setTutorialPromptSeen(true);
  }, [setTutorialPromptSeen]);

  /**
   * Check if tutorial prompt should be shown
   * (User authenticated and hasn't seen prompt yet)
   */
  const shouldShowPrompt = !hasSeenTutorialPrompt;

  /**
   * Current step data
   */
  const currentStep = TUTORIAL_STEPS[currentTutorialStep] || null;
  const totalSteps = TUTORIAL_STEPS.length;
  const isFirstStep = currentTutorialStep === 0;
  const isLastStep = currentTutorialStep === totalSteps - 1;
  const progress = totalSteps > 0 ? (currentTutorialStep + 1) / totalSteps : 0;

  return {
    // State
    isActive: isTutorialActive,
    hasSeenPrompt: hasSeenTutorialPrompt,
    hasCompleted: hasCompletedTutorial,
    shouldShowPrompt,
    currentStepIndex: currentTutorialStep,
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    progress,

    // Actions
    startTutorial,
    endTutorial,
    resetTutorial,
    dismissPrompt,
    nextStep: nextTutorialStep,
    prevStep: prevTutorialStep,
  };
};

export default useTutorial;
