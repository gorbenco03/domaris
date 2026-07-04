/**
 * RIVA Frontend - API Endpoints
 * Centralized endpoint definitions (aligned with mobile/src/core/api/endpoints.ts)
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
    CHANGE_PASSWORD: '/auth/change-password',
    ME: '/users/me',
  },

  // Users
  USERS: {
    PROFILE: '/users/me',
    UPDATE_PROFILE: '/users/me',
    UPLOAD_AVATAR: '/users/me/avatar',
    DELETE_ACCOUNT: '/users/me',
    NOTIFICATIONS_SETTINGS: '/users/me/notifications',
    NOTIFICATION_PREFERENCES: '/users/me/notification-preferences',
    QUIET_HOURS: '/users/me/quiet-hours',
    PUBLIC_PROFILE: (id: string | number) => `/users/${id}`,
    USER_LISTINGS: (id: string | number) => `/users/${id}/listings`,
  },

  // Properties
  PROPERTIES: {
    LIST: '/properties',
    CREATE: '/properties',
    DETAIL: (id: string | number) => `/properties/${id}`,
    UPDATE: (id: string | number) => `/properties/${id}`,
    DELETE: (id: string | number) => `/properties/${id}`,
    MY_PROPERTIES: '/properties/my',
    VIEW: (id: string | number) => `/properties/${id}/view`,
    UPLOAD_PHOTOS: (id: string | number) => `/properties/${id}/photos`,
    DELETE_IMAGE: (id: string | number, imageId: string | number) => `/properties/${id}/images/${imageId}`,
    STATS: (id: string | number) => `/properties/${id}/stats`,
    TOGGLE_ACTIVE: (id: string | number) => `/properties/${id}/toggle-active`,
  },

  // Search
  SEARCH: {
    PROPERTIES: '/search/properties',
    SUGGESTIONS: '/search/suggestions',
    MAP: '/search/map',
    FACETS: '/search/facets',
  },

  // Saved Searches
  SAVED_SEARCHES: {
    LIST: '/saved-searches',
    CREATE: '/saved-searches',
    DETAIL: (id: string | number) => `/saved-searches/${id}`,
    DELETE: (id: string | number) => `/saved-searches/${id}`,
    RUN: (id: string | number) => `/saved-searches/${id}/run`,
    TOGGLE_ALERTS: (id: string | number) => `/saved-searches/${id}/alerts`,
  },

  // Favorites
  FAVORITES: {
    LIST: '/favorites',
    ADD: '/favorites',
    REMOVE: (propertyId: string | number) => `/favorites/${propertyId}`,
    CHECK: (propertyId: string | number) => `/favorites/check/${propertyId}`,
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
    STATUS: (id: string) => `/viewings/${id}/status`,
    FEEDBACK: (id: string) => `/viewings/${id}/feedback`,
    UPCOMING: '/viewings/upcoming',
    AVAILABILITY: (propertyId: string | number) => `/viewings/availability/${propertyId}`,
  },

  // Notifications
  // Note: there is no /notifications/unread-count route — the unread count is
  // derived client-side from GET /notifications (see notificationsApi.getUnreadCount).
  NOTIFICATIONS: {
    LIST: '/notifications',
    READ: (id: number) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
    DELETE: (id: number) => `/notifications/${id}`,
    SETTINGS: '/notifications/settings',
  },

  // KYC / Identity verification
  KYC: {
    VERIFY_ID: '/kyc/verify-id',
    STATUS: '/kyc/status',
    PROPERTY_DOC: '/kyc/property-doc',
  },

  // Devices (push tokens)
  DEVICES: {
    REGISTER_PUSH_TOKEN: '/devices/push-token',
    UNREGISTER_PUSH_TOKEN: (deviceId: string) => `/devices/push-token/${deviceId}`,
  },

  // AI
  AI: {
    CHAT: '/ai/chat',
    ANALYZE_LISTING: '/ai/analyze-listing',
    SUGGEST_PRICE: '/ai/suggest-price',
    GENERATE_DESCRIPTION: '/ai/generate-description',
    IMPROVE_LISTING: '/ai/improve-listing',
    PROPERTY_SUMMARY: (propertyId: string | number) => `/ai/property-summary/${propertyId}`,
    // Conversational Agent & AVM
    AGENT_CHAT: '/ai/agent/chat',
    AGENT_STATS: '/ai/agent/stats',
    AGENT_VALUATION: '/ai/agent/valuation',
    AGENT_VALUATION_LISTING: (listingId: string | number) => `/ai/agent/valuation/${listingId}`,
    // Persistent AI Conversations
    CONVERSATIONS: '/ai/conversations',
    CONVERSATION_DETAIL: (id: number) => `/ai/conversations/${id}`,
    CONVERSATION_MESSAGES: (id: number) => `/ai/conversations/${id}/messages`,
    CONVERSATION_ARCHIVE: (id: number) => `/ai/conversations/${id}/archive`,
    CONVERSATION_ACTIVE: '/ai/conversations/active',
  },

  // App
  APP: {
    STATUS: '/app/status',
    VERSION: '/app/version',
    MAINTENANCE: '/app/maintenance',
  },

  // Analytics
  ANALYTICS: {
    PROPERTY_SUGGESTIONS: (id: string | number) => `/properties/${id}/analytics/suggestions`,
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
    USER_REVIEWS: (userId: string | number) => `/reviews/user/${userId}`,
    USER_STATS: (userId: string | number) => `/reviews/user/${userId}/stats`,
    CREATE: '/reviews',
    DETAIL: (id: string) => `/reviews/${id}`,
    RESPOND: (id: string) => `/reviews/${id}/respond`,
    HELPFUL: (id: string) => `/reviews/${id}/helpful`,
    REPORT: (id: string) => `/reviews/${id}/report`,
  },

  // Rental Contracts
  CONTRACTS: {
    PROPOSE: (viewingId: string | number) => `/viewings/${viewingId}/propose-contract`,
    MINE: '/contracts/mine',
    DETAIL: (id: string | number) => `/contracts/${id}`,
    ACCEPT: (id: string | number) => `/contracts/${id}/accept`,
    SIGN: (id: string | number) => `/contracts/${id}/sign`,
  },

  // Monetization
  MONETIZATION: {
    PLANS: '/monetization/plans',
    SUBSCRIPTION: '/monetization/subscription',
    CHANGE_PLAN: '/monetization/subscription/change-plan',
    STATUS: '/monetization/status',
    PROMOTION_OPTIONS: '/monetization/promotions/options',
    PROMOTE: (listingId: number) => `/monetization/listings/${listingId}/promote`,
    MY_PROMOTIONS: '/monetization/my-promotions',
    CANCEL_PROMOTION: (promotionId: string) => `/monetization/promotions/${promotionId}`,
    TRANSACTIONS: '/monetization/transactions',
    PAYMENT_PAYNET: '/monetization/payments/paynet/initiate',
    PAYMENT_MAIB: '/monetization/payments/maib/initiate',
    PAYMENT_MPAY: '/monetization/payments/mpay/initiate',
    PAYMENT_STATUS: (txId: string) => `/monetization/payments/${txId}/status`,
  },
} as const;

export default API_ENDPOINTS;
