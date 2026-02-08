"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  verifyEmailOtp as apiVerifyOtp,
  resendOtp as apiResendOtp,
  getCurrentUser as apiGetCurrentUser,
  getStoredUser,
  setStoredUser,
  setTokens,
  clearTokens,
  getAccessToken,
  User,
  ApiError,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  logout: () => Promise<void>;
  clearPendingEmail: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session storage key for pending registration
const PENDING_EMAIL_KEY = "riva_pending_email";
const PENDING_PASSWORD_KEY = "riva_pending_password";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true to check stored session
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getAccessToken();
      const storedUser = getStoredUser();
      
      if (token && storedUser) {
        setUser(storedUser);
        // Try to refresh user data from server in background
        try {
          const freshUser = await apiGetCurrentUser();
          setUser(freshUser);
        } catch {
          // If fetching fails, keep using stored user
          // Token refresh will happen automatically if needed
        }
      }
      
      // Also restore pending email if any
      const storedPendingEmail = sessionStorage.getItem(PENDING_EMAIL_KEY);
      if (storedPendingEmail) {
        setPendingEmail(storedPendingEmail);
      }
      
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiLogin(email, password);
      setTokens(response.accessToken, response.refreshToken);
      setStoredUser(response.user);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    setIsLoading(true);
    try {
      await apiRegister({ email, password, firstName, lastName });
      
      // Store pending registration info for OTP verification
      sessionStorage.setItem(PENDING_EMAIL_KEY, email);
      sessionStorage.setItem(PENDING_PASSWORD_KEY, password);
      setPendingEmail(email);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    const email = pendingEmail || sessionStorage.getItem(PENDING_EMAIL_KEY);
    
    if (!email) {
      throw { code: "NO_PENDING_EMAIL", message: "Nu există o înregistrare în așteptare" } as ApiError;
    }

    setIsLoading(true);
    try {
      const response = await apiVerifyOtp(email, code);
      
      // Clear pending registration data
      sessionStorage.removeItem(PENDING_EMAIL_KEY);
      sessionStorage.removeItem(PENDING_PASSWORD_KEY);
      setPendingEmail(null);
      
      // Store tokens and user
      setTokens(response.accessToken, response.refreshToken);
      setStoredUser(response.user);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, [pendingEmail]);

  const resendOtp = useCallback(async () => {
    const email = pendingEmail || sessionStorage.getItem(PENDING_EMAIL_KEY);
    const password = sessionStorage.getItem(PENDING_PASSWORD_KEY);
    
    if (!email || !password) {
      throw { code: "NO_PENDING_EMAIL", message: "Nu există o înregistrare în așteptare" } as ApiError;
    }

    setIsLoading(true);
    try {
      await apiResendOtp(email, password);
    } finally {
      setIsLoading(false);
    }
  }, [pendingEmail]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiLogout();
    } catch {
      // Even if logout fails on server, clear local state
    } finally {
      clearTokens();
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const clearPendingEmail = useCallback(() => {
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
    sessionStorage.removeItem(PENDING_PASSWORD_KEY);
    setPendingEmail(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        pendingEmail,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        clearPendingEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Re-export User type for convenience
export type { User };
