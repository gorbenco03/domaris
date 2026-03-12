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
  code: 'FREE' | 'STANDARD' | 'PREMIUM';
  name: string;
  description?: string;
  price: number;
  annualPrice?: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  features: string[];
  isPopular?: boolean;
  listingLimit?: number;
}

export interface UserSubscription {
  id: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';
  startDate: string;
  endDate?: string;
  autoRenewal: boolean;
  billingCycle: 'MONTHLY' | 'ANNUAL';
}

export interface PromotionPlan {
  id: string;
  name: string;
  description?: string;
  duration: number; // days
  price: number;
  currency: string;
  boostAmount?: number;
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
    return await api.fetch<UserSubscription>('/monetization/subscription');
  } catch {
    return null;
  }
}

export async function createSubscription(payload: {
  planId: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  paymentProvider?: string;
}): Promise<UserSubscription> {
  return api.fetch<UserSubscription>('/monetization/subscription', {
    method: 'POST',
    body: JSON.stringify(payload),
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
  planId: string
): Promise<ListingPromotion> {
  return api.fetch<ListingPromotion>(`/monetization/listings/${listingId}/promote`, {
    method: 'POST',
    body: JSON.stringify({ planId }),
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
  const res = await api.fetch<Transaction[] | { transactions: Transaction[] }>(
    '/monetization/transactions'
  );
  return Array.isArray(res) ? res : res.transactions ?? [];
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
