/**
 * 💰 PAYMENT SERVICE
 *
 * Unified payment service that detects platform and routes to the correct provider.
 *
 * FLUX PLĂȚI:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  📱 Mobile App                                              │
 * │                                                             │
 * │  User apasă "Cumpără"                                       │
 * │         │                                                   │
 * │         ▼                                                   │
 * │  ┌────────────────┐                                         │
 * │  │ detectPlatform │                                         │
 * │  └────────────────┘                                         │
 * │         │                                                   │
 * │    ┌────┴────┬──────────┐                                   │
 * │    ▼         ▼          ▼                                   │
 * │  iOS      Android      Web                                  │
 * │    │         │          │                                   │
 * │    ▼         ▼          ▼                                   │
 * │ Apple    Google     Moldova                                 │
 * │  IAP     Play       Payments                                │
 * │    │         │     (PAYNET/MAIB/MPAY)                       │
 * │    └────┬────┴──────────┘                                   │
 * │         ▼                                                   │
 * │   Backend procesează webhook                                │
 * │         │                                                   │
 * │         ▼                                                   │
 * │   Activează abonament/promoție                              │
 * └─────────────────────────────────────────────────────────────┘
 */

import { Platform as RNPlatform, Linking } from 'react-native';
import {
  Platform,
  PaymentProvider,
  PlatformPaymentConfig,
  SubscriptionPlan,
  PromotionPlan,
  BillingCycle,
  PaymentInitiationResult,
} from '../types';
import * as monetizationApi from '../api/monetizationApi';

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

/**
 * Detectează platforma curentă
 */
export function detectPlatform(): Platform {
  if (RNPlatform.OS === 'ios') return 'ios';
  if (RNPlatform.OS === 'android') return 'android';
  return 'web';
}

/**
 * Obține configurația de plată pentru platformă
 * Pe iOS și Android folosim plata simulată (MONETIZATION_ENABLED=true, paymentMethod:'simulated').
 * Aceasta activează instant promoția/abonamentul fără redirect la gateway.
 */
export function getPlatformPaymentConfig(): PlatformPaymentConfig {
  const platform = detectPlatform();

  switch (platform) {
    case 'ios':
      return {
        platform: 'ios',
        availableProviders: ['simulated'],
        preferredProvider: 'simulated',
        supportsIAP: false,
        supportsMoldovaPayments: false,
      };

    case 'android':
      return {
        platform: 'android',
        availableProviders: ['simulated'],
        preferredProvider: 'simulated',
        supportsIAP: false,
        supportsMoldovaPayments: false,
      };

    case 'web':
    default:
      return {
        platform: 'web',
        availableProviders: ['paynet', 'maib', 'mpay'],
        preferredProvider: 'paynet',
        supportsIAP: false,
        supportsMoldovaPayments: true,
      };
  }
}

/**
 * Verifică dacă platforma suportă un anumit provider
 */
export function isProviderAvailable(provider: PaymentProvider): boolean {
  const config = getPlatformPaymentConfig();
  return config.availableProviders.includes(provider);
}

// ============================================================================
// UNIFIED PURCHASE FUNCTIONS
// ============================================================================

export interface PurchaseSubscriptionParams {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  preferredProvider?: PaymentProvider;
}

export interface PurchasePromotionParams {
  plan: PromotionPlan;
  listingId: number;
  useFreeBoost?: boolean;
  preferredProvider?: PaymentProvider;
}

export interface PurchaseResult {
  success: boolean;
  provider: PaymentProvider;
  transactionId?: string | number;
  error?: string;
  requiresRedirect?: boolean;
  redirectUrl?: string;
  requiresPolling?: boolean;
}

/**
 * Cumpără un abonament - rutează automat la provider-ul corect
 */
