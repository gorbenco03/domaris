/**
 * IMOBI - Token Manager
 * Secure token storage and management using expo-secure-store
 */

import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/config/constants';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface DecodedToken {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: unknown;
}

class TokenManager {
  /**
   * Get stored access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Store both tokens
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
        throw new Error('Invalid token values');
      }
      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, accessToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ]);
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  /**
   * Clear all tokens (logout)
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Decode JWT token without verification
   */
  decodeToken(token: string): DecodedToken | null {
    try {
      const base64Payload = token.split('.')[1];
      const payload = atob(base64Payload);
      return JSON.parse(payload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    
    if (!decoded) {
      return true;
    }

    // Add 10 second buffer before actual expiration
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const buffer = 10 * 1000; // 10 seconds

    return currentTime >= expirationTime - buffer;
  }

  /**
   * Refresh tokens using refresh token
   */
  async refreshTokens(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();

      if (!refreshToken) {
        return false;
      }

      // Note: We import here to avoid circular dependency
      const { API_CONFIG } = await import('@/config/constants');
      const { API_ENDPOINTS } = await import('@/core/api/endpoints');

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await this.clearTokens();
        return false;
      }

      const data = await response.json();
      const nextRefreshToken = data.refreshToken || refreshToken;
      await this.setTokens(data.accessToken, nextRefreshToken);

      return true;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      await this.clearTokens();
      return false;
    }
  }

  /**
   * Check if user has valid tokens
   */
  async hasValidTokens(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    
    if (!accessToken) {
      return false;
    }

    if (this.isTokenExpired(accessToken)) {
      // Try to refresh
      return this.refreshTokens();
    }

    return true;
  }
}

export const tokenManager = new TokenManager();
export default tokenManager;
