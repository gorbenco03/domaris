/**
 * 💰 MONETIZATION CONTROLLER
 *
 * API endpoints pentru monetizare.
 * Conform documentației 11-MONETIZATION.md
 *
 * IMPORTANT PENTRU MOLDOVA:
 * Stripe NU funcționează în Moldova, folosim:
 * - PAYNET Moldova (cel mai popular)
 * - MAIB E-Commerce (cea mai mare bancă)
 * - MPAY Moldova (plăți mobile)
 * - Apple IAP / Google Play Billing (funcționează!)
 *
 * Endpoints:
 *
 * SUBSCRIPTIONS:
 * - GET /monetization/plans - List subscription plans (public)
 * - GET /monetization/subscription - Get my subscription
 * - POST /monetization/subscription - Create subscription
 * - PATCH /monetization/subscription/change-plan - Change plan
 * - DELETE /monetization/subscription - Cancel subscription
 *
 * PROMOTIONS:
 * - GET /monetization/promotions/options - List promotion plans (public)
 * - POST /monetization/listings/:id/promote - Create promotion
 * - GET /monetization/my-promotions - Get my promotions
 * - DELETE /monetization/promotions/:id - Cancel promotion
 *
 * STATUS:
 * - GET /monetization/status - Get full monetization status
 *
 * TRANSACTIONS:
 * - GET /monetization/transactions - Get my transactions
 *
 * WEBHOOKS (for payment providers):
 * - POST /monetization/webhooks/stripe (fallback, nu funcționează în Moldova)
 * - POST /monetization/webhooks/apple (funcționează!)
 * - POST /monetization/webhooks/google (funcționează!)
 * - POST /monetization/webhooks/paynet (PAYNET Moldova)
 * - POST /monetization/webhooks/maib (MAIB E-Commerce)
 * - POST /monetization/webhooks/mpay (MPAY Moldova)
 *
 * PAYMENT INITIATION (Moldova):
 * - POST /monetization/payments/paynet/initiate
 * - POST /monetization/payments/maib/initiate
 * - POST /monetization/payments/mpay/initiate
 * - GET /monetization/payments/:transactionId/status
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiForbiddenResponse,
  ApiBody,
} from '@nestjs/swagger';
// Request type - using any to avoid express dependency issue
type Request = any;

import { AuthGuard } from '../../auth/auth.guard.js';
import { VerificationGuard } from '../../core/verification.guard.js';
import { Public, CurrentUserId, MinVerificationLevel } from '../../core/decorators.js';

import { SubscriptionService } from './services/subscription.service.js';
import { PromotionService } from './services/promotion.service.js';
import { MoldovaPaymentsService } from './services/moldova-payments.service.js';
import {
  CreateSubscriptionDto,
  ChangePlanDto,
  CancelSubscriptionDto,
  CreatePromotionDto,
  GetTransactionsQueryDto,
  GetMyPromotionsQueryDto,
  SubscriptionPlanResponseDto,
  PromotionPlanResponseDto,
  MonetizationStatusResponseDto,
  TransactionResponseDto,
} from './dto/monetization.dto.js';
import { Transaction } from '../../db/entities/transaction.entity.js';
import { Op } from 'sequelize';

@ApiTags('monetization')
@Controller('monetization')
export class MonetizationController {
  private readonly logger = new Logger(MonetizationController.name);

  /**
   * Feature-flag de monetizare.
   * Setează MONETIZATION_ENABLED=true în .env pentru a activa la v2.
   * Implicit false — toate endpoint-urile de plată/abonament returnează 503.
   */
  private readonly monetizationEnabled: boolean =
    (process.env.MONETIZATION_ENABLED ?? 'false').toLowerCase() === 'true';

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly promotionService: PromotionService,
    private readonly moldovaPaymentsService: MoldovaPaymentsService,
  ) {
    if (!this.monetizationEnabled) {
      this.logger.warn(
        'Monetizare DEZACTIVATĂ (MONETIZATION_ENABLED != true). ' +
        'Endpoint-urile de creare abonament/promovare/plăți returnează 503.',
      );
    }
  }

  /**
   * Aruncă ServiceUnavailableException dacă monetizarea este dezactivată.
   * Apelat la începutul tuturor endpoint-urilor de scriere monetizare.
   */
  private requireMonetizationEnabled(): void {
    if (!this.monetizationEnabled) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'SERVICE_UNAVAILABLE',
        message:
          'Monetizarea este temporar dezactivată în această versiune. ' +
          'Funcționalitatea va fi disponibilă în versiunea viitoare.',
        monetizationEnabled: false,
      });
    }
  }

  // ============================================================================
  // SUBSCRIPTION PLANS (Public)
  // ============================================================================

  /**
   * List all available subscription plans
   */
  @Public()
  @Get('plans')
  @ApiOperation({
    summary: 'Get subscription plans',
    description: 'Returns all available subscription plans with pricing and features',
  })
  @ApiResponse({ status: 200, type: [SubscriptionPlanResponseDto] })
  async getSubscriptionPlans(): Promise<SubscriptionPlanResponseDto[]> {
    return this.subscriptionService.getSubscriptionPlans();
  }

  // ============================================================================
  // PROMOTION PLANS (Public)
  // ============================================================================

  /**
   * List all available promotion options
   */
  @Public()
  @Get('promotions/options')
  @ApiOperation({
    summary: 'Get promotion options',
    description: 'Returns all available listing promotion options (boost, highlight, etc.)',
  })
  @ApiResponse({ status: 200, type: [PromotionPlanResponseDto] })
  async getPromotionPlans(): Promise<PromotionPlanResponseDto[]> {
    return this.promotionService.getPromotionPlans();
  }

  // ============================================================================
  // USER SUBSCRIPTION
  // ============================================================================

  /**
   * Get current user's subscription
   */
  @UseGuards(AuthGuard)
  @Get('subscription')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my subscription',
    description: 'Returns current user subscription details or null if on free plan',
  })
  @ApiResponse({ status: 200, description: 'Subscription details or null' })
  async getMySubscription(@CurrentUserId() userId: number) {
    const subscription = await this.subscriptionService.getUserSubscription(userId);
    if (!subscription) {
      return {
        subscription: null,
        message: 'You are on the free plan',
      };
    }

    // Reload with plan
    const { Listing } = await import('../../db/entities/listing.entity.js');
    const activeListingsCount = await Listing.count({
      where: {
        ownerId: userId,
        status: { [Op.in]: ['public', 'early_access', 'new'] },
      },
    });

    const plan = (subscription as any).plan;
    const remainingListings = Math.max(0, (plan?.maxActiveListings || 1) - activeListingsCount);
    const remainingBoosts = await this.promotionService.getRemainingFreeBoosts(userId);

    return {
      subscription: {
        id: subscription.id,
        plan: {
          code: plan?.code,
          name: plan?.name,
          ...plan?.dataValues,
        },
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        autoRenew: subscription.autoRenew,
        remainingListings,
        remainingBoosts,
      },
    };
  }

  /**
   * Create a new subscription
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(1)
  @Post('subscription')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Subscribe to a plan',
    description: 'Create a new subscription. Trial available for eligible plans.',
  })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  @ApiResponse({ status: 400, description: 'Already subscribed or invalid plan' })
  async createSubscription(
    @CurrentUserId() userId: number,
    @Body() dto: CreateSubscriptionDto,
  ) {
    this.requireMonetizationEnabled();
    const subscription = await this.subscriptionService.createSubscription(userId, dto);
    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
      },
      // TODO: Return payment intent if not trial and not simulated
      message: subscription.status === 'trialing'
        ? 'Trial started successfully'
        : subscription.status === 'active'
          ? 'Subscription activated successfully'
          : 'Please complete payment to activate subscription',
    };
  }

  /**
   * Change subscription plan
   */
  @UseGuards(AuthGuard)
  @Patch('subscription/change-plan')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change subscription plan',
    description: 'Upgrade or downgrade to a different plan',
  })
  @ApiResponse({ status: 200, description: 'Plan changed' })
  @ApiResponse({ status: 404, description: 'No active subscription' })
  async changePlan(
    @CurrentUserId() userId: number,
    @Body() dto: ChangePlanDto,
  ) {
    this.requireMonetizationEnabled();
    const subscription = await this.subscriptionService.changePlan(userId, dto);
    return {
      success: true,
      subscription: {
        id: subscription.id,
        planCode: (subscription as any).plan?.code,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      message: 'Plan changed successfully',
    };
  }

  /**
   * Cancel subscription
   */
  @UseGuards(AuthGuard)
  @Delete('subscription')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Cancel current subscription. Can cancel immediately or at period end.',
  })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  async cancelSubscription(
    @CurrentUserId() userId: number,
    @Body() dto: CancelSubscriptionDto,
  ) {
    this.requireMonetizationEnabled();
    await this.subscriptionService.cancelSubscription(userId, dto);
    return {
      success: true,
      message: dto.cancelImmediately
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at end of billing period',
    };
  }

  // ============================================================================
  // LISTING PROMOTIONS
  // ============================================================================

  /**
   * Promote a listing
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(3) // Must be verified property owner
  @Post('listings/:id/promote')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Promote a listing',
    description: 'Create a promotion for your listing. Only listing owner can promote.',
  })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 201, description: 'Promotion created' })
  @ApiResponse({ status: 400, description: 'Already has active promotion' })
  @ApiForbiddenResponse({ description: 'Not listing owner' })
  async createPromotion(
    @CurrentUserId() userId: number,
    @Param('id') listingId: string,
    @Body() dto: CreatePromotionDto,
  ) {
    this.requireMonetizationEnabled();
    const promotion = await this.promotionService.createPromotion(
      userId,
      parseInt(listingId, 10),
      dto,
    );

    return {
      success: true,
      promotion: {
        id: promotion.id,
        listingId: promotion.listingId,
        status: promotion.status,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isFreeBoost: promotion.isFreeBoost,
      },
      message: promotion.status === 'active'
        ? 'Promotion activated successfully'
        : 'Please complete payment to activate promotion',
    };
  }

  /**
   * Get my promotions
   */
  @UseGuards(AuthGuard)
  @Get('my-promotions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my promotions',
    description: 'Returns all promotions for current user with optional filters',
  })
  @ApiResponse({ status: 200, description: 'List of promotions' })
  async getMyPromotions(
    @CurrentUserId() userId: number,
    @Query() query: GetMyPromotionsQueryDto,
  ) {
    const { items, total } = await this.promotionService.getUserPromotions(userId, {
      status: query.status as any,
      listingId: query.listingId,
      page: query.page,
      limit: query.limit,
    });

    return {
      items,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
      },
    };
  }

  /**
   * Get promotion for specific listing
   */
  @UseGuards(AuthGuard)
  @Get('listings/:id/promotion')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get listing promotion status',
    description: 'Check if listing has active promotion',
  })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Promotion status' })
  async getListingPromotion(@Param('id') listingId: string) {
    const promotion = await this.promotionService.getActivePromotionForListing(
      parseInt(listingId, 10),
    );

    if (!promotion) {
      return {
        hasActivePromotion: false,
        promotion: null,
      };
    }

    return {
      hasActivePromotion: true,
      promotion: {
        id: promotion.id,
        type: promotion.promotionPlan?.code,
        status: promotion.status,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        remainingDays: promotion.getRemainingDays(),
        showBadge: promotion.showBadge,
      },
    };
  }

  /**
   * Cancel a promotion
   */
  @UseGuards(AuthGuard)
  @Delete('promotions/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel promotion',
    description: 'Cancel an active or pending promotion',
  })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({ status: 200, description: 'Promotion cancelled' })
  async cancelPromotion(
    @CurrentUserId() userId: number,
    @Param('id') promotionId: string,
  ) {
    await this.promotionService.cancelPromotion(userId, parseInt(promotionId, 10));
    return {
      success: true,
      message: 'Promotion cancelled',
    };
  }

  // ============================================================================
  // MONETIZATION STATUS
  // ============================================================================

  /**
   * Get full monetization status
   */
  @UseGuards(AuthGuard)
  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get monetization status',
    description: 'Returns complete monetization status including subscription, capabilities, and promotions',
  })
  @ApiResponse({ status: 200, type: MonetizationStatusResponseDto })
  async getMonetizationStatus(
    @CurrentUserId() userId: number,
  ): Promise<MonetizationStatusResponseDto> {
    return this.subscriptionService.getMonetizationStatus(userId);
  }

  /**
   * Check if user can create more listings
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(3)
  @Get('can-create-listing')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check listing creation limit',
    description: 'Check if user can create more listings based on their plan',
  })
  async canCreateListing(@CurrentUserId() userId: number) {
    const result = await this.subscriptionService.canCreateListing(userId);
    return {
      canCreate: result.allowed,
      message: result.reason,
      upgradeRequired: !result.allowed,
    };
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  /**
   * Get my transactions
   */
  @UseGuards(AuthGuard)
  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my transactions',
    description: 'Returns transaction history with optional filters',
  })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async getMyTransactions(
    @CurrentUserId() userId: number,
    @Query() query: GetTransactionsQueryDto,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = { userId };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    const { rows, count } = await Transaction.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      items: rows.map((t) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: Number(t.amount),
        currency: t.currency,
        paymentMethod: t.paymentMethod,
        description: t.description,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
        receiptUrl: t.receiptUrl,
      })),
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // ============================================================================
  // WEBHOOKS (Payment Providers)
  // ============================================================================

  /**
   * Stripe webhook
   * TODO: Implement when integrating Stripe
   */
  @Public()
  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe webhook',
    description: 'Receives payment events from Stripe',
  })
  async handleStripeWebhook(@Req() req: Request) {
    // TODO: Implement Stripe webhook handling
    // 1. Verify webhook signature
    // 2. Handle events:
    //    - invoice.paid → activate/renew subscription
    //    - customer.subscription.deleted → cancel subscription
    //    - payment_intent.succeeded → activate promotion
    this.logger.log('Received Stripe webhook (not implemented yet)');
    return { received: true };
  }

  /**
   * Apple App Store webhook
   * TODO: Implement when integrating Apple IAP
   */
  @Public()
  @Post('webhooks/apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apple webhook',
    description: 'Receives subscription events from App Store',
  })
  async handleAppleWebhook(@Body() body: any) {
    // TODO: Implement Apple Server Notifications v2
    this.logger.log('Received Apple webhook (not implemented yet)');
    return { received: true };
  }

  /**
   * Google Play webhook
   * TODO: Implement when integrating Google Play Billing
   */
  @Public()
  @Post('webhooks/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google webhook',
    description: 'Receives subscription events from Google Play',
  })
  async handleGoogleWebhook(@Body() body: any) {
    // TODO: Implement Google Play RTDN (Real-Time Developer Notifications)
    this.logger.log('Received Google webhook (not implemented yet)');
    return { received: true };
  }

  // ============================================================================
  // MOLDOVA PAYMENT PROVIDERS WEBHOOKS
  // ============================================================================

  /**
   * PAYNET Moldova webhook
   *
   * PAYNET este cel mai popular procesator de plăți din Moldova.
   * Documentație: https://paynet.md/developers
   *
   * Events:
   * - PAYMENT_CONFIRMED - plată confirmată
   * - PAYMENT_FAILED - plată eșuată
   * - SUBSCRIPTION_RENEWED - abonament reînnoit
   * - SUBSCRIPTION_CANCELLED - abonament anulat
   */
  @Public()
  @Post('webhooks/paynet')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'PAYNET Moldova webhook',
    description: 'Receives payment events from PAYNET Moldova',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        event: { type: 'string', example: 'PAYMENT_CONFIRMED' },
        transactionId: { type: 'string' },
        externalId: { type: 'string', description: 'Our internal reference' },
        amount: { type: 'number' },
        currency: { type: 'string', example: 'MDL' },
        status: { type: 'string' },
        signature: { type: 'string', description: 'HMAC signature for verification' },
      },
    },
  })
  async handlePaynetWebhook(
    @Body() body: any,
    @Req() req: Request,
  ) {
    this.logger.log(`Received PAYNET webhook: ${body.event}`);

    try {
      const { event, transactionId, externalId } = body;
      const signature = this.resolveWebhookToken(
        body?.signature,
        req,
        ['x-paynet-signature', 'x-signature'],
      );

      if (signature) {
        const payloadWithoutSignature = { ...body };
        delete payloadWithoutSignature.signature;

        const isValid =
          this.moldovaPaymentsService.verifyPaynetWebhook(body, signature) ||
          this.moldovaPaymentsService.verifyPaynetWebhook(payloadWithoutSignature, signature);

        if (!isValid) {
          this.logger.warn('Invalid PAYNET signature');
          return { received: false, error: 'Invalid signature' };
        }
      }

      const internalTransactionId = await this.resolveTransactionId(
        externalId ?? body.order_id ?? transactionId,
      );

      switch (event) {
        case 'PAYMENT_CONFIRMED':
          this.logger.log(`PAYNET payment confirmed: ${transactionId}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processSuccessfulPayment(
              internalTransactionId,
              String(transactionId || externalId || internalTransactionId),
              'paynet',
            );
          } else {
            this.logger.warn(`PAYNET PAYMENT_CONFIRMED without resolvable transaction: ${externalId || transactionId}`);
          }
          break;

        case 'PAYMENT_FAILED':
          this.logger.warn(`PAYNET payment failed: ${transactionId}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processFailedPayment(
              internalTransactionId,
              `PAYNET payment failed (${body.status || 'unknown'})`,
            );
          }
          break;

        case 'PAYMENT_CANCELLED':
          this.logger.log(`PAYNET payment cancelled: ${transactionId}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processFailedPayment(
              internalTransactionId,
              'PAYNET payment cancelled',
            );
          }
          break;

        case 'SUBSCRIPTION_RENEWED':
          this.logger.log(`PAYNET subscription renewed: ${transactionId}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processSuccessfulPayment(
              internalTransactionId,
              String(transactionId || externalId || internalTransactionId),
              'paynet',
            );
          }
          break;

        case 'SUBSCRIPTION_CANCELLED':
          this.logger.log(`PAYNET subscription cancelled: ${transactionId}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processFailedPayment(
              internalTransactionId,
              'PAYNET subscription cancelled',
            );
          }
          break;

        default:
          this.logger.log(`Unknown PAYNET event: ${event}`);
      }

      return { received: true };
    } catch (error: any) {
      this.logger.error(`PAYNET webhook error: ${error.message}`);
      return { received: true, error: error.message };
    }
  }

  /**
   * MAIB E-Commerce webhook
   *
   * MAIB (Moldova Agroindbank) - cea mai mare bancă din Moldova.
   * Suportă plăți 3D Secure și card tokenization.
   * Documentație: https://maib.md/e-commerce
   *
   * Events:
   * - transaction.success - tranzacție reușită
   * - transaction.failed - tranzacție eșuată
   * - recurring.success - plată recurentă reușită
   * - recurring.failed - plată recurentă eșuată
   */
  @Public()
  @Post('webhooks/maib')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'MAIB E-Commerce webhook',
    description: 'Receives payment events from MAIB E-Commerce',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        event_type: { type: 'string', example: 'transaction.success' },
        transaction_id: { type: 'string' },
        merchant_order_id: { type: 'string', description: 'Our internal order ID' },
        amount: { type: 'number' },
        currency: { type: 'string', example: 'MDL' },
        card_token: { type: 'string', description: 'Tokenized card for recurring' },
        timestamp: { type: 'string' },
        signature: { type: 'string' },
      },
    },
  })
  async handleMaibWebhook(
    @Body() body: any,
    @Req() req: Request,
  ) {
    this.logger.log(`Received MAIB webhook: ${body.event_type}`);

    try {
      const { event_type, transaction_id, merchant_order_id } = body;
      const signature = this.resolveWebhookToken(
        body?.signature,
        req,
        ['x-maib-signature', 'x-signature'],
      );

      if (signature && !this.moldovaPaymentsService.verifyMaibWebhook(body, signature)) {
        this.logger.warn('Invalid MAIB signature');
        return { received: false, error: 'Invalid signature' };
      }

      const internalTransactionId = await this.resolveTransactionId(
        merchant_order_id ?? body.order_id ?? transaction_id,
      );

      switch (event_type) {
        case 'transaction.success':
          this.logger.log(`MAIB transaction success: ${transaction_id}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processSuccessfulPayment(
              internalTransactionId,
              String(transaction_id || merchant_order_id || internalTransactionId),
              'maib',
            );
          } else {
            this.logger.warn(`MAIB success without resolvable transaction: ${merchant_order_id || transaction_id}`);
          }
          break;

        case 'transaction.failed':
          this.logger.warn(`MAIB transaction failed: ${transaction_id}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processFailedPayment(
              internalTransactionId,
              'MAIB transaction failed',
            );
          }
          break;

        case 'transaction.cancelled':
          this.logger.log(`MAIB transaction cancelled: ${transaction_id}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processFailedPayment(
              internalTransactionId,
              'MAIB transaction cancelled',
            );
          }
          break;

        case 'recurring.success':
          this.logger.log(`MAIB recurring payment success: ${transaction_id}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processSuccessfulPayment(
              internalTransactionId,
              String(transaction_id || merchant_order_id || internalTransactionId),
              'maib',
            );
          }
          break;

        case 'recurring.failed':
          this.logger.warn(`MAIB recurring payment failed: ${transaction_id}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processFailedPayment(
              internalTransactionId,
              'MAIB recurring payment failed',
            );
          }
          break;

        default:
          this.logger.log(`Unknown MAIB event: ${event_type}`);
      }

      return { received: true };
    } catch (error: any) {
      this.logger.error(`MAIB webhook error: ${error.message}`);
      return { received: true, error: error.message };
    }
  }

  /**
   * MPAY Moldova webhook
   *
   * MPAY - serviciu de plăți mobile din Moldova.
   * Permite plăți prin SMS, aplicație mobilă, și cod QR.
   * Documentație: https://mpay.md/developers
   */
  @Public()
  @Post('webhooks/mpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'MPAY Moldova webhook',
    description: 'Receives payment events from MPAY Moldova',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', example: 'payment_completed' },
        payment_id: { type: 'string' },
        order_id: { type: 'string', description: 'Our internal order ID' },
        amount: { type: 'number' },
        currency: { type: 'string', example: 'MDL' },
        phone: { type: 'string', description: 'User phone number' },
        hash: { type: 'string', description: 'Verification hash' },
      },
    },
  })
  async handleMpayWebhook(
    @Body() body: any,
    @Req() req: Request,
  ) {
    this.logger.log(`Received MPAY webhook: ${body.action}`);

    try {
      const { action, payment_id, order_id } = body;
      const hash = this.resolveWebhookToken(
        body?.hash,
        req,
        ['x-mpay-hash', 'x-hash', 'x-signature'],
      );

      if (hash && !this.moldovaPaymentsService.verifyMpayHash(body, hash)) {
        this.logger.warn('Invalid MPAY hash');
        return { received: false, error: 'Invalid hash' };
      }

      const internalTransactionId = await this.resolveTransactionId(order_id ?? payment_id);

      switch (action) {
        case 'payment_completed':
          this.logger.log(`MPAY payment completed: ${payment_id}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processSuccessfulPayment(
              internalTransactionId,
              String(payment_id || order_id || internalTransactionId),
              'mpay',
            );
          } else {
            this.logger.warn(`MPAY completed without resolvable transaction: ${order_id || payment_id}`);
          }
          break;

        case 'payment_failed':
          this.logger.warn(`MPAY payment failed: ${payment_id}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processFailedPayment(
              internalTransactionId,
              'MPAY payment failed',
            );
          }
          break;

        case 'payment_cancelled':
          this.logger.log(`MPAY payment cancelled: ${payment_id}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processFailedPayment(
              internalTransactionId,
              'MPAY payment cancelled',
            );
          }
          break;

        case 'payment_expired':
          this.logger.log(`MPAY payment expired: ${payment_id}`);
          if (internalTransactionId) {
            await this.moldovaPaymentsService.processFailedPayment(
              internalTransactionId,
              'MPAY payment expired',
            );
          }
          break;

        default:
          this.logger.log(`Unknown MPAY action: ${action}`);
      }

      return { received: true };
    } catch (error: any) {
      this.logger.error(`MPAY webhook error: ${error.message}`);
      return { received: true, error: error.message };
    }
  }

  // ============================================================================
  // PAYMENT INITIATION ENDPOINTS (Moldova)
  // ============================================================================

  /**
   * Inițiază plată PAYNET
   * Returnează URL pentru redirect către pagina de plată PAYNET
   */
  @UseGuards(AuthGuard)
  @Post('payments/paynet/initiate')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate PAYNET payment',
    description: 'Creates a PAYNET payment and returns redirect URL',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'itemId'],
      properties: {
        type: { type: 'string', enum: ['subscription', 'promotion'], example: 'subscription' },
        itemId: { type: 'number', description: 'Plan ID or Promotion Plan ID' },
        billingCycle: { type: 'string', enum: ['monthly', 'yearly'], example: 'monthly' },
        listingId: { type: 'number', description: 'Required for promotions' },
      },
    },
  })
  async initiatePaynetPayment(
    @CurrentUserId() userId: number,
    @Body() body: { type: 'subscription' | 'promotion'; itemId: number; billingCycle?: string; listingId?: number },
  ) {
    this.requireMonetizationEnabled();
    this.logger.log(`Initiating PAYNET payment for user ${userId}`);

    if (body.type === 'promotion' && !body.listingId) {
      throw new BadRequestException('listingId is required for promotion payments');
    }

    const billingCycle = this.parseBillingCycle(body.billingCycle);

    const result = await this.moldovaPaymentsService.initiatePaynetPayment(
      userId,
      body.type,
      body.itemId,
      {
        billingCycle,
        listingId: body.listingId,
      },
    );

    return {
      ...result,
      message: result.success
        ? 'Redirect user to paymentUrl to complete payment'
        : result.error || 'Failed to initiate PAYNET payment',
    };
  }

  /**
   * Inițiază plată MAIB
   * Returnează URL pentru redirect către 3D Secure
   */
  @UseGuards(AuthGuard)
  @Post('payments/maib/initiate')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate MAIB payment',
    description: 'Creates a MAIB E-Commerce payment and returns redirect URL',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'itemId'],
      properties: {
        type: { type: 'string', enum: ['subscription', 'promotion'], example: 'subscription' },
        itemId: { type: 'number', description: 'Plan ID or Promotion Plan ID' },
        billingCycle: { type: 'string', enum: ['monthly', 'yearly'], example: 'monthly' },
        listingId: { type: 'number', description: 'Required for promotions' },
        saveCard: { type: 'boolean', description: 'Save card for future payments' },
      },
    },
  })
  async initiateMaibPayment(
    @CurrentUserId() userId: number,
    @Body() body: { type: 'subscription' | 'promotion'; itemId: number; billingCycle?: string; listingId?: number; saveCard?: boolean },
  ) {
    this.requireMonetizationEnabled();
    this.logger.log(`Initiating MAIB payment for user ${userId}`);

    if (body.type === 'promotion' && !body.listingId) {
      throw new BadRequestException('listingId is required for promotion payments');
    }

    const billingCycle = this.parseBillingCycle(body.billingCycle);

    const result = await this.moldovaPaymentsService.initiateMaibPayment(
      userId,
      body.type,
      body.itemId,
      {
        billingCycle,
        listingId: body.listingId,
        saveCard: body.saveCard,
      },
    );

    return {
      ...result,
      message: result.success
        ? 'Redirect user to paymentUrl for 3D Secure verification'
        : result.error || 'Failed to initiate MAIB payment',
    };
  }

  /**
   * Inițiază plată MPAY
   * Returnează deep link pentru aplicația MPAY sau cod QR
   */
  @UseGuards(AuthGuard)
  @Post('payments/mpay/initiate')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate MPAY payment',
    description: 'Creates an MPAY mobile payment',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'itemId'],
      properties: {
        type: { type: 'string', enum: ['subscription', 'promotion'], example: 'subscription' },
        itemId: { type: 'number', description: 'Plan ID or Promotion Plan ID' },
        billingCycle: { type: 'string', enum: ['monthly', 'yearly'], example: 'monthly' },
        listingId: { type: 'number', description: 'Required for promotions' },
        phone: { type: 'string', description: 'User phone for SMS payment' },
      },
    },
  })
  async initiateMpayPayment(
    @CurrentUserId() userId: number,
    @Body() body: { type: 'subscription' | 'promotion'; itemId: number; billingCycle?: string; listingId?: number; phone?: string },
  ) {
    this.requireMonetizationEnabled();
    this.logger.log(`Initiating MPAY payment for user ${userId}`);

    if (body.type === 'promotion' && !body.listingId) {
      throw new BadRequestException('listingId is required for promotion payments');
    }

    const billingCycle = this.parseBillingCycle(body.billingCycle);

    const result = await this.moldovaPaymentsService.initiateMpayPayment(
      userId,
      body.type,
      body.itemId,
      {
        billingCycle,
        listingId: body.listingId,
        phone: body.phone,
      },
    );

    return {
      ...result,
      mpayDeepLink: result.deepLink,
      message: result.success
        ? 'Open MPAY app or scan QR code to complete payment'
        : result.error || 'Failed to initiate MPAY payment',
    };
  }

  /**
   * Verifică statusul plății
   * Util pentru polling din mobile app
   */
  @UseGuards(AuthGuard)
  @Get('payments/:transactionId/status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check payment status',
    description: 'Check the status of a pending payment',
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  async checkPaymentStatus(
    @CurrentUserId() userId: number,
    @Param('transactionId') transactionId: string,
  ) {
    const transaction = await Transaction.findOne({
      where: {
        id: parseInt(transactionId, 10),
        userId,
      },
    });

    if (!transaction) {
      return {
        found: false,
        status: 'not_found',
      };
    }

    return {
      found: true,
      transactionId: transaction.id,
      status: transaction.status,
      type: transaction.type,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      completedAt: transaction.completedAt,
      failureReason: transaction.failureMessage,
    };
  }

  private parseBillingCycle(value?: string): 'monthly' | 'yearly' | undefined {
    if (!value) return undefined;
    if (value === 'monthly' || value === 'yearly') return value;
    throw new BadRequestException('billingCycle must be monthly or yearly');
  }

  private async resolveTransactionId(reference: unknown): Promise<number | null> {
    const numericId = this.parseNumericId(reference);
    if (numericId) {
      return numericId;
    }

    if (typeof reference !== 'string' || !reference.trim()) {
      return null;
    }

    const normalizedReference = reference.trim();
    const transaction = await Transaction.findOne({
      where: {
        [Op.or]: [
          { externalTransactionId: normalizedReference },
          { paynetTransactionId: normalizedReference },
          { maibTransactionId: normalizedReference },
          { mpayTransactionId: normalizedReference },
        ],
      },
      order: [['createdAt', 'DESC']],
    });

    return transaction ? Number(transaction.id) : null;
  }

  private parseNumericId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value);
    }

    if (typeof value !== 'string' || !value.trim()) {
      return null;
    }

    const normalizedValue = value.trim();
    if (!/^\d+$/.test(normalizedValue)) {
      return null;
    }

    const parsed = Number.parseInt(normalizedValue, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private resolveWebhookToken(
    explicitToken: unknown,
    req: Request,
    headerNames: string[],
  ): string | undefined {
    if (typeof explicitToken === 'string' && explicitToken.trim()) {
      return explicitToken.trim();
    }

    for (const headerName of headerNames) {
      const headerValue = this.readHeaderValue(req, headerName);
      if (headerValue) {
        return headerValue;
      }
    }

    return undefined;
  }

  private readHeaderValue(req: Request, headerName: string): string | undefined {
    const headers = req?.headers as Record<string, unknown> | undefined;
    if (!headers) {
      return undefined;
    }

    const directValue = headers[headerName] ?? headers[headerName.toLowerCase()];
    if (Array.isArray(directValue)) {
      return typeof directValue[0] === 'string' ? directValue[0] : undefined;
    }

    return typeof directValue === 'string' && directValue.trim()
      ? directValue.trim()
      : undefined;
  }
}