export async function purchaseSubscription(
  params: PurchaseSubscriptionParams,
): Promise<PurchaseResult> {
  const { plan, billingCycle, preferredProvider } = params;
  const config = getPlatformPaymentConfig();
  const provider = preferredProvider || config.preferredProvider;

  console.log(`[PaymentService] Purchasing subscription: ${plan.code}, provider: ${provider}`);

  try {
    switch (provider) {
      case 'simulated':
        return await purchaseWithSimulatedSubscription({ plan, billingCycle });

      case 'apple':
        return await purchaseWithApple({
          type: 'subscription',
          productId:
            billingCycle === 'yearly'
              ? plan.appleProductIdYearly
              : plan.appleProductIdMonthly,
          itemId: plan.id,
          billingCycle,
        });

      case 'google':
        return await purchaseWithGoogle({
          type: 'subscription',
          productId:
            billingCycle === 'yearly'
              ? plan.googleProductIdYearly
              : plan.googleProductIdMonthly,
          itemId: plan.id,
          billingCycle,
        });

      case 'paynet':
        return await purchaseWithPaynet({
          type: 'subscription',
          itemId: plan.id,
          billingCycle,
        });

      case 'maib':
        return await purchaseWithMaib({
          type: 'subscription',
          itemId: plan.id,
          billingCycle,
        });

      case 'mpay':
        return await purchaseWithMpay({
          type: 'subscription',
          itemId: plan.id,
          billingCycle,
        });

      default:
        return {
          success: false,
          provider,
          error: `Provider ${provider} not supported`,
        };
    }
  } catch (error: any) {
    console.error(`[PaymentService] Purchase failed:`, error);
    return {
      success: false,
      provider,
      error: error.message || 'Purchase failed',
    };
  }
}

/**
 * Cumpără o promoție - rutează automat la provider-ul corect
 */
export async function purchasePromotion(
  params: PurchasePromotionParams,
): Promise<PurchaseResult> {
  const { plan, listingId, useFreeBoost, preferredProvider } = params;
  const config = getPlatformPaymentConfig();
  const provider = preferredProvider || config.preferredProvider;

  console.log(`[PaymentService] Purchasing promotion: ${plan.code}, listing: ${listingId}, provider: ${provider}`);

  // Dacă folosește boost gratuit, nu trebuie plată
  if (useFreeBoost) {
    try {
      const result = await monetizationApi.createPromotion(listingId, {
        promotionCode: plan.code,
        useFreeBoost: true,
      });

      return {
        success: result.success,
        provider: 'web',
        transactionId: result.promotion?.id,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'web',
        error: error.message || 'Failed to use free boost',
      };
    }
  }

  try {
    switch (provider) {
      case 'simulated':
        return await purchaseWithSimulatedPromotion({ plan, listingId });

      case 'apple':
        return await purchaseWithApple({
          type: 'promotion',
          productId: plan.appleProductId,
          itemId: plan.id,
          listingId,
        });

      case 'google':
        return await purchaseWithGoogle({
          type: 'promotion',
          productId: plan.googleProductId,
          itemId: plan.id,
          listingId,
        });

      case 'paynet':
        return await purchaseWithPaynet({
          type: 'promotion',
          itemId: plan.id,
          listingId,
        });

      case 'maib':
        return await purchaseWithMaib({
          type: 'promotion',
          itemId: plan.id,
          listingId,
        });

      case 'mpay':
        return await purchaseWithMpay({
          type: 'promotion',
          itemId: plan.id,
          listingId,
        });

      default:
        return {
          success: false,
          provider,
          error: `Provider ${provider} not supported`,
        };
    }
  } catch (error: any) {
    console.error(`[PaymentService] Promotion purchase failed:`, error);
    return {
      success: false,
      provider,
      error: error.message || 'Purchase failed',
    };
  }
}

// ============================================================================
// SIMULATED PAYMENT (MONETIZATION_ENABLED=true, fără gateway real)
// ============================================================================

/**
 * Activează instant un abonament prin paymentMethod:'simulated'.
 * Backend-ul nu redirecționează — răspunde direct cu status active.
 */
async function purchaseWithSimulatedSubscription(params: {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
}): Promise<PurchaseResult> {
  const { plan, billingCycle } = params;
  console.log(`[PaymentService] Simulated subscription: ${plan.code}, ${billingCycle}`);

  const result = await monetizationApi.createSubscription({
    planCode: plan.code,
    billingCycle,
    paymentMethod: 'simulated',
  });

  return {
    success: result.success,
    provider: 'simulated',
    transactionId: (result.subscription as any)?.id,
    requiresPolling: false,
    requiresRedirect: false,
  };
}

