/**
 * IMOBI - Anonymous ID
 * Persistent device identifier for guest analytics.
 */

import { STORAGE_KEYS } from '@/config/constants';
import { storage } from '@/core/storage/mmkvStorage';

const generateAnonymousId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export const getAnonymousId = async (): Promise<string> => {
  const existing = await storage.getString(STORAGE_KEYS.ANONYMOUS_ID);
  if (existing) {
    return existing;
  }

  const next = generateAnonymousId();
  await storage.setString(STORAGE_KEYS.ANONYMOUS_ID, next);
  return next;
};

export default getAnonymousId;
