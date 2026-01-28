/**
 * RIVA - Auth Store
 * Zustand store for authentication state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKVStorage } from '@/core/storage/mmkvStorage';
import { tokenManager } from '@/core/auth/tokenManager';
import type { IUserSession } from '@/core/api/types';

// ============================================
// TYPES
// ============================================

/**
 * User type (aligned with backend UserSessionDto)
 */
export type User = IUserSession;

export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

// ============================================
// STORE
// ============================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      // Actions
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: user !== null 
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setInitialized: (isInitialized) => {
        set({ isInitialized });
      },

      login: async (user, accessToken, refreshToken) => {
        await tokenManager.setTokens(accessToken, refreshToken);
        set({ 
          user, 
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        await tokenManager.clearTokens();
        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { ...currentUser, ...updates } 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => createMMKVStorage()),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
