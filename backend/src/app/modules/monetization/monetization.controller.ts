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
  RawBodyRequest,
  Logger,
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
import { Request } from 'express';

import { AuthGuard } from '../../auth/auth.guard.js';
import { VerificationGuard } from '../../core/verification.guard.js';
import { Public, CurrentUserId, MinVerificationLevel } from '../../core/decorators.js';

import { SubscriptionService } from './services/subscription.service.js';
import { PromotionService } from './services/promotion.service.js';
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

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly promotionService: PromotionService,
  ) {}

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
    const subscription = await this.subscriptionService.createSubscription(userId, dto);
    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
      },
      // TODO: Return payment intent if not trial
      message: subscription.status === 'trialing'
        ? 'Trial started successfully'
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
  async handleStripeWebhook(@Req() req: RawBodyRequest<Request>) {
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

    // TODO: Implement PAYNET webhook handling
    // 1. Verifică semnătura HMAC cu PAYNET_SECRET_KEY
    // 2. Procesează evenimentele:
    //    - PAYMENT_CONFIRMED → activează abonament/promoție
    //    - PAYMENT_FAILED → marchează ca eșuat
    //    - SUBSCRIPTION_RENEWED → reînnoiește abonament
    //    - SUBSCRIPTION_CANCELLED → anulează abonament

    try {
      const { event, transactionId, externalId, amount, status, signature } = body;

      // Verificare semnătură (implementați cu cheia secretă PAYNET)
      // const isValid = this.verifyPaynetSignature(body, signature);
      // if (!isValid) {
      //   this.logger.warn('Invalid PAYNET signature');
      //   return { received: false, error: 'Invalid signature' };
      // }

      switch (event) {
        case 'PAYMENT_CONFIRMED':
          this.logger.log(`PAYNET payment confirmed: ${transactionId}`);
          // await this.processPaynetPayment(externalId, transactionId, amount);
          break;

        case 'PAYMENT_FAILED':
          this.logger.warn(`PAYNET payment failed: ${transactionId}`);
          // await this.handlePaynetFailure(externalId, transactionId);
          break;

        case 'SUBSCRIPTION_RENEWED':
          this.logger.log(`PAYNET subscription renewed: ${transactionId}`);
          // await this.renewPaynetSubscription(externalId);
          break;

        case 'SUBSCRIPTION_CANCELLED':
          this.logger.log(`PAYNET subscription cancelled: ${transactionId}`);
          // await this.cancelPaynetSubscription(externalId);
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

    // TODO: Implement MAIB E-Commerce webhook handling
    // 1. Verifică semnătura cu MAIB_SECRET_KEY
    // 2. Procesează evenimentele

    try {
      const { event_type, transaction_id, merchant_order_id, amount, card_token } = body;

      switch (event_type) {
        case 'transaction.success':
          this.logger.log(`MAIB transaction success: ${transaction_id}`);
          // await this.processMaibPayment(merchant_order_id, transaction_id, amount);
          // Salvează card_token pentru plăți recurente
          break;

        case 'transaction.failed':
          this.logger.warn(`MAIB transaction failed: ${transaction_id}`);
          // await this.handleMaibFailure(merchant_order_id, transaction_id);
          break;

        case 'recurring.success':
          this.logger.log(`MAIB recurring payment success: ${transaction_id}`);
          // await this.processMaibRecurring(merchant_order_id);
          break;

        case 'recurring.failed':
          this.logger.warn(`MAIB recurring payment failed: ${transaction_id}`);
          // await this.handleMaibRecurringFailure(merchant_order_id);
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

    // TODO: Implement MPAY webhook handling

    try {
      const { action, payment_id, order_id, amount, phone, hash } = body;

      // Verificare hash MPAY
      // const isValid = this.verifyMpayHash(body, hash);

      switch (action) {
        case 'payment_completed':
          this.logger.log(`MPAY payment completed: ${payment_id}`);
          // await this.processMpayPayment(order_id, payment_id, amount);
          break;

        case 'payment_failed':
          this.logger.warn(`MPAY payment failed: ${payment_id}`);
          // await this.handleMpayFailure(order_id, payment_id);
          break;

        case 'payment_cancelled':
          this.logger.log(`MPAY payment cancelled: ${payment_id}`);
          // await this.handleMpayCancellation(order_id);
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
    this.logger.log(`Initiating PAYNET payment for user ${userId}`);

    // TODO: Implement PAYNET payment initiation
    // 1. Calculează suma de plată
    // 2. Creează înregistrare Transaction cu status 'pending'
    // 3. Apelează PAYNET API pentru a crea sesiune de plată
    // 4. Returnează URL pentru redirect

    return {
      success: true,
      paymentUrl: 'https://paynet.md/checkout/xxx', // TODO: Real URL from PAYNET
      transactionId: 'pending-xxx',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minute
      message: 'Redirect user to paymentUrl to complete payment',
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
    this.logger.log(`Initiating MAIB payment for user ${userId}`);

    // TODO: Implement MAIB E-Commerce payment initiation

    return {
      success: true,
      paymentUrl: 'https://ecomm.maib.md/xxx', // TODO: Real URL from MAIB
      transactionId: 'pending-xxx',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      message: 'Redirect user to paymentUrl for 3D Secure verification',
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
    this.logger.log(`Initiating MPAY payment for user ${userId}`);

    // TODO: Implement MPAY payment initiation

    return {
      success: true,
      mpayDeepLink: 'mpay://pay/xxx', // Deep link pentru aplicația MPAY
      qrCode: 'data:image/png;base64,...', // QR code pentru scanare
      transactionId: 'pending-xxx',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minute
      message: 'Open MPAY app or scan QR code to complete payment',
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
      failureReason: transaction.failureReason,
    };
  }
}
