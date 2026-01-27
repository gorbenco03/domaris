/**
 * IMOBI - Tutorial Feature
 * Interactive onboarding tutorial with spotlight/coach marks
 */

// Components
export {
  SpotlightMask,
  TutorialTooltip,
  TutorialProgress,
  TutorialPromptModal,
  TutorialOverlay,
  TutorialGate,
} from './components';

// Hooks
export { useTutorial, useTutorialTarget } from './hooks';

// Context
export { TutorialProvider, useTutorialContext } from './contexts/TutorialContext';

// Types
export type {
  ElementBounds,
  TutorialStep,
  TutorialState,
  TutorialTarget,
  TutorialContextValue,
  TooltipPosition,
  TooltipLayout,
} from './types';

// Constants
export { TUTORIAL_STEPS, TUTORIAL_ANIMATION, TUTORIAL_OVERLAY } from './constants';