/**
 * Activează instant o promoție prin paymentMethod:'simulated'.
 * Backend-ul nu redirecționează — răspunde direct cu status active.
 */
async function purchaseWithSimulatedPromotion(params: {
  plan: PromotionPlan;
  listingId: number;
}): Promise<PurchaseResult> {
  const { plan, listingId } = params;
  console.log(`[PaymentService] Simulated promotion: ${plan.code}, listing: ${listingId}`);

  const result = await monetizationApi.createPromotion(listingId, {
    promotionCode: plan.code,
    paymentMethod: 'simulated',
  });

  return {
    success: result.success,
    provider: 'simulated',
    transactionId: (result.promotion as any)?.id,
    requiresPolling: false,
    requiresRedirect: false,
  };
}

// ============================================================================
// APPLE IAP
// ============================================================================

interface ApplePurchaseParams {
  type: 'subscription' | 'promotion';
  productId?: string;
  itemId: number;
  billingCycle?: BillingCycle;
  listingId?: number;
}

async function purchaseWithApple(params: ApplePurchaseParams): Promise<PurchaseResult> {
  const { type, productId, itemId, billingCycle, listingId } = params;

  if (!productId) {
    return {
      success: false,
      provider: 'apple',
      error: 'Apple Product ID not configured for this plan',
    };
  }

  console.log(`[PaymentService] Starting Apple IAP for product: ${productId}`);

  // TODO: Implement actual Apple IAP using react-native-iap
  // import * as IAP from 'react-native-iap';
  //
  // 1. Request product info
  // const products = await IAP.getProducts({ skus: [productId] });
  //
  // 2. Request purchase
  // const purchase = await IAP.requestPurchase({ sku: productId });
  //
  // 3. Verify receipt with backend
  // const verified = await monetizationApi.verifyAppleReceipt({
  //   receipt: purchase.transactionReceipt,
  //   productId,
  //   transactionId: purchase.transactionId,
  //   type,
  //   itemId,
  //   listingId,
  // });
  //
  // 4. Finish transaction
  // await IAP.finishTransaction({ purchase });

  // MOCK pentru development
  console.log('[PaymentService] Apple IAP - MOCK MODE');
  return {
    success: true,
    provider: 'apple',
    transactionId: `apple_${Date.now()}`,
    // În producție, așteptăm webhook-ul Apple pentru confirmare
  };
}

// ============================================================================
// GOOGLE PLAY BILLING
// ============================================================================

interface GooglePurchaseParams {
  type: 'subscription' | 'promotion';
  productId?: string;
  itemId: number;
  billingCycle?: BillingCycle;
  listingId?: number;
}

async function purchaseWithGoogle(params: GooglePurchaseParams): Promise<PurchaseResult> {
  const { type, productId, itemId, billingCycle, listingId } = params;

  if (!productId) {
    return {
      success: false,
      provider: 'google',
      error: 'Google Product ID not configured for this plan',
    };
  }

  console.log(`[PaymentService] Starting Google Play purchase for product: ${productId}`);

  // TODO: Implement actual Google Play Billing using react-native-iap
  // import * as IAP from 'react-native-iap';
  //
  // 1. Get subscriptions/products
  // const products = await IAP.getSubscriptions({ skus: [productId] });
  // or
  // const products = await IAP.getProducts({ skus: [productId] });
  //
  // 2. Request purchase
  // const purchase = await IAP.requestPurchase({ skus: [productId] });
  //
  // 3. Verify with backend
  // const verified = await monetizationApi.verifyGooglePurchase({
  //   purchaseToken: purchase.purchaseToken,
  //   productId,
  //   packageName: 'com.domaris.app',
  //   type,
  //   itemId,
  //   listingId,
  // });
  //
  // 4. Acknowledge purchase
  // await IAP.acknowledgePurchaseAndroid({ purchaseToken: purchase.purchaseToken });

  // MOCK pentru development
  console.log('[PaymentService] Google Play - MOCK MODE');
  return {
    success: true,
    provider: 'google',
    transactionId: `google_${Date.now()}`,
  };
}

