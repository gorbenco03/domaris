/**
 * 🌱 SEED PLANS - Script pentru popularea planurilor de monetizare
 *
 * Conform documentației 11-MONETIZATION.md
 *
 * NOTĂ MOLDOVA:
 * - Prețurile sunt în MDL (Leu Moldovenesc)
 * - Curs aproximativ: 1 EUR ≈ 19.5 MDL (actualizați după nevoie)
 * - Prețurile sunt rotunjite pentru UX mai bun
 *
 * METODE DE PLATĂ DISPONIBILE ÎN MOLDOVA:
 * - Apple IAP ✅ (funcționează)
 * - Google Play Billing ✅ (funcționează)
 * - PAYNET ✅ (cel mai popular)
 * - MAIB E-Commerce ✅
 * - MPAY ✅
 * - Transfer bancar ✅
 *
 * Usage:
 * npx ts-node src/app/modules/monetization/seeds/seed-plans.ts
 *
 * Sau poate fi apelat la startup-ul aplicației (doar o dată)
 */

import { Logger } from '@nestjs/common';
import { SubscriptionPlan } from '../../../db/entities/subscription-plan.entity.js';
import { PromotionPlan } from '../../../db/entities/promotion-plan.entity.js';

const logger = new Logger('SeedPlans');

/**
 * Configurare valută
 * Schimbați aici pentru a folosi MDL sau EUR
 */
const CURRENCY = 'MDL'; // 'MDL' pentru Moldova, 'EUR' pentru internațional
const EUR_TO_MDL = 19.5; // Curs aproximativ, actualizați după nevoie

/**
 * Helper pentru conversie prețuri
 * Dacă CURRENCY = 'MDL', convertește și rotunjește
 */
function price(eurAmount: number): number {
  if (CURRENCY === 'MDL') {
    // Rotunjim la numere "frumoase" pentru UX
    const mdl = eurAmount * EUR_TO_MDL;
    if (mdl < 50) return Math.round(mdl / 5) * 5; // Rotunjire la 5 MDL
    if (mdl < 200) return Math.round(mdl / 10) * 10; // Rotunjire la 10 MDL
    return Math.round(mdl / 50) * 50; // Rotunjire la 50 MDL
  }
  return eurAmount;
}

/**
 * Datele pentru planurile de abonament
 * Conform 11-MONETIZATION.md
 *
 * PREȚURI MOLDOVA (MDL):
 * - Free: 0 MDL
 * - Standard: ~195 MDL/lună (~155 MDL anual)
 * - Premium: ~390 MDL/lună (~310 MDL anual)
 * - Business: ~975 MDL/lună (~780 MDL anual)
 */
export const SUBSCRIPTION_PLANS_DATA = [
  {
    code: 'free',
    name: 'Gratuit',
    description: 'Planul de bază pentru toți utilizatorii',
    priceMonthly: 0,
    priceYearly: 0,
    currency: CURRENCY,
    maxActiveListings: 1,
    maxPhotosPerListing: 5,
    freeMonthlyBoosts: 0,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    hasBadge: false,
    hasPrioritySearch: false,
    hasAIFeatures: false,
    hasVideoTour: false,
    trialDays: 0,
    displayOrder: 0,
    isActive: true,
    isPopular: false,
    features: [
      '1 anunț activ',
      '5 fotografii',
      'Statistici de bază',
    ],
  },
  {
    code: 'standard',
    name: 'Standard',
    description: 'Pentru proprietari activi care vor mai multă vizibilitate',
    priceMonthly: price(9.99),  // ~195 MDL
    priceYearly: price(7.99),   // ~155 MDL/lună
    currency: CURRENCY,
    maxActiveListings: 5,
    maxPhotosPerListing: 15,
    freeMonthlyBoosts: 1,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasBadge: false,
    hasPrioritySearch: false,
    hasAIFeatures: true,
    hasVideoTour: false,
    trialDays: 14,
    displayOrder: 1,
    isActive: true,
    isPopular: false,
    features: [
      '5 anunțuri active',
      '15 fotografii/anunț',
      'Statistici avansate',
      'Suport prioritar',
      'AI Analysis',
      '1 boost gratuit/lună',
    ],
  },
  {
    code: 'premium',
    name: 'Premium',
    description: 'Cel mai popular plan pentru proprietari profesioniști',
    priceMonthly: price(19.99),  // ~390 MDL
    priceYearly: price(15.99),   // ~310 MDL/lună
    currency: CURRENCY,
    maxActiveListings: 15,
    maxPhotosPerListing: 30,
    freeMonthlyBoosts: 2,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasBadge: true,
    hasPrioritySearch: true,
    hasAIFeatures: true,
    hasVideoTour: true,
    trialDays: 14,
    displayOrder: 2,
    isActive: true,
    isPopular: true,
    features: [
      '15 anunțuri active',
      '30 fotografii/anunț',
      'Video tour',
      'Badge Premium',
      'Prioritate în căutări',
      'AI generare descrieri',
      '2 boosturi gratuite/lună',
    ],
  },
  {
    code: 'business',
    name: 'Business',
    description: 'Pentru agenții și investitori imobiliari',
    priceMonthly: price(49.99),  // ~975 MDL
    priceYearly: price(39.99),   // ~780 MDL/lună
    currency: CURRENCY,
    maxActiveListings: 999, // Practically unlimited
    maxPhotosPerListing: 50,
    freeMonthlyBoosts: 5,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasBadge: true,
    hasPrioritySearch: true,
    hasAIFeatures: true,
    hasVideoTour: true,
    trialDays: 7,
    displayOrder: 3,
    isActive: true,
    isPopular: false,
    features: [
      'Anunțuri nelimitate',
      '50 fotografii/anunț',
      'Toate funcțiile Premium',
      '5 boosturi gratuite/lună',
      'API access',
      'White-label options',
    ],
  },
];

