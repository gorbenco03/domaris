/**
 * 💰 MONETIZATION MODULE - Exports
 */

// Module
export { MonetizationModule } from './monetization.module.js';

// Services
export { SubscriptionService } from './services/subscription.service.js';
export { PromotionService } from './services/promotion.service.js';

// Guards
export { SubscriptionGuard, RequireSubscription, RequireFeature } from './guards/subscription.guard.js';

// DTOs
export * from './dto/monetization.dto.js';

// Seed utilities
export { seedAllPlans, seedSubscriptionPlans, seedPromotionPlans } from './seeds/seed-plans.js';