// ============================================================================
// PAYNET MOLDOVA
// ============================================================================

interface PaynetPurchaseParams {
  type: 'subscription' | 'promotion';
  itemId: number;
  billingCycle?: BillingCycle;
  listingId?: number;
}

async function purchaseWithPaynet(params: PaynetPurchaseParams): Promise<PurchaseResult> {
  const { type, itemId, billingCycle, listingId } = params;

  console.log(`[PaymentService] Starting PAYNET payment`);

  try {
    const result = await monetizationApi.initiatePaynetPayment({
      type,
      itemId,
      billingCycle,
      listingId,
    });

    if (result.success && result.paymentUrl) {
      // Deschide URL-ul de plată în browser
      const canOpen = await Linking.canOpenURL(result.paymentUrl);
      if (canOpen) {
        await Linking.openURL(result.paymentUrl);
      }

      return {
        success: true,
        provider: 'paynet',
        transactionId: result.transactionId,
        requiresRedirect: true,
        redirectUrl: result.paymentUrl,
        requiresPolling: true, // App-ul trebuie să facă polling pentru status
      };
    }

    return {
      success: false,
      provider: 'paynet',
      error: result.error || 'Failed to initiate PAYNET payment',
    };
  } catch (error: any) {
    return {
      success: false,
      provider: 'paynet',
      error: error.message || 'PAYNET payment failed',
    };
  }
}

// ============================================================================
// MAIB E-COMMERCE
// ============================================================================

interface MaibPurchaseParams {
  type: 'subscription' | 'promotion';
  itemId: number;
  billingCycle?: BillingCycle;
  listingId?: number;
  saveCard?: boolean;
}

async function purchaseWithMaib(params: MaibPurchaseParams): Promise<PurchaseResult> {
  const { type, itemId, billingCycle, listingId, saveCard } = params;

  console.log(`[PaymentService] Starting MAIB payment`);

  try {
    const result = await monetizationApi.initiateMaibPayment({
      type,
      itemId,
      billingCycle,
      listingId,
      saveCard,
    });

    if (result.success && result.paymentUrl) {
      const canOpen = await Linking.canOpenURL(result.paymentUrl);
      if (canOpen) {
        await Linking.openURL(result.paymentUrl);
      }

      return {
        success: true,
        provider: 'maib',
        transactionId: result.transactionId,
        requiresRedirect: true,
        redirectUrl: result.paymentUrl,
        requiresPolling: true,
      };
    }

    return {
      success: false,
      provider: 'maib',
      error: result.error || 'Failed to initiate MAIB payment',
    };
  } catch (error: any) {
    return {
      success: false,
      provider: 'maib',
      error: error.message || 'MAIB payment failed',
    };
  }
}

// ============================================================================
// MPAY MOLDOVA
// ============================================================================

interface MpayPurchaseParams {
  type: 'subscription' | 'promotion';
  itemId: number;
  billingCycle?: BillingCycle;
  listingId?: number;
  phone?: string;
}

async function purchaseWithMpay(params: MpayPurchaseParams): Promise<PurchaseResult> {
  const { type, itemId, billingCycle, listingId, phone } = params;

  console.log(`[PaymentService] Starting MPAY payment`);

  try {
    const result = await monetizationApi.initiateMpayPayment({
      type,
      itemId,
      billingCycle,
      listingId,
      phone,
    });

    if (result.success) {
      // MPAY poate avea deep link sau QR code
      if (result.mpayDeepLink) {
        const canOpen = await Linking.canOpenURL(result.mpayDeepLink);
        if (canOpen) {
          await Linking.openURL(result.mpayDeepLink);
        }
      }

      return {
        success: true,
        provider: 'mpay',
        transactionId: result.transactionId,
        requiresRedirect: !!result.mpayDeepLink,
        redirectUrl: result.mpayDeepLink,
        requiresPolling: true,
      };
    }

    return {
      success: false,
      provider: 'mpay',
      error: result.error || 'Failed to initiate MPAY payment',
    };
  } catch (error: any) {
    return {
      success: false,
      provider: 'mpay',
      error: error.message || 'MPAY payment failed',
    };
  }
}

