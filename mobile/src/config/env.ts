/**
 * IMOBI - Environment Configuration
 * Environment variables are loaded from .env files via Expo
 */

interface EnvConfig {
  API_URL: string;
  WS_URL: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  DEBUG_MODE: boolean;
  ENABLE_ANALYTICS: boolean;
  SENTRY_DSN?: string;
  GOOGLE_MAPS_API_KEY?: string;
  MAPBOX_ACCESS_TOKEN: string;
}

const getEnvConfig = (): EnvConfig => {
  const env = process.env.EXPO_PUBLIC_ENV || 'development';
  
  return {
    API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api',
    WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:4000',
    ENVIRONMENT: env as EnvConfig['ENVIRONMENT'],
    DEBUG_MODE: env !== 'production',
    ENABLE_ANALYTICS: env === 'production',
    SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZ29yYmVuY28wMyIsImEiOiJjbGc2OHg0dTQxMjhlMnRyejN5Y2xmZ3d6In0.tTql8D8ra4QBhzSowQtXMg',
  };
};

export const env = getEnvConfig();

export const isDevelopment = env.ENVIRONMENT === 'development';
export const isStaging = env.ENVIRONMENT === 'staging';
export const isProduction = env.ENVIRONMENT === 'production';

export default env;
