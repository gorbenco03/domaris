/**
 * IMOBI - Tutorial Feature Types
 */

import { RefObject } from 'react';
import { View } from 'react-native';

// ============================================
// ELEMENT BOUNDS
// ============================================

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================
// TUTORIAL STEP
// ============================================

export interface TutorialStep {
  id: string;
  targetKey: string;
  title: string;
  description: string;
  tooltipPosition?: 'top' | 'bottom' | 'auto';
  highlightPadding?: number;
  highlightBorderRadius?: number;
}

// ============================================
// TUTORIAL STATE
// ============================================

export interface TutorialState {
  hasSeenTutorialPrompt: boolean;
  hasCompletedTutorial: boolean;
  isTutorialActive: boolean;
  currentStepIndex: number;
}

// ============================================
// TUTORIAL CONTEXT
// ============================================

export interface TutorialTarget {
  key: string;
  ref: RefObject<View | null>;
}

export interface TutorialContextValue {
  targets: Map<string, RefObject<View | null>>;
  registerTarget: (key: string, ref: RefObject<View | null>) => void;
  unregisterTarget: (key: string) => void;
  getTargetBounds: (key: string) => Promise<ElementBounds | null>;
}

// ============================================
// TOOLTIP POSITION
// ============================================

export type TooltipPosition = 'top' | 'bottom';

export interface TooltipLayout {
  position: TooltipPosition;
  top: number;
  left: number;
  arrowLeft: number;
}
