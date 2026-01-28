/**
 * RIVA - Storage
 * Cross-platform storage using AsyncStorage (works in Expo Go)
 * 
 * Note: In production with EAS Build, you can switch to MMKV for better performance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

// Storage utility functions
export const storage = {
  /**
   * Get string value
   */
  getString: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getString error:', error);
      return null;
    }
  },

  /**
   * Set string value
   */
  setString: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setString error:', error);
    }
  },

  /**
   * Get number value
   */
  getNumber: async (key: string): Promise<number | null> => {
    const value = await storage.getString(key);
    return value ? Number(value) : null;
  },

  /**
   * Set number value
   */
  setNumber: async (key: string, value: number): Promise<void> => {
    await storage.setString(key, String(value));
  },

  /**
   * Get boolean value
   */
  getBoolean: async (key: string): Promise<boolean | null> => {
    const value = await storage.getString(key);
    return value !== null ? value === 'true' : null;
  },

  /**
   * Set boolean value
   */
  setBoolean: async (key: string, value: boolean): Promise<void> => {
    await storage.setString(key, String(value));
  },

  /**
   * Get JSON object
   */
  getObject: async <T>(key: string): Promise<T | null> => {
    const value = await storage.getString(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Set JSON object
   */
  setObject: async <T>(key: string, value: T): Promise<void> => {
    await storage.setString(key, JSON.stringify(value));
  },

  /**
   * Delete a key
   */
  delete: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage delete error:', error);
    }
  },

  /**
   * Check if key exists
   */
  contains: async (key: string): Promise<boolean> => {
    const value = await storage.getString(key);
    return value !== null;
  },

  /**
   * Get all keys
   */
  getAllKeys: async (): Promise<string[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys as string[];
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  },

  /**
   * Clear all storage
   */
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clearAll error:', error);
    }
  },
};

/**
 * Zustand persist storage adapter
 * Compatible with Zustand's StateStorage interface
 */
export const createZustandStorage = (): StateStorage => ({
  getItem: async (name: string): Promise<string | null> => {
    return await AsyncStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
});

// Export for backward compatibility
export const mmkvStorage = storage;
export const createMMKVStorage = createZustandStorage;

export default storage;
