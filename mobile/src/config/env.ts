/**
 * RIVA - Environment Configuration
 *
 * All runtime URLs come from EXPO_PUBLIC_* variables injected by EAS at build time.
 * See eas.json for per-profile values.
 *
 * Required env vars for production:
 *   EXPO_PUBLIC_API_URL          — e.g. https://api.riva.md/api
 *   EXPO_PUBLIC_WS_URL           — e.g. wss://api.riva.md
 *   EXPO_PUBLIC_MAPBOX_TOKEN     — public pk.* token (not the secret sk.*)
 *   EXPO_PUBLIC_ENV              — development | staging | production
 *
 * Optional:
 *   EXPO_PUBLIC_SENTRY_DSN
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID / EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
 *   EXPO_PUBLIC_MONETIZATION_ENABLED  — "true" to show monetization UI (default: false)
 */

interface EnvConfig {
  API_URL: string;
  WS_URL: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  DEBUG_MODE: boolean;
  ENABLE_ANALYTICS: boolean;
  SENTRY_DSN?: string;
  GOOGLE_IOS_CLIENT_ID?: string;
  GOOGLE_ANDROID_CLIENT_ID?: string;
  GOOGLE_WEB_CLIENT_ID?: string;
  MAPBOX_ACCESS_TOKEN: string;
  MONETIZATION_ENABLED: boolean;
}

const getEnvConfig = (): EnvConfig => {
  const env = (process.env.EXPO_PUBLIC_ENV as EnvConfig['ENVIRONMENT']) || 'development';

  return {
    API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api',
    WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:4000',
    ENVIRONMENT: env,
    DEBUG_MODE: env !== 'production',
    ENABLE_ANALYTICS: env === 'production',
    SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '',
    MONETIZATION_ENABLED: process.env.EXPO_PUBLIC_MONETIZATION_ENABLED === 'true',
  };
};

export const env = getEnvConfig();

export const isDevelopment = env.ENVIRONMENT === 'development';
export const isStaging = env.ENVIRONMENT === 'staging';
export const isProduction = env.ENVIRONMENT === 'production';

/** Whether monetization/IAP UI is visible. Off by default for v1. */
export const MONETIZATION_ENABLED = env.MONETIZATION_ENABLED;

export default env;
