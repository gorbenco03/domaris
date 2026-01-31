/**
 * 💰 MONETIZATION MODULE
 *
 * Modul pentru gestionarea monetizării platformei.
 *
 * Include:
 * - Subscription management (plans, user subscriptions)
 * - Listing promotions (boost, highlight, homepage)
 * - Transaction history
 * - Payment provider integrations
 *
 * PROVIDERI DE PLATĂ (Moldova-compatible):
 * - Apple IAP ✅ (funcționează în Moldova)
 * - Google Play Billing ✅ (funcționează în Moldova)
 * - PAYNET Moldova ✅ (cel mai popular)
 * - MAIB E-Commerce ✅ (cea mai mare bancă)
 * - MPAY Moldova ✅ (plăți mobile)
 * - Stripe ❌ (NU funcționează în Moldova)
 *
 * Exports:
 * - SubscriptionService - pentru verificări de capabilități în alte module
 * - PromotionService - pentru search service (prioritizare listings promovate)
 * - MoldovaPaymentsService - pentru integrări cu procesatorii locali
 * - SubscriptionGuard - pentru protejarea endpoint-urilor premium
 *
 * On Module Init:
 * - Seeds subscription and promotion plans if they don't exist
 */

import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';

// Entities
import { SubscriptionPlan } from '../../db/entities/subscription-plan.entity.js';
import { UserSubscription } from '../../db/entities/user-subscription.entity.js';
import { PromotionPlan } from '../../db/entities/promotion-plan.entity.js';
import { ListingPromotion } from '../../db/entities/listing-promotion.entity.js';
import { Transaction } from '../../db/entities/transaction.entity.js';

// Services
import { SubscriptionService } from './services/subscription.service.js';
import { PromotionService } from './services/promotion.service.js';
import { MoldovaPaymentsService } from './services/moldova-payments.service.js';

// Controller
import { MonetizationController } from './monetization.controller.js';

// Guards
import { SubscriptionGuard } from './guards/subscription.guard.js';

// Seed utilities
import { seedAllPlans } from './seeds/seed-plans.js';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([
      SubscriptionPlan,
      UserSubscription,
      PromotionPlan,
      ListingPromotion,
      Transaction,
    ]),
  ],
  controllers: [MonetizationController],
  providers: [
    SubscriptionService,
    PromotionService,
    MoldovaPaymentsService,
    SubscriptionGuard,
  ],
  exports: [
    SubscriptionService,
    PromotionService,
    MoldovaPaymentsService,
    SubscriptionGuard,
  ],
})
export class MonetizationModule implements OnModuleInit {
  private readonly logger = new Logger(MonetizationModule.name);

  async onModuleInit() {
    this.logger.log('💰 Initializing Monetization Module...');

    try {
      // Seed plans on startup (will update existing or create new)
      await seedAllPlans();
      this.logger.log('✅ Monetization plans seeded successfully');
    } catch (error: any) {
      this.logger.error(`Failed to seed monetization plans: ${error.message}`);
      // Don't throw - allow app to start even if seeding fails
    }
  }
}
