/**
 * 💰 MONETIZATION FEATURE
 *
 * Modul complet pentru monetizarea aplicației.
 *
 * FLUX PLĂȚI PER PLATFORMĂ:
 * - iOS: Apple IAP (obligatoriu pentru App Store)
 * - Android: Google Play Billing (obligatoriu pentru Play Store)
 * - Web: PAYNET / MAIB / MPAY (provideri Moldova)
 *
 * PROVIDERI MOLDOVA:
 * - PAYNET: Cel mai popular, carduri Visa/Mastercard
 * - MAIB: Cea mai mare bancă, 3D Secure
 * - MPAY: Plăți mobile, QR code
 */

// ============================================================================
// SCREENS
// ============================================================================

export { default as PricingScreen } from './screens/PricingScreen';
export { default as BoostPurchaseScreen } from './screens/BoostPurchaseScreen';

// ============================================================================
// HOOKS
// ============================================================================

export {
  usePayments,
  useMonetizationStatus,
  useSubscriptionPlans,
  usePromotionPlans,
  useListingPromotion,
} from './hooks/usePayments';

// ============================================================================
// SERVICES
// ============================================================================

export * as paymentService from './services/paymentService';

// ============================================================================
// API
// ============================================================================

export * as monetizationApi from './api/monetizationApi';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Subscription types
  SubscriptionPlanCode,
  SubscriptionStatus,
  BillingCycle,
  SubscriptionPlan,
  UserSubscription,

  // Promotion types
  PromotionPlanCode,
  PromotionStatus,
  PromotionPlan,
  ListingPromotion,

  // Payment types
  PaymentProvider,
  PaymentMethod,
  TransactionStatus,
  TransactionType,
  Transaction,
  PaymentInitiationResult,

  // Status types
  MonetizationStatus,

  // Platform types
  Platform,
  PlatformPaymentConfig,
} from './types';
