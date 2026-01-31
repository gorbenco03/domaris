/**
 * 📦 MONETIZATION DTOs
 *
 * DTOs pentru API-ul de monetizare.
 * Conform cerințelor din 11-MONETIZATION.md
 */

import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================================
// SUBSCRIPTION DTOs
// ============================================================================

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'premium', description: 'Plan code to subscribe to' })
  @IsString()
  @IsNotEmpty()
  planCode!: string;

  @ApiProperty({ example: 'monthly', enum: ['monthly', 'yearly'] })
  @IsEnum(['monthly', 'yearly'])
  billingCycle!: 'monthly' | 'yearly';

  @ApiPropertyOptional({ description: 'Payment method token from client' })
  @IsString()
  @IsOptional()
  paymentMethodToken?: string;

  @ApiPropertyOptional({ description: 'Apple receipt for IAP' })
  @IsString()
  @IsOptional()
  appleReceipt?: string;

  @ApiPropertyOptional({ description: 'Google purchase token' })
  @IsString()
  @IsOptional()
  googlePurchaseToken?: string;

  @ApiPropertyOptional({ example: true, description: 'Start with trial if available' })
  @IsBoolean()
  @IsOptional()
  startTrial?: boolean;
}

export class ChangePlanDto {
  @ApiProperty({ example: 'business', description: 'New plan code' })
  @IsString()
  @IsNotEmpty()
  newPlanCode!: string;

  @ApiPropertyOptional({ example: 'yearly', enum: ['monthly', 'yearly'] })
  @IsEnum(['monthly', 'yearly'])
  @IsOptional()
  billingCycle?: 'monthly' | 'yearly';

  @ApiPropertyOptional({ description: 'Apply immediately or at period end' })
  @IsBoolean()
  @IsOptional()
  applyImmediately?: boolean;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ example: 'too_expensive', description: 'Cancellation reason' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional feedback' })
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiPropertyOptional({ description: 'Cancel immediately or at period end' })
  @IsBoolean()
  @IsOptional()
  cancelImmediately?: boolean;
}

// ============================================================================
// PROMOTION DTOs
// ============================================================================

export class CreatePromotionDto {
  @ApiProperty({ example: 'boost_7d', description: 'Promotion plan code' })
  @IsString()
  @IsNotEmpty()
  promotionCode!: string;

  @ApiPropertyOptional({ description: 'Payment method token from client' })
  @IsString()
  @IsOptional()
  paymentMethodToken?: string;

  @ApiPropertyOptional({ description: 'Apple receipt for IAP' })
  @IsString()
  @IsOptional()
  appleReceipt?: string;

  @ApiPropertyOptional({ description: 'Google purchase token' })
  @IsString()
  @IsOptional()
  googlePurchaseToken?: string;

  @ApiPropertyOptional({ example: true, description: 'Use free boost from subscription' })
  @IsBoolean()
  @IsOptional()
  useFreeBoost?: boolean;
}

