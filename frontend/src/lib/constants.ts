/**
 * RIVA Frontend - Application Constants
 * Aligned with mobile/src/config/constants.ts
 */

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'riva_access_token',
  REFRESH_TOKEN: 'riva_refresh_token',
  USER_DATA: 'riva_user',
  THEME_MODE: 'riva_theme_mode',
  LANGUAGE: 'riva_language',
  ONBOARDING_COMPLETED: 'riva_onboarding_completed',
  SEARCH_HISTORY: 'riva_search_history',
  PENDING_EMAIL: 'riva_pending_email',
  PENDING_PASSWORD: 'riva_pending_password',
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
  SEARCH_SUGGESTIONS: 'search-suggestions',

  // Favorites
  FAVORITES: 'favorites',
  FAVORITE_LISTS: 'favorite-lists',

  // Messages
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  UNREAD_COUNT: 'unread-count',

  // Viewings
  VIEWINGS: 'viewings',
  VIEWING_AVAILABILITY: 'viewing-availability',

  // Profile
  PROFILE: 'profile',
  USER_PROFILE: 'user-profile',
  PUBLIC_PROFILE: 'public-profile',

  // Notifications
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_PREFERENCES: 'notification-preferences',

  // AI
  AI_CHAT: 'ai-chat',
  AI_ANALYSIS: 'ai-analysis',
  AI_CONVERSATIONS: 'ai-conversations',
  AI_VALUATION: 'ai-valuation',

  // Monetization
  SUBSCRIPTION_PLANS: 'subscription-plans',
  USER_SUBSCRIPTION: 'user-subscription',
  MONETIZATION_STATUS: 'monetization-status',
  PROMOTIONS: 'promotions',

  // Reviews
  REVIEWS: 'reviews',
  REVIEW_STATS: 'review-stats',

  // Saved Searches
  SAVED_SEARCHES: 'saved-searches',

  // App
  APP_STATUS: 'app-status',
} as const;

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_REGEX: /^(\+373|0)[0-9]{8}$/,
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
// VERIFICATION LEVELS
// ============================================

export const VERIFICATION_LEVELS = {
  UNVERIFIED: 0,
  EMAIL_VERIFIED: 1,
  PHONE_VERIFIED: 2,
  ID_VERIFIED: 3,
} as const;

export const VERIFICATION_LABELS: Record<number, string> = {
  0: 'Neverificat',
  1: 'Email verificat',
  2: 'Telefon verificat',
  3: 'Identitate verificată',
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
  DEFAULT_LATITUDE: 47.0105,       // Chișinău
  DEFAULT_LONGITUDE: 28.8638,
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

// ============================================
// VIEWING TIME SLOTS
// ============================================

export const DEFAULT_TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
] as const;
