/**
 * 🏛️ ENUMS.ts - Standardized Enumerations for DOMARIS/IMOBI
 *
 * Conform ADR-001: Model de Cont Unificat
 * Toate enum-urile folosite în întreaga platformă.
 */

// ============================================================================
// VERIFICATION LEVELS (Core of ADR-001)
// ============================================================================

/**
 * Niveluri de verificare utilizator - SINGURA "poartă" pentru acces la funcționalități
 *
 * 0 = Cont nou (acces de bază - căutare, filtre, hartă)
 * 1 = Email/Telefon verificat (acces de bază)
 * 2 = Identitate verificată (poate contacta, programa vizionări)
 * 3 = Proprietar verificat cu documente (POATE POSTA ANUNȚURI)
 */
export type VerificationLevel = 0 | 1 | 2 | 3;

export const VERIFICATION_LEVEL_INFO = {
  0: {
    name: 'Cont Nou',
    description: 'Cont creat, nevalidat',
    canPost: false,
    canContact: false,
    badge: null,
  },
  1: {
    name: 'Verificat Bază',
    description: 'Email sau telefon confirmat',
    canPost: false,
    canContact: false,
    badge: null,
  },
  2: {
    name: 'Identitate Verificată',
    description: 'Document de identitate validat',
    canPost: false,
    canContact: true,
    badge: '✓ Verificat',
  },
  3: {
    name: 'Proprietar Verificat',
    description: 'Documente proprietate confirmate',
    canPost: true,
    canContact: true,
    badge: '⭐ Proprietar Verificat',
  },
} as const;

// ============================================================================
// PERMISSIONS (Maps to Verification Levels)
// ============================================================================

/**
 * Permisiuni mapate la nivelul minim de verificare necesar
 */
export const PERMISSIONS = {
  // Nivel 0+ (toți utilizatorii autentificați)
  BROWSE_PROPERTIES: 0,
  SEARCH_PROPERTIES: 0,
  VIEW_PROPERTY_DETAILS: 0,
  ADD_TO_FAVORITES: 0,
  USE_FILTERS: 0,
  USE_MAP_SEARCH: 0,
  USE_AI_SEARCH: 0,

  // Nivel 1+ (email/telefon verificat)
  CONTACT_OWNER: 2,
  START_CONVERSATION: 2,
  REQUEST_VIEWING: 2,
  RECEIVE_ALERTS: 1,

  // Nivel 2+ (identitate verificată)
  RESPOND_TO_MESSAGES: 2,
  MANAGE_VIEWINGS: 2,

  // Nivel 3 (proprietar verificat cu documente - POATE POSTA)
  CREATE_LISTING: 3,
  EDIT_OWN_LISTING: 3,
  DELETE_OWN_LISTING: 3,
  VIEW_LISTING_ANALYTICS: 3,
  BOOST_LISTING: 3,
  VERIFIED_BADGE: 3,
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ============================================================================
// PROPERTY ENUMS
// ============================================================================

/**
 * Tipul tranzacției
 */
export type TransactionType = 'SALE' | 'RENT';

export const TRANSACTION_TYPES: TransactionType[] = ['SALE', 'RENT'];

/**
 * Tipul proprietății
 */
export type PropertyType =
  | 'APARTMENT'
  | 'HOUSE'
  | 'STUDIO'
  | 'ROOM'
  | 'COMMERCIAL'
  | 'LAND'
  | 'OFFICE'
  | 'GARAGE'
  | 'OTHER';

export const PROPERTY_TYPES: PropertyType[] = [
  'APARTMENT',
  'HOUSE',
  'STUDIO',
  'ROOM',
  'COMMERCIAL',
  'LAND',
  'OFFICE',
  'GARAGE',
  'OTHER',
];

/**
 * Statusul proprietății/anunțului
 */
export type PropertyStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'RENTED'
  | 'SOLD'
  | 'HIDDEN'
  | 'EXPIRED'
  | 'REJECTED';

export const PROPERTY_STATUSES: PropertyStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'RENTED',
  'SOLD',
  'HIDDEN',
  'EXPIRED',
  'REJECTED',
];

