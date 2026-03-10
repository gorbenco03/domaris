/**
 * 🇲🇩 MOLDOVA PAYMENTS SERVICE
 *
 * Serviciu dedicat pentru integrarea cu procesatorii de plăți din Moldova.
 *
 * PROVIDERI SUPORTAȚI:
 *
 * 1. PAYNET Moldova (paynet.md)
 *    - Cel mai popular procesator din Moldova
 *    - Suportă: carduri Visa/Mastercard, plăți recurente
 *    - API: REST cu HMAC signature
 *    - Documentație: https://paynet.md/developers
 *
 * 2. MAIB E-Commerce (maib.md)
 *    - Moldova Agroindbank - cea mai mare bancă
 *    - Suportă: 3D Secure, tokenizare carduri, plăți recurente
 *    - API: REST cu certificate SSL mutual
 *    - Documentație: https://maib.md/e-commerce
 *
 * 3. MPAY Moldova (mpay.md)
 *    - Serviciu de plăți mobile
 *    - Suportă: plăți SMS, aplicație mobilă, QR code
 *    - API: REST
 *    - Documentație: https://mpay.md/developers
 *
 * CONFIGURARE (.env):
 * PAYNET_MERCHANT_ID=xxx
 * PAYNET_SECRET_KEY=xxx
 * PAYNET_API_URL=https://paynet.md/api/v1
 *
 * MAIB_MERCHANT_ID=xxx
 * MAIB_TERMINAL_ID=xxx
 * MAIB_CERT_PATH=/path/to/cert.pem
 * MAIB_KEY_PATH=/path/to/key.pem
 * MAIB_API_URL=https://ecomm.maib.md/api
 *
 * MPAY_MERCHANT_ID=xxx
 * MPAY_SECRET_KEY=xxx
 * MPAY_API_URL=https://api.mpay.md/v1
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Op } from 'sequelize';
import { Transaction } from '../../../db/entities/transaction.entity.js';
import { UserSubscription } from '../../../db/entities/user-subscription.entity.js';
import { ListingPromotion } from '../../../db/entities/listing-promotion.entity.js';
import { SubscriptionPlan } from '../../../db/entities/subscription-plan.entity.js';
import { PromotionPlan } from '../../../db/entities/promotion-plan.entity.js';
import { Listing } from '../../../db/entities/listing.entity.js';

export interface PaymentInitiationResult {
  success: boolean;
  paymentUrl?: string;
  deepLink?: string;
  qrCode?: string;
  transactionId: number;
  externalPaymentId?: string;
  expiresAt: Date;
  error?: string;
}

export interface PaymentCallbackData {
  externalPaymentId: string;
  status: 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class MoldovaPaymentsService {
  private readonly logger = new Logger(MoldovaPaymentsService.name);

  constructor(private readonly configService: ConfigService) {}

  // ============================================================================
  // PAYNET INTEGRATION
  // ============================================================================

  /**
   * Inițiază o plată PAYNET
   */
  async initiatePaynetPayment(
    userId: number,
    type: 'subscription' | 'promotion',
    itemId: number,
    options: {
      billingCycle?: 'monthly' | 'yearly';
      listingId?: number;
    } = {},
  ): Promise<PaymentInitiationResult> {
    this.logger.log(`Initiating PAYNET payment for user ${userId}, type: ${type}`);

    try {
      if (type === 'promotion') {
        await this.validatePromotionPaymentRequest(userId, options.listingId);
      }

      // 1. Calculează suma
      const { amount, currency, description } = await this.calculatePaymentAmount(
        type,
        itemId,
        options.billingCycle,
      );

      // 2. Creează transaction pending
      const transaction = await Transaction.create({
        userId,
        type: type === 'subscription' ? 'subscription' : 'promotion',
        status: 'pending',
        amount,
        currency,
        paymentMethod: 'paynet',
        description,
        metadata: {
          itemId,
          type,
          billingCycle: options.billingCycle,
          listingId: options.listingId,
        },
      });

      // 3. Apelează PAYNET API
      const paynetMerchantId = this.configService.get('PAYNET_MERCHANT_ID');
      const paynetSecretKey = this.configService.get('PAYNET_SECRET_KEY');

      if (!paynetMerchantId || !paynetSecretKey) {
        this.logger.warn('PAYNET credentials not configured');
        const mockPaymentId = `PAY-${Date.now()}`;
        await transaction.update({
          externalTransactionId: mockPaymentId,
          paynetTransactionId: mockPaymentId,
          paymentProvider: 'paynet',
        });

        // În development, returnăm un URL mock
        return {
          success: true,
          paymentUrl: `https://paynet.md/demo/checkout?order=${transaction.id}`,
          transactionId: transaction.id,
          externalPaymentId: mockPaymentId,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        };
      }

      // TODO: Fă request real la PAYNET API (payload, signature, paynetApiUrl)
      // const payload = {
      //   merchant_id: paynetMerchantId,
      //   order_id: transaction.id.toString(),
      //   amount: Math.round(amount * 100),
      //   currency, description,
      //   return_url: `${this.configService.get('APP_URL')}/payments/paynet/return`,
      //   callback_url: `${this.configService.get('API_URL')}/monetization/webhooks/paynet`,
      //   language: 'ro',
      // };
      // const signature = this.generatePaynetSignature(payload, paynetSecretKey);
      // const paynetApiUrl = this.configService.get('PAYNET_API_URL', 'https://paynet.md/api/v1');
      // const response = await fetch(`${paynetApiUrl}/payments/create`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
      //   body: JSON.stringify(payload),
      // });
      // const data = await response.json();

      // Mock response pentru development
      const mockPaymentId = `PAY-${Date.now()}`;
      await transaction.update({
        externalTransactionId: mockPaymentId,
        paynetTransactionId: mockPaymentId,
        paymentProvider: 'paynet',
      });

      return {
        success: true,
        paymentUrl: `https://paynet.md/checkout/${mockPaymentId}`,
        transactionId: transaction.id,
        externalPaymentId: mockPaymentId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      };
    } catch (error: any) {
      this.logger.error(`PAYNET initiation failed: ${error.message}`);
      return {
        success: false,
        transactionId: 0,
        expiresAt: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Generează semnătură HMAC pentru PAYNET
   */
  private generatePaynetSignature(payload: Record<string, any>, secretKey: string): string {
    const sortedKeys = Object.keys(payload).sort();
    const dataString = sortedKeys.map((key) => `${key}=${payload[key]}`).join('&');
    return crypto.createHmac('sha256', secretKey).update(dataString).digest('hex');
  }

  /**
   * Verifică semnătura webhook PAYNET
   */
  verifyPaynetWebhook(body: Record<string, any>, signature: string): boolean {
    const secretKey = this.configService.get('PAYNET_SECRET_KEY');
    if (!secretKey) return false;

    const expectedSignature = this.generatePaynetSignature(body, secretKey);
    const signatureBuffer = Buffer.from(signature || '');
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  }

  // ============================================================================
  // MAIB INTEGRATION
  // ============================================================================

  /**
   * Inițiază o plată MAIB E-Commerce
   */
  async initiateMaibPayment(
    userId: number,
    type: 'subscription' | 'promotion',
    itemId: number,
    options: {
      billingCycle?: 'monthly' | 'yearly';
      listingId?: number;
      saveCard?: boolean;
    } = {},
  ): Promise<PaymentInitiationResult> {
    this.logger.log(`Initiating MAIB payment for user ${userId}, type: ${type}`);

    try {
      if (type === 'promotion') {
        await this.validatePromotionPaymentRequest(userId, options.listingId);
      }

      // 1. Calculează suma
      const { amount, currency, description } = await this.calculatePaymentAmount(
        type,
        itemId,
        options.billingCycle,
      );

      // 2. Creează transaction pending
      const transaction = await Transaction.create({
        userId,
        type: type === 'subscription' ? 'subscription' : 'promotion',
        status: 'pending',
        amount,
        currency,
        paymentMethod: 'maib',
        description,
        metadata: {
          itemId,
          type,
          billingCycle: options.billingCycle,
          listingId: options.listingId,
          saveCard: options.saveCard,
        },
      });

      // 3. Configurare MAIB
      const maibMerchantId = this.configService.get('MAIB_MERCHANT_ID');
      const maibTerminalId = this.configService.get('MAIB_TERMINAL_ID');

      if (!maibMerchantId || !maibTerminalId) {
        this.logger.warn('MAIB credentials not configured');
        const mockTransactionId = `MAIB-${Date.now()}`;
        await transaction.update({
          externalTransactionId: mockTransactionId,
          maibTransactionId: mockTransactionId,
          paymentProvider: 'maib',
        });

        return {
          success: true,
          paymentUrl: `https://ecomm.maib.md/demo?order=${transaction.id}`,
          transactionId: transaction.id,
          externalPaymentId: mockTransactionId,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        };
      }

      // TODO: Implement real MAIB API call
      // MAIB folosește certificate SSL mutual pentru autentificare
      // const agent = new https.Agent({
      //   cert: fs.readFileSync(this.configService.get('MAIB_CERT_PATH')),
      //   key: fs.readFileSync(this.configService.get('MAIB_KEY_PATH')),
      // });

      const mockTransactionId = `MAIB-${Date.now()}`;
      await transaction.update({
        externalTransactionId: mockTransactionId,
        maibTransactionId: mockTransactionId,
        paymentProvider: 'maib',
      });

      return {
        success: true,
        paymentUrl: `https://ecomm.maib.md/ecomm/ClientHandler?trans_id=${mockTransactionId}`,
        transactionId: transaction.id,
        externalPaymentId: mockTransactionId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      };
    } catch (error: any) {
      this.logger.error(`MAIB initiation failed: ${error.message}`);
      return {
        success: false,
        transactionId: 0,
        expiresAt: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Verifică semnătura webhook MAIB
   */
  verifyMaibWebhook(body: Record<string, any>, signature: string): boolean {
    // MAIB folosește certificate pentru verificare
    // Implementare specifică depinde de documentația MAIB
    return true; // TODO: Implement proper verification
  }

  // ============================================================================
  // MPAY INTEGRATION
  // ============================================================================

  /**
   * Inițiază o plată MPAY
   */
  async initiateMpayPayment(
    userId: number,
    type: 'subscription' | 'promotion',
    itemId: number,
    options: {
      billingCycle?: 'monthly' | 'yearly';
      listingId?: number;
      phone?: string;
    } = {},
  ): Promise<PaymentInitiationResult> {
    this.logger.log(`Initiating MPAY payment for user ${userId}, type: ${type}`);

    try {
      if (type === 'promotion') {
        await this.validatePromotionPaymentRequest(userId, options.listingId);
      }

      // 1. Calculează suma
      const { amount, currency, description } = await this.calculatePaymentAmount(
        type,
        itemId,
        options.billingCycle,
      );

      // 2. Creează transaction pending
      const transaction = await Transaction.create({
        userId,
        type: type === 'subscription' ? 'subscription' : 'promotion',
        status: 'pending',
        amount,
        currency,
        paymentMethod: 'mpay',
        description,
        metadata: {
          itemId,
          type,
          billingCycle: options.billingCycle,
          listingId: options.listingId,
          phone: options.phone,
        },
      });

      // 3. Configurare MPAY
      const mpayMerchantId = this.configService.get('MPAY_MERCHANT_ID');
      const mpaySecretKey = this.configService.get('MPAY_SECRET_KEY');

      if (!mpayMerchantId || !mpaySecretKey) {
        this.logger.warn('MPAY credentials not configured');
        const mockPaymentId = `MPAY-${Date.now()}`;
        await transaction.update({
          externalTransactionId: mockPaymentId,
          mpayTransactionId: mockPaymentId,
          paymentProvider: 'mpay',
        });

        return {
          success: true,
          deepLink: `mpay://pay/${mockPaymentId}`,
          qrCode: await this.generateMockQRCode(mockPaymentId, amount),
          transactionId: transaction.id,
          externalPaymentId: mockPaymentId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        };
      }

      // TODO: Implement real MPAY API call
      const mockPaymentId = `MPAY-${Date.now()}`;
      await transaction.update({
        externalTransactionId: mockPaymentId,
        mpayTransactionId: mockPaymentId,
        paymentProvider: 'mpay',
      });

      return {
        success: true,
        deepLink: `mpay://pay/${mockPaymentId}`,
        qrCode: await this.generateMockQRCode(mockPaymentId, amount),
        transactionId: transaction.id,
        externalPaymentId: mockPaymentId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    } catch (error: any) {
      this.logger.error(`MPAY initiation failed: ${error.message}`);
      return {
        success: false,
        transactionId: 0,
        expiresAt: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Generează QR code mock pentru MPAY
   */
  private async generateMockQRCode(paymentId: string, amount: number): Promise<string> {
    // TODO: Folosește o librărie reală de QR code (qrcode npm package)
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="10">QR:${paymentId}</text></svg>`;
  }

  /**
   * Verifică hash MPAY
   */
  verifyMpayHash(body: Record<string, any>, hash: string): boolean {
    const secretKey = this.configService.get('MPAY_SECRET_KEY');
    if (!secretKey) return false;

    const dataString = `${body.payment_id}${body.order_id}${body.amount}${secretKey}`;
    const expectedHash = crypto.createHash('md5').update(dataString).digest('hex');
    return hash === expectedHash;
  }

  // ============================================================================
  // COMMON UTILITIES
  // ============================================================================

  /**
   * Calculează suma de plată pentru un item
   */
  private async calculatePaymentAmount(
    type: 'subscription' | 'promotion',
    itemId: number,
    billingCycle?: 'monthly' | 'yearly',
  ): Promise<{ amount: number; currency: string; description: string }> {
    if (type === 'subscription') {
      const plan = await SubscriptionPlan.findByPk(itemId);
      if (!plan) {
        throw new BadRequestException('Subscription plan not found');
      }

      const amount = billingCycle === 'yearly'
        ? (plan.priceYearly ?? plan.priceMonthly) * 12 // Preț anual total
        : plan.priceMonthly;

      return {
        amount,
        currency: plan.currency,
        description: `Abonament ${plan.name} - ${billingCycle === 'yearly' ? 'Anual' : 'Lunar'}`,
      };
    } else {
      const plan = await PromotionPlan.findByPk(itemId);
      if (!plan) {
        throw new BadRequestException('Promotion plan not found');
      }

      return {
        amount: plan.price,
        currency: plan.currency,
        description: `Promovare: ${plan.name}`,
      };
    }
  }

  /**
   * Procesează callback de plată reușită
   */
  async processSuccessfulPayment(
    transactionId: number,
    externalPaymentId: string,
    provider: 'paynet' | 'maib' | 'mpay',
  ): Promise<void> {
    this.logger.log(`Processing successful ${provider} payment: ${transactionId}`);

    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.status === 'completed') {
      this.logger.warn(`Transaction ${transactionId} already completed`);
      return;
    }

    // Activează abonamentul sau promoția
    const metadata = (transaction.metadata || {}) as Record<string, unknown>;

    if (transaction.type === 'subscription') {
      const planId = Number(metadata?.itemId);
      if (!Number.isFinite(planId)) {
        throw new BadRequestException('Invalid subscription metadata in transaction');
      }

      await this.activateSubscription(
        transaction.userId,
        planId,
        metadata.billingCycle === 'yearly' ? 'yearly' : 'monthly',
        provider,
        externalPaymentId,
      );
    } else if (transaction.type === 'promotion') {
      const listingId = Number(metadata?.listingId);
      const promotionPlanId = Number(metadata?.itemId);

      if (!Number.isFinite(listingId) || !Number.isFinite(promotionPlanId)) {
        throw new BadRequestException('Invalid promotion metadata in transaction');
      }

      await this.activatePromotion(
        listingId,
        promotionPlanId,
        transaction,
        provider,
        externalPaymentId,
      );
    } else {
      throw new BadRequestException(`Unsupported transaction type: ${transaction.type}`);
    }

    const completedAt = new Date();

    await transaction.update({
      status: 'completed',
      paymentProvider: provider,
      ...this.getProviderTransactionUpdate(provider, externalPaymentId),
      completedAt,
      failedAt: undefined,
      failureMessage: undefined,
    });
  }

  /**
   * Activează un abonament după plată reușită
   */
  private async activateSubscription(
    userId: number,
    planId: number,
    billingCycle: 'monthly' | 'yearly',
    provider: 'paynet' | 'maib' | 'mpay',
    externalId: string,
  ): Promise<void> {
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan) {
      throw new BadRequestException('Subscription plan not found');
    }

    // Verifică dacă există deja un abonament
    const existing = await UserSubscription.findOne({
      where: {
        userId,
        status: ['active', 'trialing'],
      } as any,
    });

    if (existing) {
      // Upgrade/schimbare plan
      await existing.update({
        planId,
        billingCycle,
        paymentProvider: provider,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.calculatePeriodEnd(billingCycle),
        [`${provider}SubscriptionId`]: externalId,
      });
    } else {
      // Creare abonament nou
      await UserSubscription.create({
        userId,
        planId,
        status: 'active',
        billingCycle,
        startedAt: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.calculatePeriodEnd(billingCycle),
        paymentProvider: provider,
        autoRenew: true,
        boostsUsedThisMonth: 0,
        [`${provider}SubscriptionId`]: externalId,
      } as any);
    }

    this.logger.log(`Activated ${plan.code} subscription for user ${userId}`);
  }

  /**
   * Activează o promoție după plată reușită
   */
  private async activatePromotion(
    listingId: number,
    promotionPlanId: number,
    transaction: Transaction,
    provider: 'paynet' | 'maib' | 'mpay',
    externalPaymentId: string,
  ): Promise<void> {
    const plan = await PromotionPlan.findByPk(promotionPlanId);
    if (!plan) {
      throw new BadRequestException('Promotion plan not found');
    }

    const listing = await Listing.findByPk(listingId);
    if (!listing) {
      throw new BadRequestException('Listing not found');
    }

    if (String(listing.ownerId) !== String(transaction.userId)) {
      throw new BadRequestException('Transaction user does not own this listing');
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const activePromotion = await ListingPromotion.findOne({
      where: {
        listingId,
        status: 'active',
        endDate: { [Op.gt]: now },
      },
      order: [['createdAt', 'DESC']],
    });

    if (activePromotion) {
      this.logger.warn(
        `Listing ${listingId} already has active promotion ${activePromotion.id}; skipping activation for transaction ${transaction.id}`,
      );
      return;
    }

    const pendingPromotion = await ListingPromotion.findOne({
      where: {
        listingId,
        userId: transaction.userId,
        promotionPlanId,
        status: 'pending',
      },
      order: [['createdAt', 'DESC']],
    });

    const promotionPayload = {
      promotionPlanId,
      status: 'active',
      startDate: now,
      endDate,
      activatedAt: now,
      searchBoostMultiplier: plan.searchBoostMultiplier,
      showBadge: plan.showBadge,
      showOnHomepage: plan.showOnHomepage,
      isHighlighted: plan.isHighlighted,
      amountPaid: Number(transaction.amount),
      currency: transaction.currency || plan.currency,
      paymentStatus: 'completed',
      isFreeBoost: false,
      metadata: {
        ...(pendingPromotion?.metadata || {}),
        paymentProvider: provider,
        transactionId: transaction.id,
        externalTransactionId: externalPaymentId,
      },
    };

    if (pendingPromotion) {
      await pendingPromotion.update(promotionPayload as any);
      this.logger.log(`Activated pending promotion ${pendingPromotion.id} for listing ${listingId}`);
      return;
    }

    await ListingPromotion.create({
      userId: transaction.userId,
      listingId,
      ...promotionPayload,
    } as any);

    this.logger.log(`Activated promotion for listing ${listingId} from transaction ${transaction.id}`);
  }

  private getProviderTransactionUpdate(
    provider: 'paynet' | 'maib' | 'mpay',
    externalPaymentId: string,
  ): Partial<Transaction> {
    const updates: Record<string, any> = {
      externalTransactionId: externalPaymentId,
    };

    if (provider === 'paynet') {
      updates.paynetTransactionId = externalPaymentId;
    } else if (provider === 'maib') {
      updates.maibTransactionId = externalPaymentId;
    } else if (provider === 'mpay') {
      updates.mpayTransactionId = externalPaymentId;
    }

    return updates;
  }

  private async validatePromotionPaymentRequest(
    userId: number,
    listingId?: number,
  ): Promise<void> {
    if (!listingId) {
      throw new BadRequestException('listingId is required for promotion payments');
    }

    const listing = await Listing.findByPk(listingId);
    if (!listing) {
      throw new BadRequestException('Listing not found');
    }

    if (String(listing.ownerId) !== String(userId)) {
      throw new BadRequestException('You are not the owner of this listing');
    }

    const existingActivePromotion = await ListingPromotion.findOne({
      where: {
        listingId,
        status: 'active',
        endDate: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });

    if (existingActivePromotion) {
      throw new BadRequestException(
        'This listing already has an active promotion. Wait for it to expire or cancel it first.',
      );
    }
  }

  /**
   * Calculează data de sfârșit a perioadei
   */
  private calculatePeriodEnd(billingCycle: 'monthly' | 'yearly'): Date {
    const now = new Date();
    if (billingCycle === 'yearly') {
      return new Date(now.setFullYear(now.getFullYear() + 1));
    }
    return new Date(now.setMonth(now.getMonth() + 1));
  }

  /**
   * Procesează plată eșuată
   */
  async processFailedPayment(
    transactionId: number,
    reason: string,
  ): Promise<void> {
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) return;

    if (transaction.status === 'completed') {
      this.logger.warn(`Skipping failed update for completed transaction ${transactionId}`);
      return;
    }

    await transaction.update({
      status: 'failed',
      failureMessage: reason,
      failedAt: new Date(),
    });

    this.logger.warn(`Payment ${transactionId} failed: ${reason}`);
  }
}
