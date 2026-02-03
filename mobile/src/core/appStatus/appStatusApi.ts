import apiClient from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';

export type AppPlatform = 'ios' | 'android';

export type AppStatusResponse = {
  timestamp: string;
  maintenance: {
    enabled: boolean;
    message: string;
  };
  version: {
    platform: AppPlatform | null;
    current: string | null;
    minSupported: string | null;
    latest: string | null;
    updateRequired: boolean;
    updateAvailable: boolean;
    iosStoreUrl: string | null;
    androidStoreUrl: string | null;
  };
};

export async function fetchAppStatus(params: {
  platform: AppPlatform;
  version: string;
}): Promise<AppStatusResponse> {
  const res = await apiClient.get<AppStatusResponse>(API_ENDPOINTS.APP.STATUS, {
    params,
  });
  return res.data;
}
