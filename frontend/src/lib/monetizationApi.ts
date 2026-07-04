/**
 * RIVA - Monetization API
 * Subscriptions, promotions, and payments
 */

import { api } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  priceMonthly?: number;
  priceYearly?: number;
  price?: number;
  annualPrice?: number;
  currency: string;
  billingCycle?: 'MONTHLY' | 'ANNUAL' | 'monthly' | 'yearly';
  features: string[];
  isPopular?: boolean;
  listingLimit?: number;
  maxActiveListings?: number;
  trialDays?: number;
}

export interface UserSubscription {
  id: string | number;
  planId?: string | number;
  plan?: SubscriptionPlan;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';
  startedAt?: string;
  currentPeriodEnd?: string;
  /** @deprecated use currentPeriodEnd */
  endDate?: string;
  autoRenew: boolean;
  /** @deprecated use autoRenew */
  autoRenewal?: boolean;
  billingCycle: 'monthly' | 'yearly' | 'MONTHLY' | 'ANNUAL';
  remainingListings?: number;
  remainingBoosts?: number;
  trialEndsAt?: string;
}

export interface PromotionPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  duration: number; // days
  durationDays?: number;
  price: number;
  currency: string;
  boostAmount?: number;
  isPopular?: boolean;
  impactText?: string;
  benefits?: string[];
}

export interface ListingPromotion {
  id: string;
  listingId: number;
  planId: string;
  plan?: PromotionPlan;
  endsAt: string;
  impressions: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export interface MonetizationStatus {
  hasActiveSubscription: boolean;
  subscription?: UserSubscription;
  canCreateListing: boolean;
  remainingListings?: number;
  freeBoostsRemaining?: number;
}

export interface PaymentInitResponse {
  redirectUrl: string;
  transactionId: string;
  expiresAt?: string;
}

export interface Transaction {
  id: string;
  type: 'SUBSCRIPTION' | 'PROMOTION';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  description?: string;
}

// ============================================================================
// SUBSCRIPTION PLANS (PUBLIC)
// ============================================================================

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const res = await api.fetch<SubscriptionPlan[] | { plans: SubscriptionPlan[] }>(
    '/monetization/plans'
  );
  return Array.isArray(res) ? res : res.plans ?? [];
}

// ============================================================================
// USER SUBSCRIPTION (Authenticated)
// ============================================================================

export async function getUserSubscription(): Promise<UserSubscription | null> {
  try {
    const res = await api.fetch<UserSubscription | { subscription: UserSubscription | null; message?: string }>(
      '/monetization/subscription'
    );
    // Backend wraps response: { subscription: {...} | null, message: '...' }
    if (res && typeof res === 'object' && 'subscription' in res) {
      return (res as { subscription: UserSubscription | null }).subscription;
    }
    return res as UserSubscription;
  } catch {
    return null;
  }
}

export async function createSubscription(payload: {
  planCode: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod?: string;
}): Promise<{ success: boolean; subscription: { id: number; status: string; currentPeriodEnd?: string; trialEndsAt?: string } }> {
  return api.fetch('/monetization/subscription', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      paymentMethod: payload.paymentMethod ?? 'simulated',
    }),
  });
}

export async function changePlan(planId: string): Promise<UserSubscription> {
  return api.fetch<UserSubscription>('/monetization/subscription/change-plan', {
    method: 'PATCH',
    body: JSON.stringify({ planId }),
  });
}

export async function cancelSubscription(): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>('/monetization/subscription', {
    method: 'DELETE',
  });
}

// ============================================================================
// MONETIZATION STATUS
// ============================================================================

export async function getMonetizationStatus(): Promise<MonetizationStatus> {
  return api.fetch<MonetizationStatus>('/monetization/status');
}

// ============================================================================
// PROMOTIONS (Authenticated)
// ============================================================================

export async function getPromotionPlans(): Promise<PromotionPlan[]> {
  const res = await api.fetch<PromotionPlan[] | { plans: PromotionPlan[] }>(
    '/monetization/promotions/options'
  );
  return Array.isArray(res) ? res : res.plans ?? [];
}

export async function promoteProperty(
  listingId: number,
  promotionCode: string,
  paymentMethod: string = 'simulated',
): Promise<{ success: boolean; promotion: { id: number; listingId: number; status: string; startDate?: string; endDate?: string; isFreeBoost?: boolean } }> {
  return api.fetch(`/monetization/listings/${listingId}/promote`, {
    method: 'POST',
    body: JSON.stringify({ promotionCode, paymentMethod }),
  });
}

export async function getMyPromotions(): Promise<ListingPromotion[]> {
  const res = await api.fetch<ListingPromotion[] | { promotions: ListingPromotion[] }>(
    '/monetization/my-promotions'
  );
  return Array.isArray(res) ? res : res.promotions ?? [];
}

export async function cancelPromotion(promotionId: string): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>(`/monetization/promotions/${promotionId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

export async function getTransactionHistory(): Promise<Transaction[]> {
  const res = await api.fetch<Transaction[] | { items: Transaction[] } | { transactions: Transaction[] }>(
    '/monetization/transactions'
  );
  if (Array.isArray(res)) return res;
  if ('items' in res && Array.isArray((res as any).items)) return (res as { items: Transaction[] }).items;
  if ('transactions' in res && Array.isArray((res as any).transactions)) return (res as { transactions: Transaction[] }).transactions;
  return [];
}

// ============================================================================
// PAYMENTS (Moldova providers)
// ============================================================================

export async function initiatePaynetPayment(payload: {
  planId: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
}): Promise<PaymentInitResponse> {
  return api.fetch<PaymentInitResponse>('/monetization/payments/paynet/initiate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function initiateMAIBPayment(payload: {
  planId: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
}): Promise<PaymentInitResponse> {
  return api.fetch<PaymentInitResponse>('/monetization/payments/maib/initiate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function initiateMpayPayment(payload: {
  planId: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
}): Promise<PaymentInitResponse> {
  return api.fetch<PaymentInitResponse>('/monetization/payments/mpay/initiate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPaymentStatus(transactionId: string): Promise<{
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  transactionId: string;
}> {
  return api.fetch(`/monetization/payments/${transactionId}/status`);
}

// ============================================================================
// EXPORT
// ============================================================================

export const monetizationApi = {
  getSubscriptionPlans,
  getUserSubscription,
  createSubscription,
  changePlan,
  cancelSubscription,
  getMonetizationStatus,
  getPromotionPlans,
  promoteProperty,
  getMyPromotions,
  cancelPromotion,
  getTransactionHistory,
  initiatePaynetPayment,
  initiateMAIBPayment,
  initiateMpayPayment,
  getPaymentStatus,
};

export default monetizationApi;
