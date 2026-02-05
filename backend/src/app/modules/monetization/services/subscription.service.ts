/**
 * 📦 SUBSCRIPTION SERVICE
 *
 * Gestionează abonamentele utilizatorilor.
 *
 * Responsabilități:
 * - CRUD pentru subscriptions
 * - Upgrade/Downgrade
 * - Trial management
 * - Verificare capabilități bazate pe plan
 *
 * Reguli importante:
 * - Un user = maxim 1 subscription activă
 * - Trial 14 zile fără card
 * - Grace period 7 zile după expirare
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { UserSubscription, SubscriptionStatus, BillingCycle } from '../../../db/entities/user-subscription.entity.js';
import { SubscriptionPlan } from '../../../db/entities/subscription-plan.entity.js';
import { User } from '../../../db/entities/user.entity.js';
import { Transaction } from '../../../db/entities/transaction.entity.js';
import { Listing } from '../../../db/entities/listing.entity.js';
import {
  CreateSubscriptionDto,
  ChangePlanDto,
  CancelSubscriptionDto,
  SubscriptionPlanResponseDto,
  UserSubscriptionResponseDto,
  MonetizationStatusResponseDto,
} from '../dto/monetization.dto.js';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  // Default FREE plan capabilities (for users without subscription)
  private readonly FREE_PLAN_LIMITS = {
    maxActiveListings: 1,
    maxPhotosPerListing: 5,
    freeMonthlyBoosts: 0,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    hasBadge: false,
    hasPrioritySearch: false,
    hasAIFeatures: false,
  };

  // ============================================================================
  // SUBSCRIPTION PLANS
  // ============================================================================

  /**
   * Obține toate planurile de abonament disponibile
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlanResponseDto[]> {
    const plans = await SubscriptionPlan.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC']],
    });

    return plans.map((plan) => this.mapPlanToDto(plan));
  }

  /**
   * Obține un plan după cod
   */
  async getPlanByCode(code: string): Promise<SubscriptionPlan> {
    const plan = await SubscriptionPlan.findOne({
      where: { code, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan '${code}' not found`);
    }

    return plan;
  }

  // ============================================================================
  // USER SUBSCRIPTION
  // ============================================================================

  /**
   * Obține subscription-ul activ al unui utilizator
   */
  async getUserSubscription(userId: number): Promise<UserSubscription | null> {
    return UserSubscription.findOne({
      where: {
        userId,
        status: { [Op.in]: ['active', 'trialing', 'past_due'] },
      },
      include: [{ model: SubscriptionPlan, as: 'plan' }],
    });
  }

  /**
   * Obține statusul complet de monetizare pentru un user
   */
  async getMonetizationStatus(userId: number): Promise<MonetizationStatusResponseDto> {
    const subscription = await this.getUserSubscription(userId);

    // Count active promotions
    const { ListingPromotion } = await import('../../../db/entities/listing-promotion.entity.js');
    const activePromotionsCount = await ListingPromotion.count({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gt]: new Date() },
      },
    });

    // Get transaction summary
    const totalSpentResult = await Transaction.sum('amount', {
      where: {
        userId,
        status: 'completed',
      },
    });
    const lastTransaction = await Transaction.findOne({
      where: { userId, status: 'completed' },
      order: [['completedAt', 'DESC']],
    });

    // Calculate capabilities
    const capabilities = this.getUserCapabilities(subscription);

    // Calculate remaining listings
    const activeListingsCount = await Listing.count({
      where: {
        ownerId: userId,
        status: { [Op.in]: ['public', 'early_access', 'new'] },
      },
    });
    const remainingListings = Math.max(0, capabilities.maxListings - activeListingsCount);

    // Calculate remaining boosts
    let remainingBoosts = 0;
    if (subscription?.plan) {
      const maxBoosts = (subscription.plan as any).freeMonthlyBoosts || 0;
      remainingBoosts = Math.max(0, maxBoosts - (subscription.boostsUsedThisMonth || 0));
    }

    // Count boosts used this month
    const boostsUsedThisMonth = subscription?.boostsUsedThisMonth || 0;

    // Count promotions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const totalPromotionsThisMonth = await ListingPromotion.count({
      where: {
        userId,
        createdAt: { [Op.gte]: startOfMonth },
      },
    });

    return {
      subscription: subscription ? this.mapSubscriptionToDto(subscription, remainingListings, remainingBoosts) : null,
      capabilities: {
        maxActiveListings: capabilities.maxListings,
        maxPhotosPerListing: capabilities.maxPhotos,
        canUseVideoTour: subscription?.plan ? (subscription.plan as any).hasVideoTour || false : false,
        canUsePrioritySearch: subscription?.plan ? (subscription.plan as any).hasPrioritySearch || false : false,
        canUseAdvancedStats: capabilities.hasAdvancedAnalytics,
        canUseAiFeatures: capabilities.canUseAI,
        freeBoostsRemaining: remainingBoosts,
      },
      activePromotionsCount,
      usage: {
        activeListingsCount,
        totalPromotionsThisMonth,
        boostsUsedThisMonth,
      },
      transactionsSummary: {
        totalSpent: totalSpentResult || 0,
        lastTransactionDate: lastTransaction?.completedAt,
      },
    };
  }

  // ============================================================================
  // CREATE SUBSCRIPTION
  // ============================================================================

  /**
   * Creează un nou subscription
   */
  async createSubscription(
    userId: number,
    dto: CreateSubscriptionDto,
  ): Promise<UserSubscription> {
    // Verifică dacă nu are deja un subscription activ
    const existingSubscription = await this.getUserSubscription(userId);
    if (existingSubscription) {
      throw new BadRequestException(
        'You already have an active subscription. Use change-plan to upgrade or downgrade.',
      );
    }

    // Obține planul
    const plan = await this.getPlanByCode(dto.planCode);

    // Nu permite subscripție la FREE (e implicit)
    if (plan.code === 'free') {
      throw new BadRequestException('Cannot subscribe to free plan. It is the default.');
    }

    const now = new Date();
    const billingCycle = dto.billingCycle || 'monthly';

    // Calculate dates
    let periodEnd: Date;
    if (billingCycle === 'yearly') {
      periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    } else {
      periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Check for trial
    const startTrial = dto.startTrial && plan.trialDays > 0;
    let trialEndsAt: Date | undefined;
    let status: SubscriptionStatus = 'pending'; // pending until payment

    if (startTrial) {
      trialEndsAt = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
      status = 'trialing';
      periodEnd = trialEndsAt;
    }

    // Creează subscription
    const subscription = await UserSubscription.create({
      userId,
      planId: plan.id,
      status,
      billingCycle,
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialEndsAt,
      autoRenew: true,
      boostsUsedThisMonth: 0,
      boostsResetAt: now,
      paymentProvider: dto.appleReceipt ? 'apple' : dto.googlePurchaseToken ? 'google' : 'stripe',
    });

    // Creează tranzacția
    const price = billingCycle === 'yearly' && plan.priceYearly
      ? plan.priceYearly
      : plan.priceMonthly;

    await Transaction.create({
      userId,
      type: 'subscription',
      status: startTrial ? 'completed' : 'pending',
      amount: startTrial ? 0 : Number(price),
      currency: plan.currency,
      referenceId: subscription.id,
      referenceType: 'user_subscription',
      description: `${plan.name} - ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`,
      completedAt: startTrial ? now : undefined,
    });

    // Update user hasActiveSubscription
    if (startTrial) {
      await User.update(
        { hasActiveSubscription: true, subscriptionExpiresAt: periodEnd },
        { where: { id: userId } },
      );
    }

    this.logger.log(
      `Created subscription ${subscription.id} for user ${userId}, plan: ${plan.code}, status: ${status}`,
    );

    return subscription;
  }

  // ============================================================================
  // ACTIVATE SUBSCRIPTION (after payment)
  // ============================================================================

  /**
   * Activează un subscription după plată
   */
  async activateSubscription(
    subscriptionId: number,
    paymentDetails: {
      stripeSubscriptionId?: string;
      stripeCustomerId?: string;
      appleOriginalTransactionId?: string;
      googlePurchaseToken?: string;
    },
  ): Promise<UserSubscription> {
    const subscription = await UserSubscription.findByPk(subscriptionId, {
      include: [{ model: SubscriptionPlan, as: 'plan' }],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const now = new Date();

    await subscription.update({
      status: 'active',
      ...paymentDetails,
    });

    // Update user
    await User.update(
      {
        hasActiveSubscription: true,
        subscriptionExpiresAt: subscription.currentPeriodEnd,
      },
      { where: { id: subscription.userId } },
    );

    // Update transaction
    await Transaction.update(
      {
        status: 'completed',
        completedAt: now,
        stripePaymentIntentId: paymentDetails.stripeSubscriptionId,
        appleTransactionId: paymentDetails.appleOriginalTransactionId,
        googleOrderId: paymentDetails.googlePurchaseToken,
      },
      {
        where: {
          referenceId: subscriptionId,
          referenceType: 'user_subscription',
          status: 'pending',
        },
      },
    );

    this.logger.log(`Subscription ${subscriptionId} activated`);

    return subscription;
  }

  // ============================================================================
  // CHANGE PLAN
  // ============================================================================

  /**
   * Schimbă planul (upgrade/downgrade)
   */
  async changePlan(userId: number, dto: ChangePlanDto): Promise<UserSubscription> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    const newPlan = await this.getPlanByCode(dto.newPlanCode);

    if ((subscription.plan as any)?.code === newPlan.code) {
      throw new BadRequestException('You are already on this plan');
    }

    // Simplu pentru acum: actualizează planul imediat
    // Pentru prorate și facturare complexă, ar trebui integrare Stripe
    const now = new Date();
    const billingCycle = dto.billingCycle || subscription.billingCycle;

    // Calculează noua dată de expirare
    let periodEnd: Date;
    if (dto.applyImmediately) {
      if (billingCycle === 'yearly') {
        periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else {
        periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      periodEnd = subscription.currentPeriodEnd;
    }

    await subscription.update({
      planId: newPlan.id,
      billingCycle,
      currentPeriodEnd: periodEnd,
    });

    // Reload with plan
    await subscription.reload({ include: [{ model: SubscriptionPlan, as: 'plan' }] });

    this.logger.log(
      `User ${userId} changed plan to ${newPlan.code}`,
    );

    return subscription;
  }

  // ============================================================================
  // CANCEL SUBSCRIPTION
  // ============================================================================

  /**
   * Anulează un subscription
   */
  async cancelSubscription(userId: number, dto: CancelSubscriptionDto): Promise<void> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    const now = new Date();

    if (dto.cancelImmediately) {
      await subscription.update({
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: dto.reason,
        cancellationFeedback: dto.feedback,
        autoRenew: false,
      });

      await User.update(
        { hasActiveSubscription: false, subscriptionExpiresAt: null },
        { where: { id: userId } },
      );
    } else {
      // Cancel at end of period
      await subscription.update({
        cancelledAt: now,
        cancellationReason: dto.reason,
        cancellationFeedback: dto.feedback,
        autoRenew: false,
      });
    }

    this.logger.log(
      `Subscription ${subscription.id} cancelled by user ${userId}, immediately: ${dto.cancelImmediately}`,
    );
  }

  // ============================================================================
  // EXPIRATION (called by cron)
  // ============================================================================

  /**
   * Procesează subscriptions expirate
   */
  async processExpiredSubscriptions(): Promise<number> {
    const now = new Date();
    const gracePeriodDays = 7;
    const gracePeriodEnd = new Date(now.getTime() - gracePeriodDays * 24 * 60 * 60 * 1000);

    // 1. Move active subscriptions past end date to past_due
    await UserSubscription.update(
      { status: 'past_due', gracePeriodEndsAt: new Date(now.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000) },
      {
        where: {
          status: 'active',
          currentPeriodEnd: { [Op.lt]: now },
        },
      },
    );

    // 2. Expire trialing subscriptions
    await UserSubscription.update(
      { status: 'expired' },
      {
        where: {
          status: 'trialing',
          trialEndsAt: { [Op.lt]: now },
        },
      },
    );

    // 3. Expire past_due subscriptions after grace period
    const [expiredCount] = await UserSubscription.update(
      { status: 'expired' },
      {
        where: {
          status: 'past_due',
          gracePeriodEndsAt: { [Op.lt]: now },
        },
      },
    );

    // 4. Update users who lost subscription
    const expiredSubscriptions = await UserSubscription.findAll({
      where: {
        status: 'expired',
        updatedAt: { [Op.gt]: gracePeriodEnd },
      },
      attributes: ['userId'],
    });

    if (expiredSubscriptions.length > 0) {
      const userIds = expiredSubscriptions.map((s) => s.userId);
      await User.update(
        { hasActiveSubscription: false, subscriptionExpiresAt: null },
        { where: { id: { [Op.in]: userIds } } },
      );
    }

    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} subscriptions`);
    }

    return expiredCount;
  }

  /**
   * Resetează contoarele de boost-uri la începutul lunii
   */
  async resetMonthlyBoostCounters(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [count] = await UserSubscription.update(
      {
        boostsUsedThisMonth: 0,
        boostsResetAt: now,
      },
      {
        where: {
          status: { [Op.in]: ['active', 'trialing'] },
          [Op.or]: [
            { boostsResetAt: null },
            { boostsResetAt: { [Op.lt]: startOfMonth } },
          ],
        },
      },
    );

    if (count > 0) {
      this.logger.log(`Reset boost counters for ${count} subscriptions`);
    }

    return count;
  }

  // ============================================================================
  // CAPABILITIES CHECK
  // ============================================================================

  /**
   * Returnează capabilitățile utilizatorului bazate pe plan
   */
  getUserCapabilities(subscription: UserSubscription | null): {
    canPromote: boolean;
    canUseAI: boolean;
    maxListings: number;
    maxPhotos: number;
    hasAdvancedAnalytics: boolean;
    hasPrioritySupport: boolean;
  } {
    if (!subscription || !subscription.isActiveAndValid()) {
      return {
        canPromote: true, // Anyone can pay for promotion
        canUseAI: this.FREE_PLAN_LIMITS.hasAIFeatures,
        maxListings: this.FREE_PLAN_LIMITS.maxActiveListings,
        maxPhotos: this.FREE_PLAN_LIMITS.maxPhotosPerListing,
        hasAdvancedAnalytics: this.FREE_PLAN_LIMITS.hasAdvancedAnalytics,
        hasPrioritySupport: this.FREE_PLAN_LIMITS.hasPrioritySupport,
      };
    }

    const plan = subscription.plan as SubscriptionPlan;
    return {
      canPromote: true,
      canUseAI: plan.hasAIFeatures,
      maxListings: plan.maxActiveListings,
      maxPhotos: plan.maxPhotosPerListing,
      hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
      hasPrioritySupport: plan.hasPrioritySupport,
    };
  }

  /**
   * Verifică dacă utilizatorul poate crea mai multe anunțuri
   */
  async canCreateListing(userId: number): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await this.getUserSubscription(userId);
    const capabilities = this.getUserCapabilities(subscription);

    const activeListingsCount = await Listing.count({
      where: {
        ownerId: userId,
        status: { [Op.in]: ['public', 'early_access', 'new'] },
      },
    });

    if (activeListingsCount >= capabilities.maxListings) {
      return {
        allowed: false,
        reason: `You have reached the maximum of ${capabilities.maxListings} active listings for your plan. Upgrade to add more.`,
      };
    }

    return { allowed: true };
  }

  // ============================================================================
  // MAPPERS
  // ============================================================================

  private mapPlanToDto(plan: SubscriptionPlan): SubscriptionPlanResponseDto {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) : undefined,
      currency: plan.currency,
      maxActiveListings: plan.maxActiveListings,
      maxPhotosPerListing: plan.maxPhotosPerListing,
      freeMonthlyBoosts: plan.freeMonthlyBoosts,
      hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
      hasPrioritySupport: plan.hasPrioritySupport,
      hasBadge: plan.hasBadge,
      hasPrioritySearch: plan.hasPrioritySearch,
      hasAIFeatures: plan.hasAIFeatures,
      trialDays: plan.trialDays,
      isPopular: plan.isPopular,
      features: plan.features || [],
    };
  }

  private mapSubscriptionToDto(
    subscription: UserSubscription,
    remainingListings: number,
    remainingBoosts: number,
  ): UserSubscriptionResponseDto {
    const plan = subscription.plan as SubscriptionPlan;

    return {
      id: subscription.id,
      plan: this.mapPlanToDto(plan),
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      startedAt: subscription.startedAt,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt,
      autoRenew: subscription.autoRenew,
      boostsUsedThisMonth: subscription.boostsUsedThisMonth,
      remainingBoosts,
      canPromote: true,
      requiresUpgrade: false,
      remainingListings,
    };
  }
}
