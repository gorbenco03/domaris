/**
 * 💰 USE PAYMENTS HOOK
 *
 * React hook pentru gestionarea plăților în aplicație.
 * Detectează automat platforma și folosește provider-ul corect.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  SubscriptionPlan,
  PromotionPlan,
  BillingCycle,
  PaymentProvider,
  MonetizationStatus,
  UserSubscription,
} from '../types';
import * as paymentService from '../services/paymentService';
import * as monetizationApi from '../api/monetizationApi';

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentState {
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  currentProvider: PaymentProvider;
  transactionId: string | number | null;
  requiresPolling: boolean;
  pollingStatus: string | null;
}

export interface UsePaymentsReturn {
  // State
  state: PaymentState;
  platformConfig: paymentService.PlatformPaymentConfig;

  // Subscription actions
  purchaseSubscription: (
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
  ) => Promise<boolean>;

  // Promotion actions
  purchasePromotion: (
    plan: PromotionPlan,
    listingId: number,
    useFreeBoost?: boolean,
  ) => Promise<boolean>;

  // Status
  pollStatus: () => Promise<void>;
  resetState: () => void;

  // Helpers
  getPayButtonText: () => string;
  formatPrice: (amount: number, currency: string) => string;
}

// ============================================================================
// HOOK
// ============================================================================

export function usePayments(): UsePaymentsReturn {
  const platformConfig = paymentService.getPlatformPaymentConfig();

  const [state, setState] = useState<PaymentState>({
    isLoading: false,
    isProcessing: false,
    error: null,
    currentProvider: platformConfig.preferredProvider,
    transactionId: null,
    requiresPolling: false,
    pollingStatus: null,
  });

  // ============================================================================
  // SUBSCRIPTION PURCHASE
  // ============================================================================

  const purchaseSubscription = useCallback(
    async (plan: SubscriptionPlan, billingCycle: BillingCycle): Promise<boolean> => {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        transactionId: null,
        requiresPolling: false,
        pollingStatus: null,
      }));

      try {
        const result = await paymentService.purchaseSubscription({
          plan,
          billingCycle,
          preferredProvider: platformConfig.preferredProvider,
        });

        setState((prev) => ({
          ...prev,
          isProcessing: !result.requiresPolling,
          currentProvider: result.provider,
          transactionId: result.transactionId || null,
          requiresPolling: result.requiresPolling || false,
          error: result.success ? null : result.error || 'Purchase failed',
        }));

        if (result.success && result.requiresPolling && result.transactionId) {
          // Începe polling-ul automat
          pollPaymentStatus(result.transactionId);
        }

        return result.success;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error.message || 'Purchase failed',
        }));
        return false;
      }
    },
    [platformConfig.preferredProvider],
  );

  // ============================================================================
  // PROMOTION PURCHASE
  // ============================================================================

  const purchasePromotion = useCallback(
    async (
      plan: PromotionPlan,
      listingId: number,
      useFreeBoost: boolean = false,
    ): Promise<boolean> => {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        transactionId: null,
        requiresPolling: false,
        pollingStatus: null,
      }));

      try {
        const result = await paymentService.purchasePromotion({
          plan,
          listingId,
          useFreeBoost,
          preferredProvider: platformConfig.preferredProvider,
        });

        setState((prev) => ({
          ...prev,
          isProcessing: !result.requiresPolling,
          currentProvider: result.provider,
          transactionId: result.transactionId || null,
          requiresPolling: result.requiresPolling || false,
          error: result.success ? null : result.error || 'Purchase failed',
        }));

        if (result.success && result.requiresPolling && result.transactionId) {
          pollPaymentStatus(result.transactionId);
        }

        return result.success;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error.message || 'Purchase failed',
        }));
        return false;
      }
    },
    [platformConfig.preferredProvider],
  );

  // ============================================================================
  // POLLING
  // ============================================================================

  const pollPaymentStatus = useCallback(
    async (transactionId: string | number) => {
      const result = await paymentService.pollPaymentStatus(transactionId, {
        interval: 3000,
        maxAttempts: 60,
        onStatusChange: (status) => {
          setState((prev) => ({
            ...prev,
            pollingStatus: status,
          }));
        },
      });

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        requiresPolling: false,
        error: result.success ? null : result.error || 'Payment verification failed',
      }));
    },
    [],
  );

  const pollStatus = useCallback(async () => {
    if (state.transactionId) {
      await pollPaymentStatus(state.transactionId);
    }
  }, [state.transactionId, pollPaymentStatus]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      isProcessing: false,
      error: null,
      currentProvider: platformConfig.preferredProvider,
      transactionId: null,
      requiresPolling: false,
      pollingStatus: null,
    });
  }, [platformConfig.preferredProvider]);

  const getPayButtonText = useCallback(() => {
    return paymentService.getPayButtonText(state.currentProvider);
  }, [state.currentProvider]);

  const formatPrice = useCallback((amount: number, currency: string) => {
    return paymentService.formatPrice(amount, currency);
  }, []);

  return {
    state,
    platformConfig,
    purchaseSubscription,
    purchasePromotion,
    pollStatus,
    resetState,
    getPayButtonText,
    formatPrice,
  };
}

// ============================================================================
// USE MONETIZATION STATUS HOOK
// ============================================================================

export interface UseMonetizationStatusReturn {
  status: MonetizationStatus | null;
  subscription: UserSubscription | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  canCreateListing: boolean;
  freeBoostsRemaining: number;
}

export function useMonetizationStatus(): UseMonetizationStatusReturn {
  const [status, setStatus] = useState<MonetizationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await monetizationApi.getMonetizationStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch monetization status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    subscription: status?.subscription || null,
    isLoading,
    error,
    refetch: fetchStatus,
    canCreateListing:
      status?.usage?.activeListingsCount !== undefined &&
      status?.capabilities?.maxActiveListings !== undefined
        ? status.usage.activeListingsCount < status.capabilities.maxActiveListings
        : true,
    freeBoostsRemaining: status?.capabilities?.freeBoostsRemaining || 0,
  };
}

// ============================================================================
// USE SUBSCRIPTION PLANS HOOK
// ============================================================================

export interface UseSubscriptionPlansReturn {
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscriptionPlans(): UseSubscriptionPlansReturn {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await monetizationApi.getSubscriptionPlans();
      setPlans(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscription plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    isLoading,
    error,
    refetch: fetchPlans,
  };
}

// ============================================================================
// USE PROMOTION PLANS HOOK
// ============================================================================

export interface UsePromotionPlansReturn {
  plans: PromotionPlan[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePromotionPlans(): UsePromotionPlansReturn {
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await monetizationApi.getPromotionPlans();
      setPlans(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch promotion plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    isLoading,
    error,
    refetch: fetchPlans,
  };
}

// ============================================================================
// USE LISTING PROMOTION HOOK
// ============================================================================

export interface UseListingPromotionReturn {
  hasActivePromotion: boolean;
  promotion: any | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useListingPromotion(listingId: number): UseListingPromotionReturn {
  const [promotion, setPromotion] = useState<any | null>(null);
  const [hasActivePromotion, setHasActivePromotion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotion = useCallback(async () => {
    if (!listingId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await monetizationApi.getListingPromotion(listingId);
      setHasActivePromotion(data.hasActivePromotion);
      setPromotion(data.promotion);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch listing promotion');
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchPromotion();
  }, [fetchPromotion]);

  return {
    hasActivePromotion,
    promotion,
    isLoading,
    error,
    refetch: fetchPromotion,
  };
}
