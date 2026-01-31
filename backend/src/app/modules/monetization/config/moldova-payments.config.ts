/**
 * 🇲🇩 MOLDOVA PAYMENTS CONFIGURATION
 *
 * Configurare pentru procesatorii de plăți din Moldova.
 *
 * NOTĂ: Adăugați aceste variabile în .env file:
 *
 * # ===== PAYNET Moldova =====
 * PAYNET_MERCHANT_ID=your_merchant_id
 * PAYNET_SECRET_KEY=your_secret_key
 * PAYNET_API_URL=https://paynet.md/api/v1
 * # Use sandbox for testing
 * # PAYNET_API_URL=https://sandbox.paynet.md/api/v1
 *
 * # ===== MAIB E-Commerce =====
 * MAIB_MERCHANT_ID=your_merchant_id
 * MAIB_TERMINAL_ID=your_terminal_id
 * MAIB_CERT_PATH=/path/to/maib-cert.pem
 * MAIB_KEY_PATH=/path/to/maib-key.pem
 * MAIB_API_URL=https://ecomm.maib.md
 * # Use test environment for testing
 * # MAIB_API_URL=https://ecomm-test.maib.md
 *
 * # ===== MPAY Moldova =====
 * MPAY_MERCHANT_ID=your_merchant_id
 * MPAY_SECRET_KEY=your_secret_key
 * MPAY_API_URL=https://api.mpay.md/v1
 * # Use sandbox for testing
 * # MPAY_API_URL=https://sandbox.mpay.md/api/v1
 */

import { registerAs } from '@nestjs/config';

export interface PaynetConfig {
  merchantId: string;
  secretKey: string;
  apiUrl: string;
  webhookUrl: string;
  returnUrl: string;
}

export interface MaibConfig {
  merchantId: string;
  terminalId: string;
  certPath: string;
  keyPath: string;
  apiUrl: string;
  webhookUrl: string;
  returnUrl: string;
}

export interface MpayConfig {
  merchantId: string;
  secretKey: string;
  apiUrl: string;
  webhookUrl: string;
}

export interface MoldovaPaymentsConfig {
  paynet: PaynetConfig;
  maib: MaibConfig;
  mpay: MpayConfig;
  defaultCurrency: string;
}

export default registerAs('moldovaPayments', (): MoldovaPaymentsConfig => {
  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  const appUrl = process.env.APP_URL || 'http://localhost:3001';

  return {
    paynet: {
      merchantId: process.env.PAYNET_MERCHANT_ID || '',
      secretKey: process.env.PAYNET_SECRET_KEY || '',
      apiUrl: process.env.PAYNET_API_URL || 'https://paynet.md/api/v1',
      webhookUrl: `${apiUrl}/monetization/webhooks/paynet`,
      returnUrl: `${appUrl}/payments/paynet/complete`,
    },
    maib: {
      merchantId: process.env.MAIB_MERCHANT_ID || '',
      terminalId: process.env.MAIB_TERMINAL_ID || '',
      certPath: process.env.MAIB_CERT_PATH || '',
      keyPath: process.env.MAIB_KEY_PATH || '',
      apiUrl: process.env.MAIB_API_URL || 'https://ecomm.maib.md',
      webhookUrl: `${apiUrl}/monetization/webhooks/maib`,
      returnUrl: `${appUrl}/payments/maib/complete`,
    },
    mpay: {
      merchantId: process.env.MPAY_MERCHANT_ID || '',
      secretKey: process.env.MPAY_SECRET_KEY || '',
      apiUrl: process.env.MPAY_API_URL || 'https://api.mpay.md/v1',
      webhookUrl: `${apiUrl}/monetization/webhooks/mpay`,
    },
    defaultCurrency: 'MDL',
  };
});

/**
 * Webhook payload types pentru fiecare provider
 */

// PAYNET Webhook Events
export type PaynetWebhookEvent =
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'REFUND_COMPLETED';

export interface PaynetWebhookPayload {
  event: PaynetWebhookEvent;
  transactionId: string;
  externalId: string; // Our order ID
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  signature: string;
  metadata?: Record<string, any>;
}

// MAIB Webhook Events
export type MaibWebhookEvent =
  | 'transaction.success'
  | 'transaction.failed'
  | 'transaction.cancelled'
  | 'recurring.success'
  | 'recurring.failed'
  | 'refund.success';

export interface MaibWebhookPayload {
  event_type: MaibWebhookEvent;
  transaction_id: string;
  merchant_order_id: string;
  amount: number;
  currency: string;
  card_token?: string;
  card_mask?: string; // e.g., "4111****1111"
  timestamp: string;
  signature: string;
}

// MPAY Webhook Events
export type MpayWebhookAction =
  | 'payment_completed'
  | 'payment_failed'
  | 'payment_cancelled'
  | 'payment_expired';

export interface MpayWebhookPayload {
  action: MpayWebhookAction;
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  phone?: string;
  timestamp: string;
  hash: string;
}

/**
 * Payment status mapping pentru fiecare provider
 */
export const PAYMENT_STATUS_MAP = {
  paynet: {
    PAYMENT_CONFIRMED: 'completed',
    PAYMENT_FAILED: 'failed',
    PAYMENT_CANCELLED: 'cancelled',
  },
  maib: {
    'transaction.success': 'completed',
    'transaction.failed': 'failed',
    'transaction.cancelled': 'cancelled',
  },
  mpay: {
    payment_completed: 'completed',
    payment_failed: 'failed',
    payment_cancelled: 'cancelled',
    payment_expired: 'expired',
  },
} as const;

/**
 * Helper pentru a obține comisioanele fiecărui provider
 * Acestea sunt estimări - verificați contractul cu fiecare provider
 */
export const PROVIDER_FEES = {
  paynet: {
    percentage: 2.5, // 2.5% comision
    fixedMdl: 0, // Fără taxă fixă
  },
  maib: {
    percentage: 2.0, // 2% comision pentru carduri locale
    percentageInternational: 3.0, // 3% pentru carduri internaționale
    fixedMdl: 0,
  },
  mpay: {
    percentage: 3.0, // 3% comision
    fixedMdl: 1, // 1 MDL taxă fixă per tranzacție
  },
  apple: {
    percentage: 15, // 15% pentru small business (altfel 30%)
    fixedMdl: 0,
  },
  google: {
    percentage: 15, // 15% pentru primele 1M USD (altfel 30%)
    fixedMdl: 0,
  },
} as const;

/**
 * Calculează comisionul net pentru un provider
 */
export function calculateProviderFee(
  provider: keyof typeof PROVIDER_FEES,
  amount: number,
): number {
  const fees = PROVIDER_FEES[provider];
  const percentageFee = (amount * fees.percentage) / 100;
  const fixedFee = 'fixedMdl' in fees ? fees.fixedMdl : 0;
  return percentageFee + fixedFee;
}

/**
 * Returnează suma netă după comisioane
 */
export function calculateNetAmount(
  provider: keyof typeof PROVIDER_FEES,
  grossAmount: number,
): number {
  return grossAmount - calculateProviderFee(provider, grossAmount);
}
