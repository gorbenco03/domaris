/**
 * 💰 MONETIZATION API
 *
 * API functions for monetization endpoints
 */

import { apiClient } from '@/core/api/client';
import {
  SubscriptionPlan,
  PromotionPlan,
  UserSubscription,
  ListingPromotion,
  MonetizationStatus,
  Transaction,
  PaymentInitiationResult,
  BillingCycle,
  PaymentProvider,
} from '../types';

const BASE_URL = '/monetization';

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiClient.get(`${BASE_URL}/plans`);
  return response.data;
}

/**
 * Get current user's subscription
 */
export async function getMySubscription(): Promise<{
  subscription: UserSubscription | null;
  message?: string;
}> {
  const response = await apiClient.get(`${BASE_URL}/subscription`);
  return response.data;
}

/**
 * Create a new subscription
 */
export async function createSubscription(data: {
  planId: number;
  billingCycle: BillingCycle;
  paymentProvider: PaymentProvider;
  receipt?: string;
  purchaseToken?: string;
}): Promise<{
  success: boolean;
  subscription: Partial<UserSubscription>;
  message: string;
}> {
  const response = await apiClient.post(`${BASE_URL}/subscription`, data);
  return response.data;
}

/**
 * Change subscription plan
 */
export async function changePlan(data: {
  newPlanId: number;
  immediate?: boolean;
}): Promise<{
  success: boolean;
  subscription: Partial<UserSubscription>;
  message: string;
}> {
  const response = await apiClient.patch(`${BASE_URL}/subscription/change-plan`, data);
  return response.data;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(data: {
  reason?: string;
  cancelImmediately?: boolean;
}): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await apiClient.delete(`${BASE_URL}/subscription`, { data });
  return response.data;
}

// ============================================================================
// PROMOTION PLANS
// ============================================================================

/**
 * Get all available promotion options
 */
export async function getPromotionPlans(): Promise<PromotionPlan[]> {
  const response = await apiClient.get(`${BASE_URL}/promotions/options`);
  return response.data;
}

/**
 * Create a promotion for a listing
 */
export async function createPromotion(
  listingId: number,
  data: {
    promotionCode: string;
    useFreeBoost?: boolean;
    paymentMethodToken?: string;
    appleReceipt?: string;
    googlePurchaseToken?: string;
  },
): Promise<{
  success: boolean;
  promotion: Partial<ListingPromotion>;
  message: string;
}> {
  const response = await apiClient.post(`${BASE_URL}/listings/${listingId}/promote`, data);
  return response.data;
}

/**
 * Get my promotions
 */
export async function getMyPromotions(params?: {
  status?: string;
  listingId?: number;
  page?: number;
  limit?: number;
}): Promise<{
  items: ListingPromotion[];
  meta: { total: number; page: number; limit: number };
}> {
  const response = await apiClient.get(`${BASE_URL}/my-promotions`, { params });
  return response.data;
}

/**
 * Get promotion status for a specific listing
 */
export async function getListingPromotion(listingId: number): Promise<{
  hasActivePromotion: boolean;
  promotion: ListingPromotion | null;
}> {
  const response = await apiClient.get(`${BASE_URL}/listings/${listingId}/promotion`);
  return response.data;
}

/**
 * Cancel a promotion
 */
export async function cancelPromotion(promotionId: number): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await apiClient.delete(`${BASE_URL}/promotions/${promotionId}`);
  return response.data;
}

// ============================================================================
// MONETIZATION STATUS
// ============================================================================

/**
 * Get full monetization status
 */
export async function getMonetizationStatus(): Promise<MonetizationStatus> {
  const response = await apiClient.get(`${BASE_URL}/status`);
  return response.data;
}

/**
 * Check if user can create more listings
 */
export async function canCreateListing(): Promise<{
  canCreate: boolean;
  message: string;
  upgradeRequired: boolean;
}> {
  const response = await apiClient.get(`${BASE_URL}/can-create-listing`);
  return response.data;
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

/**
 * Get my transactions
 */
export async function getMyTransactions(params?: {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: Transaction[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const response = await apiClient.get(`${BASE_URL}/transactions`, { params });
  return response.data;
}

// ============================================================================
// MOLDOVA PAYMENT PROVIDERS
// ============================================================================

/**
 * Initiate PAYNET payment
 */
export async function initiatePaynetPayment(data: {
  type: 'subscription' | 'promotion';
  itemId: number;
  billingCycle?: BillingCycle;
  listingId?: number;
}): Promise<PaymentInitiationResult> {
  const response = await apiClient.post(`${BASE_URL}/payments/paynet/initiate`, data);
  return response.data;
}

/**
 * Initiate MAIB payment
 */
export async function initiateMaibPayment(data: {
  type: 'subscription' | 'promotion';
  itemId: number;
  billingCycle?: BillingCycle;
  listingId?: number;
  saveCard?: boolean;
}): Promise<PaymentInitiationResult> {
  const response = await apiClient.post(`${BASE_URL}/payments/maib/initiate`, data);
  return response.data;
}

/**
 * Initiate MPAY payment
 */
export async function initiateMpayPayment(data: {
  type: 'subscription' | 'promotion';
  itemId: number;
  billingCycle?: BillingCycle;
  listingId?: number;
  phone?: string;
}): Promise<PaymentInitiationResult> {
  const response = await apiClient.post(`${BASE_URL}/payments/mpay/initiate`, data);
  return response.data;
}

/**
 * Check payment status (for polling)
 */
export async function checkPaymentStatus(transactionId: string | number): Promise<{
  found: boolean;
  transactionId?: number;
  status: string;
  type?: string;
  amount?: number;
  currency?: string;
  completedAt?: string;
  failureReason?: string;
}> {
  const response = await apiClient.get(`${BASE_URL}/payments/${transactionId}/status`);
  return response.data;
}

// ============================================================================
// APPLE IAP VERIFICATION
// ============================================================================

/**
 * Verify Apple IAP receipt with backend
 */
export async function verifyAppleReceipt(data: {
  receipt: string;
  productId: string;
  transactionId: string;
  type: 'subscription' | 'promotion';
  itemId: number;
  listingId?: number;
}): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await apiClient.post(`${BASE_URL}/webhooks/apple/verify`, data);
  return response.data;
}

// ============================================================================
// GOOGLE PLAY VERIFICATION
// ============================================================================

/**
 * Verify Google Play purchase with backend
 */
export async function verifyGooglePurchase(data: {
  purchaseToken: string;
  productId: string;
  packageName: string;
  type: 'subscription' | 'promotion';
  itemId: number;
  listingId?: number;
}): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await apiClient.post(`${BASE_URL}/webhooks/google/verify`, data);
  return response.data;
}