// ============================================================================
// PAYMENT DTOs
// ============================================================================

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'subscription', enum: ['subscription', 'promotion'] })
  @IsEnum(['subscription', 'promotion'])
  type!: 'subscription' | 'promotion';

  @ApiPropertyOptional({ example: 'premium', description: 'Plan/Promotion code' })
  @IsString()
  @IsOptional()
  planCode?: string;

  @ApiPropertyOptional({ description: 'Listing ID for promotions' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  listingId?: number;

  @ApiPropertyOptional({ example: 'monthly', enum: ['monthly', 'yearly'] })
  @IsEnum(['monthly', 'yearly'])
  @IsOptional()
  billingCycle?: 'monthly' | 'yearly';
}

export class ConfirmPaymentDto {
  @ApiProperty({ description: 'Payment intent ID from Stripe' })
  @IsString()
  @IsNotEmpty()
  paymentIntentId!: string;

  @ApiPropertyOptional({ description: 'Payment method ID if not already attached' })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

// ============================================================================
// WEBHOOK DTOs
// ============================================================================

export class StripeWebhookDto {
  @ApiProperty({ description: 'Stripe event type' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Event data' })
  data!: {
    object: any;
  };
}

export class AppleWebhookDto {
  @ApiProperty({ description: 'Apple notification type' })
  @IsString()
  notificationType!: string;

  @ApiProperty({ description: 'Transaction info' })
  data!: {
    signedTransactionInfo: string;
    signedRenewalInfo?: string;
  };
}

export class GoogleWebhookDto {
  @ApiProperty({ description: 'Message from Pub/Sub' })
  message!: {
    data: string;
    messageId: string;
  };
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class SubscriptionPlanResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'premium' })
  code!: string;

  @ApiProperty({ example: 'Premium' })
  name!: string;

  @ApiProperty({ example: 'Cel mai popular plan' })
  description?: string;

  @ApiProperty({ example: 19.99 })
  priceMonthly!: number;

  @ApiProperty({ example: 15.99 })
  priceYearly?: number;

  @ApiProperty({ example: 'EUR' })
  currency!: string;

  @ApiProperty({ example: 15 })
  maxActiveListings!: number;

  @ApiProperty({ example: 30 })
  maxPhotosPerListing!: number;

  @ApiProperty({ example: 2 })
  freeMonthlyBoosts!: number;

  @ApiProperty({ example: true })
  hasAdvancedAnalytics!: boolean;

  @ApiProperty({ example: true })
  hasPrioritySupport!: boolean;

  @ApiProperty({ example: true })
  hasBadge!: boolean;

  @ApiProperty({ example: true })
  hasPrioritySearch!: boolean;

  @ApiProperty({ example: true })
  hasAIFeatures!: boolean;

  @ApiProperty({ example: 14 })
  trialDays!: number;

  @ApiProperty({ example: true })
  isPopular!: boolean;

  @ApiProperty({ type: [String] })
  features!: string[];
}

export class UserSubscriptionResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty()
  plan!: SubscriptionPlanResponseDto;

  @ApiProperty({ example: 'active' })
  status!: string;

  @ApiProperty({ example: 'monthly' })
  billingCycle!: string;

  @ApiProperty()
  startedAt!: Date;

  @ApiProperty()
  currentPeriodStart!: Date;

  @ApiProperty()
  currentPeriodEnd!: Date;

  @ApiProperty()
  trialEndsAt?: Date;

  @ApiProperty({ example: true })
  autoRenew!: boolean;

  @ApiProperty({ example: 0 })
  boostsUsedThisMonth!: number;

  @ApiProperty({ example: 2 })
  remainingBoosts!: number;

  // Computed capabilities
  @ApiProperty({ example: true })
  canPromote!: boolean;

  @ApiProperty({ example: false })
  requiresUpgrade!: boolean;

  @ApiProperty({ example: 5 })
  remainingListings!: number;
}

export class PromotionPlanResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'boost_7d' })
  code!: string;

  @ApiProperty({ example: 'Boost 7 zile' })
  name!: string;

  @ApiProperty({ example: 'Top lista 7 zile' })
  description?: string;

  @ApiProperty({ example: 9.99 })
  price!: number;

  @ApiProperty({ example: 'EUR' })
  currency!: string;

  @ApiProperty({ example: 7 })
  durationDays!: number;

  @ApiProperty({ example: true })
  showBadge!: boolean;

  @ApiProperty({ example: true })
  isPopular!: boolean;

  @ApiProperty({ example: '+300% views estimate' })
  impactText?: string;

  @ApiProperty({ type: [String] })
  benefits!: string[];

  @ApiProperty({ example: '#FF6B00' })
  gradientStart?: string;

  @ApiProperty({ example: '#FF9500' })
  gradientEnd?: string;

  @ApiProperty({ example: 'rocket' })
  iconName?: string;
}

export class ListingPromotionResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  listingId!: number;

  @ApiProperty()
  promotionPlan!: PromotionPlanResponseDto;

  @ApiProperty({ example: 'active' })
  status!: string;

  @ApiProperty()
  startDate?: Date;

  @ApiProperty()
  endDate?: Date;

  @ApiProperty({ example: 5 })
  remainingDays!: number;

  @ApiProperty({ example: true })
  showBadge!: boolean;

  @ApiProperty({ example: 150 })
  viewsDuringPromotion!: number;
}

export class MonetizationStatusResponseDto {
  @ApiProperty({ description: 'Current subscription or null if free' })
  subscription?: UserSubscriptionResponseDto | null;

  @ApiProperty({ description: 'User capabilities based on plan' })
  capabilities!: {
    canPromote: boolean;
    canUseAI: boolean;
    maxListings: number;
    maxPhotos: number;
    hasAdvancedAnalytics: boolean;
    hasPrioritySupport: boolean;
    remainingBoosts: number;
  };

  @ApiProperty({ description: 'Active promotions count' })
  activePromotionsCount!: number;

  @ApiProperty({ description: 'Transaction history summary' })
  transactionsSummary!: {
    totalSpent: number;
    lastTransactionDate?: Date;
  };
}

export class TransactionResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'subscription' })
  type!: string;

  @ApiProperty({ example: 'completed' })
  status!: string;

  @ApiProperty({ example: 19.99 })
  amount!: number;

  @ApiProperty({ example: 'EUR' })
  currency!: string;

  @ApiProperty({ example: 'card' })
  paymentMethod?: string;

  @ApiProperty({ example: 'Premium Subscription - Monthly' })
  description?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  completedAt?: Date;

  @ApiProperty()
  receiptUrl?: string;
}

// ============================================================================
// QUERY DTOs
// ============================================================================

export class GetTransactionsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Items per page' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'subscription', enum: ['subscription', 'promotion', 'service', 'refund'] })
  @IsEnum(['subscription', 'promotion', 'service', 'refund'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'completed', enum: ['pending', 'completed', 'failed', 'refunded'] })
  @IsEnum(['pending', 'completed', 'failed', 'refunded'])
  @IsOptional()
  status?: string;
}

export class GetMyPromotionsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Items per page' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'active', enum: ['pending', 'active', 'expired', 'cancelled'] })
  @IsEnum(['pending', 'active', 'expired', 'cancelled'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by listing ID' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  listingId?: number;
}