// ============================================================================
// PAYMENT STATUS POLLING
// ============================================================================

/**
 * Verifică periodic statusul plății
 * Util pentru providerii care folosesc redirect (PAYNET, MAIB, MPAY)
 */
export async function pollPaymentStatus(
  transactionId: string | number,
  options: {
    interval?: number; // ms între verificări
    maxAttempts?: number;
    onStatusChange?: (status: string) => void;
  } = {},
): Promise<{
  success: boolean;
  status: string;
  error?: string;
}> {
  const { interval = 3000, maxAttempts = 60, onStatusChange } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await monetizationApi.checkPaymentStatus(transactionId);

      if (onStatusChange) {
        onStatusChange(result.status);
      }

      if (result.status === 'completed') {
        return { success: true, status: 'completed' };
      }

      if (result.status === 'failed' || result.status === 'cancelled') {
        return {
          success: false,
          status: result.status,
          error: result.failureReason,
        };
      }

      // Încă pending, așteptăm
      await new Promise((resolve) => setTimeout(resolve, interval));
    } catch (error) {
      console.error('[PaymentService] Polling error:', error);
      // Continuăm să încercăm
    }
  }

  return {
    success: false,
    status: 'timeout',
    error: 'Payment verification timed out',
  };
}

// ============================================================================
// PRICE HELPERS
// ============================================================================

/**
 * Formatează prețul pentru afișare
 */
export function formatPrice(amount: number, currency: string): string {
  if (currency === 'MDL') {
    return `${amount.toFixed(0)} MDL`;
  }
  if (currency === 'EUR') {
    return `${amount.toFixed(2)}€`;
  }
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * Obține prețul corect bazat pe billing cycle
 */
export function getSubscriptionPrice(plan: SubscriptionPlan, billingCycle: BillingCycle): number {
  return billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
}

/**
 * Calculează economiile pentru plan anual
 */
export function calculateYearlySavings(plan: SubscriptionPlan): number {
  const yearlyTotal = plan.priceYearly * 12;
  const monthlyTotal = plan.priceMonthly * 12;
  return monthlyTotal - yearlyTotal;
}

// ============================================================================
// PROVIDER INFO HELPERS
// ============================================================================

/**
 * Returnează informații despre provider pentru UI
 */
export function getProviderInfo(provider: PaymentProvider): {
  name: string;
  icon: string;
  description: string;
} {
  const providers: Record<PaymentProvider, { name: string; icon: string; description: string }> = {
    simulated: {
      name: 'Plată',
      icon: 'zap',
      description: 'Activare instantă',
    },
    apple: {
      name: 'Apple Pay',
      icon: 'apple',
      description: 'Plătește cu Apple Pay',
    },
    google: {
      name: 'Google Pay',
      icon: 'google',
      description: 'Plătește cu Google Pay',
    },
    paynet: {
      name: 'PAYNET',
      icon: 'credit-card',
      description: 'Plată cu cardul prin PAYNET',
    },
    maib: {
      name: 'MAIB',
      icon: 'building',
      description: 'Plată cu cardul MAIB',
    },
    mpay: {
      name: 'MPAY',
      icon: 'smartphone',
      description: 'Plată mobilă MPAY',
    },
    web: {
      name: 'Web',
      icon: 'globe',
      description: 'Plată online',
    },
  };

  return providers[provider] || providers.web;
}

/**
 * Returnează textul pentru butonul de plată
 */
export function getPayButtonText(provider: PaymentProvider): string {
  switch (provider) {
    case 'simulated':
      return 'Activează Acum';
    case 'apple':
      return 'Plătește cu Apple Pay';
    case 'google':
      return 'Plătește cu Google Pay';
    case 'paynet':
      return 'Plătește cu PAYNET';
    case 'maib':
      return 'Plătește cu cardul MAIB';
    case 'mpay':
      return 'Plătește cu MPAY';
    default:
      return 'Plătește';
  }
}
