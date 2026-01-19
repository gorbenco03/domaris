/**
 * IMOBI - UI Store
 * Zustand store for UI state (theme, language, etc.)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKVStorage } from '@/core/storage/mmkvStorage';
import { ThemeMode } from '@/config/theme';

// ============================================
// TYPES
// ============================================

export type Language = 'ro' | 'en';

export interface UIState {
  // State
  themeMode: ThemeMode;
  language: Language;
  hasCompletedOnboarding: boolean;
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  setOnboardingComplete: (complete: boolean) => void;
}

// ============================================
// STORE
// ============================================

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial State
      themeMode: 'system',
      language: 'ro',
      hasCompletedOnboarding: false,

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
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => createMMKVStorage()),
    }
  )
);

export default useUIStore;
