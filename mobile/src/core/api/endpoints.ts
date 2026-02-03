/**
 * RIVA - API Endpoints
 * Centralized endpoint definitions
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_OTP: '/auth/verify-phone-otp',
    VERIFY_EMAIL_OTP: '/auth/verify-email-otp',
    RESEND_OTP: '/auth/resend-otp',
    ME: '/users/me',
  },

  // Users
  USERS: {
    PROFILE: '/users/me',
    UPDATE_PROFILE: '/users/me',
    UPLOAD_AVATAR: '/users/me/avatar',
    CHANGE_PASSWORD: '/auth/change-password', 
    DELETE_ACCOUNT: '/users/me',
    NOTIFICATIONS_SETTINGS: '/users/me/notifications',
    PUBLIC_PROFILE: (id: string) => `/users/${id}`,
    USER_LISTINGS: (id: string) => `/users/${id}/listings`,
  },

  // Properties
  PROPERTIES: {
    LIST: '/properties',
    CREATE: '/properties',
    DETAIL: (id: string) => `/properties/${id}`,
    UPDATE: (id: string) => `/properties/${id}`,
    DELETE: (id: string) => `/properties/${id}`,
    MY_PROPERTIES: '/properties/my',
    VIEW: (id: string) => `/properties/${id}/view`,
    UPLOAD_PHOTOS: (id: string) => `/properties/${id}/photos`, // Backend uses /photos
    DELETE_IMAGE: (id: string, imageId: string) => `/properties/${id}/images/${imageId}`,
    STATS: (id: string) => `/properties/${id}/stats`,
    TOGGLE_ACTIVE: (id: string) => `/properties/${id}/toggle-active`,
  },

  // Search
  SEARCH: {
    PROPERTIES: '/search/properties',
    SUGGESTIONS: '/search/suggestions',
  },

  // Saved Searches (aligned with backend /saved-searches)
  SAVED_SEARCHES: {
    LIST: '/saved-searches',
    CREATE: '/saved-searches',
    DETAIL: (id: string) => `/saved-searches/${id}`,
    DELETE: (id: string) => `/saved-searches/${id}`,
    RUN: (id: string) => `/saved-searches/${id}/run`,
    TOGGLE_ALERTS: (id: string) => `/saved-searches/${id}/alerts`,
  },

  // Favorites
  FAVORITES: {
    LIST: '/favorites',
    ADD: '/favorites',
    REMOVE: (propertyId: string) => `/favorites/${propertyId}`,
    CHECK: (propertyId: string) => `/favorites/check/${propertyId}`,
    LISTS: '/favorites/lists',
    MOVE: '/favorites/move',
    COMPARE: '/favorites/compare',
  },

  // Conversations (Chat/Messaging)
  CONVERSATIONS: {
    LIST: '/conversations',
    CREATE: '/conversations',
    DETAIL: (id: string) => `/conversations/${id}`,
    MESSAGES: (id: string) => `/conversations/${id}/messages`,
    SEND_MESSAGE: (id: string) => `/conversations/${id}/messages`,
    MARK_READ: (id: string) => `/conversations/${id}/read`,
    ARCHIVE: (id: string) => `/conversations/${id}/archive`,
    UNARCHIVE: (id: string) => `/conversations/${id}/unarchive`,
    UNREAD_COUNT: '/conversations/unread-count',
  },

  // Viewings
  VIEWINGS: {
    LIST: '/viewings',
    CREATE: '/viewings',
    DETAIL: (id: string) => `/viewings/${id}`,
    CONFIRM: (id: string) => `/viewings/${id}/confirm`,
    CANCEL: (id: string) => `/viewings/${id}/cancel`,
    RESCHEDULE: (id: string) => `/viewings/${id}/reschedule`,
    AVAILABILITY: (propertyId: string) => `/viewings/availability/${propertyId}`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
    SETTINGS: '/notifications/settings',
  },

  // Devices (for push notification tokens)
  DEVICES: {
    REGISTER_PUSH_TOKEN: '/devices/push-token',
  },

  // AI
  AI: {
    CHAT: '/ai/chat',
    ANALYZE_LISTING: '/ai/analyze-listing',
    SUGGEST_PRICE: '/ai/suggest-price',
    GENERATE_DESCRIPTION: '/ai/generate-description',
    IMPROVE_LISTING: '/ai/improve-listing',
    PROPERTY_SUMMARY: (propertyId: string) => `/ai/property-summary/${propertyId}`,
    // NEW: Conversational Agent & AVM
    AGENT_CHAT: '/ai/agent/chat',
    AGENT_STATS: '/ai/agent/stats',
    AGENT_VALUATION: '/ai/agent/valuation',
    AGENT_VALUATION_LISTING: (listingId: string) => `/ai/agent/valuation/${listingId}`,
  },

  // App
  APP: {
    STATUS: '/app/status',
    VERSION: '/app/version',
    MAINTENANCE: '/app/maintenance',
  },

  // Analytics
  ANALYTICS: {
    PROPERTY_SUGGESTIONS: (id: string) => `/properties/${id}/analytics/suggestions`,
    OWNER_SUMMARY: '/users/me/analytics/summary',
  },

  // Media
  MEDIA: {
    UPLOAD: '/media/upload',
    DELETE: (id: string) => `/media/${id}`,
  },

  // Misc
  MISC: {
    LOCATIONS: '/locations',
    LOCATION_SEARCH: '/locations/search',
    AMENITIES: '/amenities',
    REPORT: '/reports',
  },

  // Reviews
  REVIEWS: {
    USER_REVIEWS: (userId: string) => `/reviews/user/${userId}`,
    USER_STATS: (userId: string) => `/reviews/user/${userId}/stats`,
    CREATE: '/reviews',
    DETAIL: (id: string) => `/reviews/${id}`,
    RESPOND: (id: string) => `/reviews/${id}/respond`,
    HELPFUL: (id: string) => `/reviews/${id}/helpful`,
    REPORT: (id: string) => `/reviews/${id}/report`,
  },
} as const;

export default API_ENDPOINTS;
