/**
 * RIVA Frontend - useRequireVerification hook
 * Checks if user meets minimum verification level
 */

"use client";

import { useAuth } from '@/contexts/AuthContext';
import { VERIFICATION_LEVELS } from '@/lib/constants';

export function useRequireVerification(minLevel: number = VERIFICATION_LEVELS.EMAIL_VERIFIED) {
  const { user, isAuthenticated } = useAuth();

  const verificationLevel = user?.verificationLevel ?? 0;
  const isVerified = verificationLevel >= minLevel;
  const needsVerification = isAuthenticated && !isVerified;

  return {
    isVerified,
    needsVerification,
    verificationLevel,
    isAuthenticated,
  };
}

export default useRequireVerification;
