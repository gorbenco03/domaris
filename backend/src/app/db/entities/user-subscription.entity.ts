/**
 * 📦 USER SUBSCRIPTION ENTITY
 *
 * Gestionează abonamentele active ale utilizatorilor.
 * Un user poate avea 0 sau 1 abonament activ la un moment dat.
 *
 * Flow:
 * 1. User cumpără abonament → se creează UserSubscription cu status 'active'
 * 2. La expirare → cron job actualizează status la 'expired'
 * 3. Grace period 7 zile → după care downgrade la FREE
 *
 * PAYMENT PROVIDERS (Moldova-compatible):
 * - apple: Apple IAP (funcționează în Moldova!)
 * - google: Google Play Billing (funcționează în Moldova!)
 * - paynet: PAYNET Moldova (cel mai popular)
 * - maib: MAIB E-Commerce
 * - mpay: MPAY Moldova
 * - manual: Plată manuală/transfer bancar
 */

import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { ExtModel } from './extend.model.js';
import { User } from './user.entity.js';
import { SubscriptionPlan } from './subscription-plan.entity.js';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'expired' | 'trialing';
export type BillingCycle = 'monthly' | 'yearly';

/**
 * Provideri de plată suportați pentru abonamente
 *
 * MOLDOVA-COMPATIBLE:
 * - apple: Apple IAP - funcționează în Moldova!
 * - google: Google Play Billing - funcționează în Moldova!
 * - paynet: PAYNET Moldova - cel mai popular procesator local
 * - maib: MAIB E-Commerce - cea mai mare bancă din Moldova
 * - mpay: MPAY Moldova - plăți mobile
 * - manual: Transfer bancar direct
 */
export type PaymentProvider =
  | 'apple'
  | 'google'
  | 'paynet'
  | 'maib'
  | 'mpay'
  | 'manual'
  | 'simulated';

@Table({
  tableName: 'user_subscriptions',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class UserSubscription extends ExtModel {
  // ======================== RELATIONS ========================

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  userId!: number;

  @BelongsTo(() => User)
  user?: User;

  @ForeignKey(() => SubscriptionPlan)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  planId!: number;

  @BelongsTo(() => SubscriptionPlan)
  plan?: SubscriptionPlan;

  // ======================== STATUS ========================

  @ApiProperty({ example: 'active', enum: ['active', 'cancelled', 'past_due', 'expired', 'trialing'] })
  @Column({
    type: DataType.ENUM('active', 'cancelled', 'past_due', 'expired', 'trialing'),
    allowNull: false,
    defaultValue: 'active',
  })
  status!: SubscriptionStatus;

  @ApiProperty({ example: 'monthly', enum: ['monthly', 'yearly'] })
  @Column({
    type: DataType.ENUM('monthly', 'yearly'),
    allowNull: false,
    defaultValue: 'monthly',
  })
  billingCycle!: BillingCycle;

  // ======================== DATES ========================

  @ApiProperty({ description: 'When subscription started' })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  startedAt!: Date;

  @ApiProperty({ description: 'Current billing period start' })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  currentPeriodStart!: Date;

  @ApiProperty({ description: 'Current billing period end' })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  currentPeriodEnd!: Date;

  @ApiProperty({ description: 'When trial ends (if applicable)' })
  @Column(DataType.DATE)
  trialEndsAt?: Date;

  @ApiProperty({ description: 'When subscription was cancelled' })
  @Column(DataType.DATE)
  cancelledAt?: Date;

  @ApiProperty({ description: 'Grace period end after expiration' })
  @Column(DataType.DATE)
  gracePeriodEndsAt?: Date;

  // ======================== AUTO-RENEW ========================

  @ApiProperty({ example: true, description: 'Auto-renew enabled' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  autoRenew!: boolean;

  // ======================== BOOST TRACKING ========================

  @ApiProperty({ example: 2, description: 'Boosts used this month from subscription' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  boostsUsedThisMonth!: number;

  @ApiProperty({ description: 'When boosts counter was last reset' })
  @Column(DataType.DATE)
  boostsResetAt?: Date;

  // ======================== PAYMENT INFO ========================

  @ApiProperty({
    example: 'apple',
    enum: ['apple', 'google', 'paynet', 'maib', 'mpay', 'manual'],
    description: 'Payment provider used for this subscription',
  })
  @Column({
    type: DataType.STRING, // Using STRING for flexibility
    allowNull: true,
  })
  paymentProvider?: PaymentProvider;

  // ======================== APPLE IAP ========================

  /**
   * Apple Original Transaction ID
   * Pentru verificare și gestionare subscription
   */
  @Column(DataType.STRING)
  appleOriginalTransactionId?: string;

  // ======================== GOOGLE PLAY ========================

  /**
   * Google Purchase Token
   * Pentru verificare și gestionare subscription
   */
  @Column(DataType.STRING)
  googlePurchaseToken?: string;

  // ======================== MOLDOVA PROVIDERS ========================

  /**
   * PAYNET Moldova - ID tranzacție recurentă
   */
  @Column(DataType.STRING)
  paynetSubscriptionId?: string;

  /**
   * MAIB E-Commerce - ID tranzacție recurentă
   */
  @Column(DataType.STRING)
  maibSubscriptionId?: string;

  /**
   * MPAY Moldova - ID abonament
   */
  @Column(DataType.STRING)
  mpaySubscriptionId?: string;

  /**
   * Generic external subscription ID (pentru alți provideri)
   */
  @Column(DataType.STRING)
  externalSubscriptionId?: string;

  // ======================== CANCELLATION ========================

  @ApiProperty({ description: 'Reason for cancellation' })
  @Column(DataType.TEXT)
  cancellationReason?: string;

  @ApiProperty({ description: 'Feedback on cancellation' })
  @Column(DataType.TEXT)
  cancellationFeedback?: string;

  // ======================== METADATA ========================

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  metadata?: Record<string, any>;

  // ======================== HELPER METHODS ========================

  /**
   * Verifică dacă abonamentul este activ și valid
   */
  isActiveAndValid(): boolean {
    const now = new Date();
    return (
      (this.status === 'active' || this.status === 'trialing') &&
      this.currentPeriodEnd > now
    );
  }

  /**
   * Verifică dacă utilizatorul este în perioada de trial
   */
  isInTrial(): boolean {
    if (!this.trialEndsAt) return false;
    return this.status === 'trialing' && new Date() < this.trialEndsAt;
  }

  /**
   * Verifică dacă este în grace period
   */
  isInGracePeriod(): boolean {
    if (!this.gracePeriodEndsAt) return false;
    const now = new Date();
    return this.status === 'past_due' && now < this.gracePeriodEndsAt;
  }

  /**
   * Returnează numărul de boosts disponibile
   */
  getRemainingBoosts(maxBoosts: number): number {
    return Math.max(0, maxBoosts - this.boostsUsedThisMonth);
  }
}
