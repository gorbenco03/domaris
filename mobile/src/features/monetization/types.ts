/**
 * 💰 MONETIZATION TYPES
 *
 * Type definitions for monetization feature
 */

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export type SubscriptionPlanCode = 'free' | 'standard' | 'premium';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: number;
  code: SubscriptionPlanCode;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxActiveListings: number;
  maxPhotosPerListing: number;
  freeMonthlyBoosts: number;
  hasVideoTour: boolean;
  hasPrioritySearch: boolean;
  hasAdvancedStats: boolean;
  hasAiFeatures: boolean;
  trialDays: number;
  isActive: boolean;
  // IAP Product IDs
  appleProductIdMonthly?: string;
  appleProductIdYearly?: string;
  googleProductIdMonthly?: string;
  googleProductIdYearly?: string;
}

export interface UserSubscription {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  autoRenew: boolean;
  boostsUsedThisMonth: number;
  remainingListings: number;
  remainingBoosts: number;
}

// ============================================================================
// PROMOTION TYPES
// ============================================================================

export type PromotionPlanCode = 'boost_24h' | 'boost_7d' | 'boost_14d' | 'highlight' | 'homepage';
export type PromotionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface PromotionPlan {
  id: number;
  code: PromotionPlanCode;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  searchBoostMultiplier: number;
  showBadge: boolean;
  showOnHomepage: boolean;
  isActive: boolean;
  // IAP Product IDs
  appleProductId?: string;
  googleProductId?: string;
}

export interface ListingPromotion {
  id: number;
  listingId: number;
  promotionPlan: PromotionPlan;
  status: PromotionStatus;
  startDate: string;
  endDate: string;
  remainingDays: number;
  showBadge: boolean;
  isFreeBoost: boolean;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export type PaymentProvider = 'apple' | 'google' | 'paynet' | 'maib' | 'mpay' | 'web' | 'simulated';
export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'bank_transfer' | 'paynet' | 'mpay' | 'maib';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type TransactionType = 'subscription' | 'promotion' | 'refund';

export interface Transaction {
  id: number;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  description: string;
  createdAt: string;
  completedAt?: string;
  receiptUrl?: string;
  failureReason?: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  paymentUrl?: string;
  mpayDeepLink?: string;
  qrCode?: string;
  transactionId: string | number;
  externalPaymentId?: string;
  expiresAt: string;
  message?: string;
  error?: string;
}

// ============================================================================
// MONETIZATION STATUS
// ============================================================================

export interface MonetizationStatus {
  subscription: UserSubscription | null;
  capabilities: {
    maxActiveListings: number;
    maxPhotosPerListing: number;
    canUseVideoTour: boolean;
    canUsePrioritySearch: boolean;
    canUseAdvancedStats: boolean;
    canUseAiFeatures: boolean;
    freeBoostsRemaining: number;
  };
  activePromotions: ListingPromotion[];
  usage: {
    activeListingsCount: number;
    totalPromotionsThisMonth: number;
    boostsUsedThisMonth: number;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
}

export interface PromotionPlansResponse {
  plans: PromotionPlan[];
}

export interface CreateSubscriptionRequest {
  planId: number;
  billingCycle: BillingCycle;
  paymentProvider: PaymentProvider;
  // IAP specific
  receipt?: string;
  purchaseToken?: string;
}

export interface CreatePromotionRequest {
  promotionPlanId: number;
  useFreeBoost?: boolean;
  paymentProvider: PaymentProvider;
  // IAP specific
  receipt?: string;
  purchaseToken?: string;
}

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

export type Platform = 'ios' | 'android' | 'web';

export interface PlatformPaymentConfig {
  platform: Platform;
  availableProviders: PaymentProvider[];
  preferredProvider: PaymentProvider;
  supportsIAP: boolean;
  supportsMoldovaPayments: boolean;
}