/**
 * Mapare status vechi -> status nou (pentru migrare)
 */
export const STATUS_MIGRATION_MAP: Record<string, PropertyStatus> = {
  new: 'DRAFT',
  early_access: 'PENDING_REVIEW',
  public: 'ACTIVE',
  rented: 'RENTED',
  hidden: 'HIDDEN',
  expired: 'EXPIRED',
};

// ============================================================================
// CURRENCY & PRICING
// ============================================================================

export type Currency = 'EUR' | 'MDL' | 'USD' | 'RON';

export const CURRENCIES: Currency[] = ['EUR', 'MDL', 'USD', 'RON'];

export type PricePeriod = 'MONTHLY' | 'DAILY' | 'WEEKLY' | 'YEARLY' | 'TOTAL';

export const PRICE_PERIODS: PricePeriod[] = [
  'MONTHLY',
  'DAILY',
  'WEEKLY',
  'YEARLY',
  'TOTAL',
];

// ============================================================================
// AUTH & VERIFICATION
// ============================================================================

/**
 * Tipul de autentificare
 */
export type AuthProvider = 'EMAIL' | 'PHONE' | 'GOOGLE' | 'APPLE';

export const AUTH_PROVIDERS: AuthProvider[] = [
  'EMAIL',
  'PHONE',
  'GOOGLE',
  'APPLE',
];

/**
 * Statusul verificării KYC
 */
export type KycStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export const KYC_STATUSES: KycStatus[] = [
  'NOT_STARTED',
  'PENDING',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
];

/**
 * Tipul documentului pentru KYC
 */
export type KycDocumentType =
  | 'ID_CARD'
  | 'PASSPORT'
  | 'DRIVING_LICENSE'
  | 'PROPERTY_DEED'
  | 'UTILITY_BILL'
  | 'SELFIE'
  | 'OTHER';

export const KYC_DOCUMENT_TYPES: KycDocumentType[] = [
  'ID_CARD',
  'PASSPORT',
  'DRIVING_LICENSE',
  'PROPERTY_DEED',
  'UTILITY_BILL',
  'SELFIE',
  'OTHER',
];

// ============================================================================
// MESSAGING
// ============================================================================

export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM' | 'VIEWING_REQUEST';

export const MESSAGE_TYPES: MessageType[] = [
  'TEXT',
  'IMAGE',
  'SYSTEM',
  'VIEWING_REQUEST',
];

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';

export const CONVERSATION_STATUSES: ConversationStatus[] = [
  'ACTIVE',
  'ARCHIVED',
  'BLOCKED',
];

// ============================================================================
// VIEWINGS
// ============================================================================

export type ViewingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export const VIEWING_STATUSES: ViewingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
];

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export type NotificationType =
  | 'MESSAGE'
  | 'VIEWING_REQUEST'
  | 'VIEWING_CONFIRMED'
  | 'VIEWING_CANCELLED'
  | 'PRICE_DROP'
  | 'NEW_LISTING'
  | 'LISTING_EXPIRED'
  | 'KYC_UPDATE'
  | 'SYSTEM';

export const NOTIFICATION_TYPES: NotificationType[] = [
  'MESSAGE',
  'VIEWING_REQUEST',
  'VIEWING_CONFIRMED',
  'VIEWING_CANCELLED',
  'PRICE_DROP',
  'NEW_LISTING',
  'LISTING_EXPIRED',
  'KYC_UPDATE',
  'SYSTEM',
];

// ============================================================================
// LEGACY SUPPORT (pentru migrare)
// ============================================================================

/**
 * @deprecated Folosește verificationLevel în loc de role
 * Păstrat doar pentru compatibilitate în timpul migrării
 */
export type LegacyUserRole = 'tenant' | 'landlord' | 'admin';
