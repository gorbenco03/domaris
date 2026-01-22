/**
 * IMOBI - Auth Provider
 * Authentication context and initialization
 * Connected to real backend API
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore, User } from '@/core/stores/authStore';
import { tokenManager } from '@/core/auth/tokenManager';
import { authApi } from '@/features/auth/api';

// ============================================
// CONTEXT
// ============================================

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Register data (aligned with backend - no userType per ADR-001)
 */
interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const store = useAuthStore();

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    store.setLoading(true);

    try {
      const hasValidTokens = await tokenManager.hasValidTokens();

      if (hasValidTokens) {
        await refreshUser();
      } else {
        store.setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      store.setUser(null);
    } finally {
      store.setLoading(false);
      store.setInitialized(true);
    }
  };

  /**
   * Login with email and password (real backend call)
   */
  const login = async (email: string, password: string): Promise<void> => {
    store.setLoading(true);

    try {
      const response = await authApi.loginWithEmail({ email, password });

      await store.login(
        response.user,
        response.accessToken,
        response.refreshToken
      );
    } catch (error) {
      store.setLoading(false);
      throw error;
    }
  };

  /**
   * Register with email and password (real backend call)
   */
  const register = async (data: RegisterData): Promise<void> => {
    store.setLoading(true);

    try {
      const response = await authApi.registerWithEmail(data);

      await store.login(
        response.user,
        response.accessToken,
        response.refreshToken
      );
    } catch (error) {
      store.setLoading(false);
      throw error;
    }
  };

  /**
   * Logout (real backend call)
   */
  const logout = async (): Promise<void> => {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await store.logout();
    }
  };

  /**
   * Refresh user data from backend
   */
  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await authApi.getCurrentUser();
      store.setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
      // If token is invalid, logout
      await store.logout();
      throw error;
    }
  };

  const value: AuthContextValue = {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthProvider;
