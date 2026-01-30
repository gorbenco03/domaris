/**
 * 📦 PROMOTION SERVICE
 *
 * Gestionează promovarea anunțurilor (boost/featured).
 *
 * Responsabilități:
 * - CRUD pentru promoții listing
 * - Validare owner și limite
 * - Activare după plată
 * - Expirare automată
 *
 * Reguli importante:
 * - Doar owner-ul poate promova
 * - Un listing = o singură promoție activă
 * - Promoțiile expiră automat (verificat de cron)
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { ListingPromotion, ListingPromotionStatus } from '../../../db/entities/listing-promotion.entity.js';
import { PromotionPlan } from '../../../db/entities/promotion-plan.entity.js';
import { Listing } from '../../../db/entities/listing.entity.js';
import { UserSubscription } from '../../../db/entities/user-subscription.entity.js';
import { Transaction } from '../../../db/entities/transaction.entity.js';
import { CreatePromotionDto, PromotionPlanResponseDto, ListingPromotionResponseDto } from '../dto/monetization.dto.js';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  // ============================================================================
  // PROMOTION PLANS
  // ============================================================================

  /**
   * Obține toate planurile de promovare disponibile
   */
  async getPromotionPlans(): Promise<PromotionPlanResponseDto[]> {
    const plans = await PromotionPlan.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC']],
    });

    return plans.map((plan) => this.mapPromotionPlanToDto(plan));
  }

  /**
   * Obține un plan de promovare după cod
   */
  async getPromotionPlanByCode(code: string): Promise<PromotionPlan> {
    const plan = await PromotionPlan.findOne({
      where: { code, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException(`Promotion plan '${code}' not found`);
    }

    return plan;
  }

  // ============================================================================
  // CREATE PROMOTION
  // ============================================================================

  /**
   * Creează o promovare pentru un listing
   *
   * Flow:
   * 1. Verifică ownership
   * 2. Verifică dacă nu există deja o promoție activă
   * 3. Verifică dacă poate folosi free boost (din subscription)
   * 4. Creează promovarea cu status 'pending' (sau 'active' pentru free boost)
   */
  async createPromotion(
    userId: number,
    listingId: number,
    dto: CreatePromotionDto,
  ): Promise<ListingPromotion> {
    // 1. Verifică că listing-ul există și aparține userului
    const listing = await Listing.findByPk(listingId);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (String(listing.ownerId) !== String(userId)) {
      throw new ForbiddenException('You are not the owner of this listing');
    }

    // 2. Verifică că nu există deja o promoție activă
    const existingPromotion = await ListingPromotion.findOne({
      where: {
        listingId,
        status: 'active',
        endDate: { [Op.gt]: new Date() },
      },
    });
    if (existingPromotion) {
      throw new BadRequestException(
        'This listing already has an active promotion. Wait for it to expire or cancel it first.',
      );
    }

    // 3. Obține planul de promovare
    const promotionPlan = await this.getPromotionPlanByCode(dto.promotionCode);

    // 4. Verifică free boost din subscription
    let isFreeBoost = false;
    let amountToPay = Number(promotionPlan.price);

    if (dto.useFreeBoost) {
      const canUseFree = await this.canUseFreeBoost(userId, dto.promotionCode);
      if (canUseFree) {
        isFreeBoost = true;
        amountToPay = 0;
      }
    }

    // 5. Creează promovarea
    const now = new Date();
    const endDate = new Date(now.getTime() + promotionPlan.durationDays * 24 * 60 * 60 * 1000);

    const promotion = await ListingPromotion.create({
      userId,
      listingId,
      promotionPlanId: promotionPlan.id,
      status: isFreeBoost ? 'active' : 'pending',
      startDate: isFreeBoost ? now : undefined,
      endDate: isFreeBoost ? endDate : undefined,
      activatedAt: isFreeBoost ? now : undefined,
      searchBoostMultiplier: promotionPlan.searchBoostMultiplier,
      showBadge: promotionPlan.showBadge,
      showOnHomepage: promotionPlan.showOnHomepage,
      isHighlighted: promotionPlan.isHighlighted,
      amountPaid: amountToPay,
      currency: promotionPlan.currency,
      paymentStatus: isFreeBoost ? 'completed' : 'pending',
      isFreeBoost,
    });

    // 6. Dacă e free boost, actualizează contorul din subscription
    if (isFreeBoost) {
      await this.incrementBoostUsage(userId);
      this.logger.log(`Free boost activated for listing ${listingId} by user ${userId}`);
    }

    // 7. Creează tranzacția
    await Transaction.create({
      userId,
      type: 'promotion',
      status: isFreeBoost ? 'completed' : 'pending',
      amount: amountToPay,
      currency: promotionPlan.currency,
      paymentMethod: isFreeBoost ? 'free' : undefined,
      referenceId: promotion.id,
      referenceType: 'listing_promotion',
      description: `${promotionPlan.name} - ${listing.title}`,
      completedAt: isFreeBoost ? now : undefined,
    });

    this.logger.log(
      `Created promotion ${promotion.id} for listing ${listingId}, status: ${promotion.status}`,
    );

    return promotion;
  }

  // ============================================================================
  // ACTIVATE PROMOTION (after payment)
  // ============================================================================

  /**
   * Activează o promovare după confirmarea plății
   */
  async activatePromotion(
    promotionId: number,
    paymentDetails: {
      stripePaymentIntentId?: string;
      appleTransactionId?: string;
      googlePurchaseToken?: string;
    },
  ): Promise<ListingPromotion> {
    const promotion = await ListingPromotion.findByPk(promotionId, {
      include: [{ model: PromotionPlan, as: 'promotionPlan' }],
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion.status !== 'pending') {
      throw new BadRequestException('Promotion is not pending activation');
    }

    const now = new Date();
    const durationDays = promotion.promotionPlan?.durationDays || 7;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await promotion.update({
      status: 'active',
      startDate: now,
      endDate,
      activatedAt: now,
      paymentStatus: 'completed',
      stripePaymentIntentId: paymentDetails.stripePaymentIntentId,
      appleTransactionId: paymentDetails.appleTransactionId,
      googlePurchaseToken: paymentDetails.googlePurchaseToken,
    });

    // Update transaction
    await Transaction.update(
      {
        status: 'completed',
        completedAt: now,
        stripePaymentIntentId: paymentDetails.stripePaymentIntentId,
        appleTransactionId: paymentDetails.appleTransactionId,
        googleOrderId: paymentDetails.googlePurchaseToken,
      },
      {
        where: {
          referenceId: promotionId,
          referenceType: 'listing_promotion',
        },
      },
    );

    this.logger.log(`Promotion ${promotionId} activated until ${endDate}`);

    return promotion;
  }

  // ============================================================================
  // GET USER PROMOTIONS
  // ============================================================================

  /**
   * Obține toate promoțiile unui utilizator
   */
  async getUserPromotions(
    userId: number,
    options: {
      status?: ListingPromotionStatus;
      listingId?: number;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ items: ListingPromotionResponseDto[]; total: number }> {
    const { status, listingId, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;
    if (listingId) where.listingId = listingId;

    const { rows, count } = await ListingPromotion.findAndCountAll({
      where,
      include: [
        { model: PromotionPlan, as: 'promotionPlan' },
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'city', 'neighborhood'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      items: rows.map((p) => this.mapPromotionToDto(p)),
      total: count,
    };
  }

  /**
   * Obține promoția activă pentru un listing (dacă există)
   */
  async getActivePromotionForListing(listingId: number): Promise<ListingPromotion | null> {
    return ListingPromotion.findOne({
      where: {
        listingId,
        status: 'active',
        endDate: { [Op.gt]: new Date() },
      },
      include: [{ model: PromotionPlan, as: 'promotionPlan' }],
    });
  }

  /**
   * Verifică dacă un listing are promoție activă
   */
  async hasActivePromotion(listingId: number): Promise<boolean> {
    const promotion = await this.getActivePromotionForListing(listingId);
    return promotion !== null;
  }

  // ============================================================================
  // CANCEL PROMOTION
  // ============================================================================

  /**
   * Anulează o promovare (doar owner-ul poate)
   */
  async cancelPromotion(userId: number, promotionId: number): Promise<void> {
    const promotion = await ListingPromotion.findByPk(promotionId);

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (String(promotion.userId) !== String(userId)) {
      throw new ForbiddenException('You are not the owner of this promotion');
    }

    if (promotion.status !== 'active' && promotion.status !== 'pending') {
      throw new BadRequestException('Cannot cancel a promotion that is not active or pending');
    }

    await promotion.update({
      status: 'cancelled',
    });

    this.logger.log(`Promotion ${promotionId} cancelled by user ${userId}`);
  }

  // ============================================================================
  // EXPIRATION (called by cron)
  // ============================================================================

  /**
   * Expiră toate promoțiile care au trecut de endDate
   * Apelat de CronService
   */
  async expirePromotions(): Promise<number> {
    const now = new Date();

    const [count] = await ListingPromotion.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          endDate: { [Op.lt]: now },
        },
      },
    );

    if (count > 0) {
      this.logger.log(`Expired ${count} promotions`);
    }

    return count;
  }

  // ============================================================================
  // FREE BOOST LOGIC
  // ============================================================================

  /**
   * Verifică dacă utilizatorul poate folosi free boost din subscription
   */
  async canUseFreeBoost(userId: number, promotionCode: string): Promise<boolean> {
    // Doar boost_24h și boost_7d pot fi free din subscription
    const eligibleForFreeBoost = ['boost_24h', 'boost_7d'].includes(promotionCode);
    if (!eligibleForFreeBoost) {
      return false;
    }

    const subscription = await UserSubscription.findOne({
      where: {
        userId,
        status: { [Op.in]: ['active', 'trialing'] },
        currentPeriodEnd: { [Op.gt]: new Date() },
      },
      include: [{ model: require('../../../db/entities/subscription-plan.entity.js').SubscriptionPlan, as: 'plan' }],
    });

    if (!subscription || !subscription.plan) {
      return false;
    }

    const maxBoosts = (subscription as any).plan.freeMonthlyBoosts || 0;
    const usedBoosts = subscription.boostsUsedThisMonth || 0;

    return usedBoosts < maxBoosts;
  }

  /**
   * Returnează numărul de free boosts disponibile
   */
  async getRemainingFreeBoosts(userId: number): Promise<number> {
    const subscription = await UserSubscription.findOne({
      where: {
        userId,
        status: { [Op.in]: ['active', 'trialing'] },
        currentPeriodEnd: { [Op.gt]: new Date() },
      },
      include: [{ model: require('../../../db/entities/subscription-plan.entity.js').SubscriptionPlan, as: 'plan' }],
    });

    if (!subscription || !subscription.plan) {
      return 0;
    }

    const maxBoosts = (subscription as any).plan.freeMonthlyBoosts || 0;
    const usedBoosts = subscription.boostsUsedThisMonth || 0;

    return Math.max(0, maxBoosts - usedBoosts);
  }

  /**
   * Incrementează contorul de boost-uri folosite
   */
  private async incrementBoostUsage(userId: number): Promise<void> {
    await UserSubscription.increment('boostsUsedThisMonth', {
      by: 1,
      where: {
        userId,
        status: { [Op.in]: ['active', 'trialing'] },
      },
    });
  }

  // ============================================================================
  // GET PROMOTED LISTING IDS (for search service)
  // ============================================================================

  /**
   * Returnează ID-urile listing-urilor cu promoții active
   * Folosit de SearchService pentru sortare
   */
  async getPromotedListingIds(): Promise<{
    listingId: number;
    boostMultiplier: number;
    showBadge: boolean;
    showOnHomepage: boolean;
  }[]> {
    const promotions = await ListingPromotion.findAll({
      where: {
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gt]: new Date() },
      },
      attributes: ['listingId', 'searchBoostMultiplier', 'showBadge', 'showOnHomepage'],
    });

    return promotions.map((p) => ({
      listingId: p.listingId,
      boostMultiplier: Number(p.searchBoostMultiplier),
      showBadge: p.showBadge,
      showOnHomepage: p.showOnHomepage,
    }));
  }

  // ============================================================================
  // ANALYTICS TRACKING
  // ============================================================================

  /**
   * Incrementează view-urile în timpul promoției
   */
  async trackPromotionView(listingId: number): Promise<void> {
    await ListingPromotion.increment('viewsDuringPromotion', {
      by: 1,
      where: {
        listingId,
        status: 'active',
        endDate: { [Op.gt]: new Date() },
      },
    });
  }

  /**
   * Incrementează inquiry-urile în timpul promoției
   */
  async trackPromotionInquiry(listingId: number): Promise<void> {
    await ListingPromotion.increment('inquiriesDuringPromotion', {
      by: 1,
      where: {
        listingId,
        status: 'active',
        endDate: { [Op.gt]: new Date() },
      },
    });
  }

  // ============================================================================
  // MAPPERS
  // ============================================================================

  private mapPromotionPlanToDto(plan: PromotionPlan): PromotionPlanResponseDto {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      price: Number(plan.price),
      currency: plan.currency,
      durationDays: plan.durationDays,
      showBadge: plan.showBadge,
      isPopular: plan.isPopular,
      impactText: plan.impactText,
      benefits: plan.benefits || [],
      gradientStart: plan.gradientStart,
      gradientEnd: plan.gradientEnd,
      iconName: plan.iconName,
    };
  }

  private mapPromotionToDto(promotion: ListingPromotion): ListingPromotionResponseDto {
    return {
      id: promotion.id,
      listingId: promotion.listingId,
      promotionPlan: promotion.promotionPlan
        ? this.mapPromotionPlanToDto(promotion.promotionPlan)
        : (undefined as any),
      status: promotion.status,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      remainingDays: promotion.getRemainingDays(),
      showBadge: promotion.showBadge,
      viewsDuringPromotion: promotion.viewsDuringPromotion,
    };
  }
}
