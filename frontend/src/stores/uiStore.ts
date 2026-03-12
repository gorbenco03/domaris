/**
 * RIVA Frontend - UI Store
 * Zustand store for UI state (aligned with mobile/src/core/stores/uiStore.ts)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'ro' | 'en';

export interface UIState {
  // State
  themeMode: ThemeMode;
  language: Language;
  hasCompletedOnboarding: boolean;

  // Tutorial State
  hasSeenTutorialPrompt: boolean;
  hasCompletedTutorial: boolean;
  isTutorialActive: boolean;
  currentTutorialStep: number;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  setOnboardingComplete: (complete: boolean) => void;

  // Tutorial Actions
  setTutorialPromptSeen: (seen: boolean) => void;
  startTutorial: () => void;
  nextTutorialStep: () => void;
  prevTutorialStep: () => void;
  endTutorial: (completed: boolean) => void;
  resetTutorial: () => void;
}

// ============================================
// STORE
// ============================================

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial State
      themeMode: 'system',
      language: 'ro',
      hasCompletedOnboarding: false,

      // Tutorial Initial State
      hasSeenTutorialPrompt: false,
      hasCompletedTutorial: false,
      isTutorialActive: false,
      currentTutorialStep: 0,

      // Actions
      setThemeMode: (themeMode) => {
        set({ themeMode });
      },

      setLanguage: (language) => {
        set({ language });
      },

      setOnboardingComplete: (hasCompletedOnboarding) => {
        set({ hasCompletedOnboarding });
      },

      // Tutorial Actions
      setTutorialPromptSeen: (hasSeenTutorialPrompt) => {
        set({ hasSeenTutorialPrompt });
      },

      startTutorial: () => {
        set({
          isTutorialActive: true,
          currentTutorialStep: 0,
          hasSeenTutorialPrompt: true,
        });
      },

      nextTutorialStep: () => {
        const { currentTutorialStep } = get();
        set({ currentTutorialStep: currentTutorialStep + 1 });
      },

      prevTutorialStep: () => {
        const { currentTutorialStep } = get();
        if (currentTutorialStep > 0) {
          set({ currentTutorialStep: currentTutorialStep - 1 });
        }
      },

      endTutorial: (completed) => {
        set({
          isTutorialActive: false,
          hasCompletedTutorial: completed,
          currentTutorialStep: 0,
        });
      },

      resetTutorial: () => {
        set({
          hasSeenTutorialPrompt: false,
          hasCompletedTutorial: false,
          isTutorialActive: false,
          currentTutorialStep: 0,
        });
      },
    }),
    {
      name: 'riva-ui-storage',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    }
  )
);

export default useUIStore;
