/**
 * RIVA Frontend - App Status API
 * Checks backend maintenance mode and version status
 */

import { api } from './api';

export interface AppStatusResponse {
  timestamp: string;
  maintenance: {
    enabled: boolean;
    message: string;
  };
  version: {
    platform: string | null;
    current: string | null;
    minSupported: string | null;
    latest: string | null;
    updateRequired: boolean;
    updateAvailable: boolean;
  };
}

export async function fetchAppStatus(): Promise<AppStatusResponse> {
  return api.fetch<AppStatusResponse>('/app/status?platform=web&version=1.0.0');
}
