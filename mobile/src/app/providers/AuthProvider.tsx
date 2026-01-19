/**
 * IMOBI - Auth Provider
 * Authentication context and initialization
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore, User } from '@/core/stores/authStore';
import { tokenManager } from '@/core/auth/tokenManager';
import apiClient from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';

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

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: 'seeker' | 'owner';
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

  const login = async (email: string, password: string): Promise<void> => {
    store.setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Mock user and tokens
      const mockUser: User = {
        id: '123',
        email,
        firstName: 'Utilizator',
        lastName: 'Demo',
        userType: 'seeker',
        isVerified: true,
        isPhoneVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const accessToken = 'mock-access-token';
      const refreshToken = 'mock-refresh-token';
      
      await store.login(mockUser, accessToken, refreshToken);
    } catch (error) {
      store.setLoading(false);
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    store.setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Mock user and tokens
      const mockUser: User = {
        id: '124',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        userType: data.userType,
        isVerified: true,
        isPhoneVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const accessToken = 'mock-access-token';
      const refreshToken = 'mock-refresh-token';
      
      await store.login(mockUser, accessToken, refreshToken);
    } catch (error) {
      store.setLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    await store.logout();
  };

  const refreshUser = async (): Promise<void> => {
    // Just keep the current user for mock
    if (store.user) {
      store.setUser(store.user);
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
