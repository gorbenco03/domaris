/**
 * RIVA - Application Constants
 */

// ============================================
// API CONFIGURATION
// ============================================

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  ANONYMOUS_ID: 'anonymous_id',
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  SEARCH_HISTORY: 'search_history',
  FAVORITES: 'favorites',
} as const;

// ============================================
// QUERY KEYS (React Query)
// ============================================

export const QUERY_KEYS = {
  // Auth
  AUTH_USER: ['auth', 'user'],
  
  // Properties
  PROPERTIES: 'properties',
  PROPERTY_DETAIL: 'property-detail',
  MY_PROPERTIES: 'my-properties',
  
  // Search
  SEARCH_RESULTS: 'search-results',
  SEARCH_FILTERS: 'search-filters',
  
  // Favorites
  FAVORITES: 'favorites',
  
  // Messages
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  
  // Viewings
  VIEWINGS: 'viewings',
  
  // Profile
  PROFILE: 'profile',
  USER_PROFILE: 'user-profile',
  
  // Notifications
  NOTIFICATIONS: 'notifications',
  
  // AI
  AI_CHAT: 'ai-chat',
  AI_ANALYSIS: 'ai-analysis',
} as const;

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_REGEX: /^(\+40|0)[0-9]{9}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MAX_PROPERTY_IMAGES: 20,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
} as const;

// ============================================
// PROPERTY TYPES
// ============================================

export const PROPERTY_TYPES = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  VILLA: 'villa',
  STUDIO: 'studio',
  PENTHOUSE: 'penthouse',
  DUPLEX: 'duplex',
  LAND: 'land',
  COMMERCIAL: 'commercial',
  OFFICE: 'office',
} as const;

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartament',
  house: 'Casă',
  villa: 'Vilă',
  studio: 'Garsonieră',
  penthouse: 'Penthouse',
  duplex: 'Duplex',
  land: 'Teren',
  commercial: 'Spațiu Comercial',
  office: 'Birou',
};

// ============================================
// TRANSACTION TYPES
// ============================================

export const TRANSACTION_TYPES = {
  SALE: 'sale',
  RENT: 'rent',
} as const;

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  sale: 'Vânzare',
  rent: 'Închiriere',
};

// ============================================
// USER TYPES
// ============================================

export const USER_TYPES = {
  SEEKER: 'seeker',
  OWNER: 'owner',
} as const;

export const USER_TYPE_LABELS: Record<string, string> = {
  seeker: 'Căutător',
  owner: 'Proprietar',
};

// ============================================
// CACHE TIMES (React Query)
// ============================================

export const CACHE_TIMES = {
  STALE_TIME: 5 * 60 * 1000,        // 5 minutes
  CACHE_TIME: 30 * 60 * 1000,       // 30 minutes
  REFETCH_INTERVAL: 60 * 1000,      // 1 minute
} as const;

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ============================================
// MAP CONFIG
// ============================================

export const MAP_CONFIG = {
  DEFAULT_LATITUDE: 44.4268,      // București
  DEFAULT_LONGITUDE: 26.1025,
  DEFAULT_ZOOM: 12,
  SEARCH_RADIUS_KM: 50,
} as const;

// ============================================
// APP INFO
// ============================================

export const APP_INFO = {
  NAME: 'RIVA',
  VERSION: '1.0.0',
  DESCRIPTION: 'Platforma Imobiliară Direct de la Proprietari',
  CONTACT_EMAIL: 'contact@riva.ro',
  SUPPORT_EMAIL: 'support@riva.ro',
} as const;
