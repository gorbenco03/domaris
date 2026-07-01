/**
 * API Client for Backend Communication
 * Handles authentication, token refresh, and error handling
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'riva_access_token';
const REFRESH_TOKEN_KEY = 'riva_refresh_token';
const USER_KEY = 'riva_user';

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem(USER_KEY);
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  verificationLevel: number;
  isAdmin: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  hasActiveSubscription: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  code?: string; // Only in dev mode
}

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
}

// ============================================================================
// API CLIENT
// ============================================================================

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  /**
   * Make an API request with automatic token refresh
   */
  async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth header if we have a token
    const accessToken = getAccessToken();
    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && accessToken) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Retry the request with new token
        const newAccessToken = getAccessToken();
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
        
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });
        
        if (!retryResponse.ok) {
          throw await this.parseError(retryResponse);
        }
        
        return retryResponse.json();
      } else {
        // Refresh failed - clear tokens and throw
        clearTokens();
        throw { code: 'SESSION_EXPIRED', message: 'Sesiunea a expirat' };
      }
    }

    if (!response.ok) {
      throw await this.parseError(response);
    }

    return response.json();
  }

  /**
   * Try to refresh the access token
   */
  private async tryRefreshToken(): Promise<boolean> {
    // If already refreshing, wait for that to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh(refreshToken);

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doRefresh(refreshToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      // Update access token (refresh token stays the same)
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse error response
   */
  private async parseError(response: Response): Promise<ApiError> {
    try {
      const data = await response.json();
      return {
        code: data.code || 'UNKNOWN_ERROR',
        message: data.message || 'A apărut o eroare',
        statusCode: response.status,
      };
    } catch {
      return {
        code: 'NETWORK_ERROR',
        message: 'Eroare de conexiune',
        statusCode: response.status,
      };
    }
  }
}

export const api = new ApiClient();

// ============================================================================
// AUTH API FUNCTIONS
// ============================================================================

/**
 * Register with email - sends OTP
 */
export async function register(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<OtpResponse> {
  return api.fetch<OtpResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      acceptTerms: true,
      acceptPrivacy: true,
      acceptGdpr: true,
    }),
  });
}

/**
 * Verify email OTP - completes registration
 */
export async function verifyEmailOtp(email: string, code: string): Promise<AuthResponse> {
  return api.fetch<AuthResponse>('/auth/verify-email-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  return api.fetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Logout - revoke refresh token
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    await api.fetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearTokens();
  }
}

/**
 * Resend OTP for registration
 */
export async function resendOtp(email: string, password: string): Promise<OtpResponse> {
  return register({ email, password });
}

/**
 * Forgot password - sends reset email
 */
export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  return api.fetch<{ success: boolean; message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Reset password with the 6-digit code emailed by /auth/forgot-password.
 * Backend ResetPasswordDto expects { email, code, newPassword }.
 */
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  return api.fetch<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
}

/**
 * Change password (authenticated user)
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return api.fetch<{ success: boolean; message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  const user = await api.fetch<User>('/users/me', { method: 'GET' });
  setStoredUser(user);
  return user;
}

