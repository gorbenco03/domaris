/**
 * RIVA - Tutorial Context
 * Manages references to tutorial target elements
 */

import React, { createContext, useContext, useCallback, useRef, ReactNode } from 'react';
import { View } from 'react-native';
import { ElementBounds, TutorialContextValue } from '../types';

// ============================================
// CONTEXT
// ============================================

const TutorialContext = createContext<TutorialContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const targetsRef = useRef<Map<string, React.RefObject<View | null>>>(new Map());

  const registerTarget = useCallback((key: string, ref: React.RefObject<View | null>) => {
    targetsRef.current.set(key, ref);
  }, []);

  const unregisterTarget = useCallback((key: string) => {
    targetsRef.current.delete(key);
  }, []);

  const getTargetBounds = useCallback(async (key: string): Promise<ElementBounds | null> => {
    const ref = targetsRef.current.get(key);

    if (!ref?.current) {
      console.warn(`[Tutorial] Target "${key}" not found or not mounted`);
      return null;
    }

    return new Promise((resolve) => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width === 0 && height === 0) {
          console.warn(`[Tutorial] Target "${key}" has zero dimensions`);
          resolve(null);
          return;
        }
        resolve({ x, y, width, height });
      });
    });
  }, []);

  const value: TutorialContextValue = {
    targets: targetsRef.current,
    registerTarget,
    unregisterTarget,
    getTargetBounds,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useTutorialContext = (): TutorialContextValue => {
  const context = useContext(TutorialContext);

  if (!context) {
    throw new Error('useTutorialContext must be used within a TutorialProvider');
  }

  return context;
};

export default TutorialContext;
