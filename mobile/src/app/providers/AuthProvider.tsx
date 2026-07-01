/**
 * RIVA - Auth Provider
 * Authentication context and initialization
 * Connected to real backend API
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore, User } from '@/core/stores/authStore';
import { tokenManager } from '@/core/auth/tokenManager';
import { authApi } from '@/features/auth/api';
import type { IAppleAuthRequest } from '@/core/api/types';
import { registerGlobalLogout } from '@/core/api/client';

// ============================================
// CONTEXT
// ============================================

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (data: IAppleAuthRequest) => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  verifyEmailOtp: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (userData: any) => Promise<void>; // Direct update for client changes
}

/**
 * Register data (aligned with backend - no userType per ADR-001)
 * GDPR: acceptTerms, acceptPrivacy, acceptGdpr mandatory; acceptMarketing, acceptAnalytics optional
 */
interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptGdpr: boolean;
  acceptMarketing?: boolean;
  acceptAnalytics?: boolean;
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

  const ensureAuthTokens = (response: any) => {
    if (
      !response ||
      typeof response.accessToken !== 'string' ||
      typeof response.refreshToken !== 'string'
    ) {
      throw new Error('AUTH_RESPONSE_INVALID');
    }
  };

  /**
   * Login with Google (backend OAuth)
   */
  const loginWithGoogle = async (idToken: string): Promise<void> => {
    store.setLoading(true);

    try {
      const response = await authApi.loginWithGoogle({ idToken });
      ensureAuthTokens(response);

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
   * Login with Apple (backend OAuth)
   */
  const loginWithApple = async (data: IAppleAuthRequest): Promise<void> => {
    store.setLoading(true);

    try {
      const response = await authApi.loginWithApple(data);
      ensureAuthTokens(response);

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

  // Register global logout so the API client can trigger full session clear + redirect
  useEffect(() => {
    registerGlobalLogout(async () => {
      await logout();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      ensureAuthTokens(response);

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
   * Register with email and password (sends OTP)
   */
  const register = async (data: RegisterData): Promise<any> => {
    store.setLoading(true);

    try {
      const response = await authApi.registerWithEmail(data);
      store.setLoading(false);
      return response;
    } catch (error) {
      store.setLoading(false);
      throw error;
    }
  };

  /**
   * Verify email OTP (Pas 2: Finalizează înregistrarea)
   */
  const verifyEmailOtp = async (email: string, code: string): Promise<void> => {
    store.setLoading(true);

    try {
      const response = await authApi.verifyEmailOtp({ email, code });
      ensureAuthTokens(response);

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

  /**
   * Directly update user in store (e.g. after profile edit)
   */
  const updateUser = async (userData: any): Promise<void> => {
    store.setUser({ ...store.user, ...userData });
  };

  const value: AuthContextValue = {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    login,
    loginWithGoogle,
    loginWithApple,
    register,
    verifyEmailOtp,
    logout,
    refreshUser,
    updateUser,
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