/**
 * Datele pentru planurile de promovare
 * Conform 11-MONETIZATION.md
 *
 * PREȚURI MOLDOVA (MDL):
 * - Boost 24h: ~40 MDL
 * - Boost 7 zile: ~195 MDL
 * - Highlight: ~100 MDL
 * - Homepage: ~585 MDL
 */
export const PROMOTION_PLANS_DATA = [
  {
    code: 'boost_24h',
    name: 'Boost 24h',
    description: 'Top lista în zonă pentru 24 de ore',
    price: price(1.99),  // ~40 MDL
    currency: CURRENCY,
    durationDays: 1,
    searchBoostMultiplier: 1.5,
    showBadge: false,
    showOnHomepage: false,
    isHighlighted: false,
    isActive: true,
    isPopular: false,
    displayOrder: 0,
    gradientStart: '#3B82F6',
    gradientEnd: '#60A5FA',
    iconName: 'zap',
    impactText: '+150% vizualizări',
    benefits: [
      'Top lista în zonă',
      'Vizibilitate maximă',
      'Potrivit pentru teste',
    ],
  },
  {
    code: 'boost_7d',
    name: 'Boost 7 zile',
    description: 'Top lista pentru 7 zile, +50% mai multe vizualizări',
    price: price(9.99),  // ~195 MDL
    currency: CURRENCY,
    durationDays: 7,
    searchBoostMultiplier: 2.0,
    showBadge: false,
    showOnHomepage: false,
    isHighlighted: true,
    isActive: true,
    isPopular: true,
    displayOrder: 1,
    gradientStart: '#8B5CF6',
    gradientEnd: '#A78BFA',
    iconName: 'rocket',
    impactText: '+300% vizualizări',
    benefits: [
      'Top lista 7 zile',
      '+50% mai multe views',
      'Notificări speciale',
    ],
  },
  {
    code: 'highlight',
    name: 'Highlight',
    description: 'Badge "Promovat" pentru 14 zile',
    price: price(4.99),  // ~100 MDL
    currency: CURRENCY,
    durationDays: 14,
    searchBoostMultiplier: 1.3,
    showBadge: true,
    showOnHomepage: false,
    isHighlighted: false,
    isActive: true,
    isPopular: false,
    displayOrder: 2,
    gradientStart: '#F59E0B',
    gradientEnd: '#D97706',
    iconName: 'star',
    impactText: '+200% engagement',
    benefits: [
      'Badge "Promovat"',
      'Evidențiere în listă',
      'Atenție crescută',
    ],
  },
  {
    code: 'homepage',
    name: 'Pagina principală',
    description: 'Afișare pe homepage pentru 7 zile',
    price: price(29.99),  // ~585 MDL
    currency: CURRENCY,
    durationDays: 7,
    searchBoostMultiplier: 3.0,
    showBadge: true,
    showOnHomepage: true,
    isHighlighted: true,
    isActive: true,
    isPopular: false,
    displayOrder: 3,
    gradientStart: '#EF4444',
    gradientEnd: '#F87171',
    iconName: 'home',
    impactText: '+500% vizualizări',
    benefits: [
      'Afișare pe homepage',
      'Vizibilitate maximă',
      'Badge "Promovat"',
      'Prioritate în căutări',
    ],
  },
];

/**
 * Seed subscription plans
 */
export async function seedSubscriptionPlans(): Promise<void> {
  logger.log('🌱 Seeding subscription plans...');

  for (const planData of SUBSCRIPTION_PLANS_DATA) {
    const existing = await SubscriptionPlan.findOne({
      where: { code: planData.code },
    });

    if (existing) {
      // Update existing plan
      await existing.update(planData);
      logger.log(`   Updated subscription plan: ${planData.code}`);
    } else {
      // Create new plan
      await SubscriptionPlan.create(planData as any);
      logger.log(`   Created subscription plan: ${planData.code}`);
    }
  }

  logger.log('✅ Subscription plans seeded successfully');
}

/**
 * Seed promotion plans
 */
export async function seedPromotionPlans(): Promise<void> {
  logger.log('🌱 Seeding promotion plans...');

  for (const planData of PROMOTION_PLANS_DATA) {
    const existing = await PromotionPlan.findOne({
      where: { code: planData.code },
    });

    if (existing) {
      // Update existing plan
      await existing.update(planData);
      logger.log(`   Updated promotion plan: ${planData.code}`);
    } else {
      // Create new plan
      await PromotionPlan.create(planData as any);
      logger.log(`   Created promotion plan: ${planData.code}`);
    }
  }

  logger.log('✅ Promotion plans seeded successfully');
}

/**
 * Seed all monetization plans
 */
export async function seedAllPlans(): Promise<void> {
  await seedSubscriptionPlans();
  await seedPromotionPlans();
}

// If running directly
if (require.main === module) {
  // You would need to initialize Sequelize connection here
  console.log('Run this seed through NestJS bootstrap or migrations');
}
