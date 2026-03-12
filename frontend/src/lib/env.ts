/**
 * RIVA Frontend - Environment Configuration
 * Typed environment variables (aligned with mobile/src/config/env.ts)
 */

interface EnvConfig {
  API_URL: string;
  WS_URL: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  DEBUG_MODE: boolean;
  MAPBOX_ACCESS_TOKEN: string;
}

const getEnvConfig = (): EnvConfig => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const wsBase = apiUrl.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');

  return {
    API_URL: apiUrl,
    WS_URL: process.env.NEXT_PUBLIC_WS_URL || wsBase,
    ENVIRONMENT: (process.env.NEXT_PUBLIC_ENV || 'development') as EnvConfig['ENVIRONMENT'],
    DEBUG_MODE: process.env.NEXT_PUBLIC_ENV !== 'production',
    MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  };
};

export const env = getEnvConfig();

export const isDevelopment = env.ENVIRONMENT === 'development';
export const isStaging = env.ENVIRONMENT === 'staging';
export const isProduction = env.ENVIRONMENT === 'production';

export default env;
