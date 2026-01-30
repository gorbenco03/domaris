/**
 * 📦 LISTING PROMOTION ENTITY
 *
 * Gestionează promoțiile active pentru anunțuri.
 * Un listing poate avea O SINGURĂ promoție activă la un moment dat.
 *
 * Flow:
 * 1. Owner cumpără promoție → se creează ListingPromotion cu status 'pending'
 * 2. După plată confirmată → status 'active', se setează startDate/endDate
 * 3. La expirare → cron job actualizează status la 'expired'
 * 4. Search service verifică promoții active pentru sortare
 */

import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { ExtModel } from './extend.model.js';
import { User } from './user.entity.js';
import { Listing } from './listing.entity.js';
import { PromotionPlan } from './promotion-plan.entity.js';

export type ListingPromotionStatus = 'pending' | 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

@Table({
  tableName: 'listing_promotions',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class ListingPromotion extends ExtModel {
  // ======================== RELATIONS ========================

  @ForeignKey(() => User)
  @Index
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  userId!: number;

  @BelongsTo(() => User)
  user?: User;

  @ForeignKey(() => Listing)
  @Index
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  listingId!: number;

  @BelongsTo(() => Listing)
  listing?: Listing;

  @ForeignKey(() => PromotionPlan)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  promotionPlanId!: number;

  @BelongsTo(() => PromotionPlan)
  promotionPlan?: PromotionPlan;

  // ======================== STATUS ========================

  @ApiProperty({ example: 'active', enum: ['pending', 'active', 'expired', 'cancelled'] })
  @Index
  @Column({
    type: DataType.ENUM('pending', 'active', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  })
  status!: ListingPromotionStatus;

  // ======================== DATES ========================

  @ApiProperty({ description: 'When promotion starts' })
  @Index
  @Column(DataType.DATE)
  startDate?: Date;

  @ApiProperty({ description: 'When promotion ends' })
  @Index
  @Column(DataType.DATE)
  endDate?: Date;

  @ApiProperty({ description: 'When promotion was activated' })
  @Column(DataType.DATE)
  activatedAt?: Date;

  // ======================== CACHED EFFECTS (from PromotionPlan) ========================
  // Cache these to maintain historical data even if plan changes

  @ApiProperty({ example: 1.5, description: 'Search boost multiplier at time of purchase' })
  @Column({
    type: DataType.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 1.0,
  })
  searchBoostMultiplier!: number;

  @ApiProperty({ example: true })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  showBadge!: boolean;

  @ApiProperty({ example: true })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  showOnHomepage!: boolean;

  @ApiProperty({ example: true })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isHighlighted!: boolean;

  // ======================== PAYMENT ========================

  @ApiProperty({ example: 9.99, description: 'Amount paid' })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amountPaid!: number;

  @ApiProperty({ example: 'EUR' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'EUR',
  })
  currency!: string;

  @ApiProperty({ example: 'completed', enum: ['pending', 'completed', 'failed', 'refunded'] })
  @Column({
    type: DataType.ENUM('pending', 'completed', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
  })
  paymentStatus!: PaymentStatus;

  @ApiProperty({ example: 'free_boost', description: 'Was this a free boost from subscription' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isFreeBoost!: boolean;

  // ======================== PAYMENT REFERENCES ========================

  @Column(DataType.STRING)
  stripePaymentIntentId?: string;

  @Column(DataType.STRING)
  appleTransactionId?: string;

  @Column(DataType.STRING)
  googlePurchaseToken?: string;

  // ======================== ANALYTICS ========================

  @ApiProperty({ example: 150, description: 'Views during promotion' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  viewsDuringPromotion!: number;

  @ApiProperty({ example: 10, description: 'Inquiries during promotion' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  inquiriesDuringPromotion!: number;

  // ======================== METADATA ========================

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  metadata?: Record<string, any>;

  // ======================== HELPER METHODS ========================

  /**
   * Verifică dacă promoția este activă acum
   */
  isActiveNow(): boolean {
    const now = new Date();
    return (
      this.status === 'active' &&
      this.startDate != null &&
      this.endDate != null &&
      now >= this.startDate &&
      now <= this.endDate
    );
  }

  /**
   * Calculează zilele rămase
   */
  getRemainingDays(): number {
    if (!this.endDate || this.status !== 'active') return 0;
    const now = new Date();
    const diff = this.endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
