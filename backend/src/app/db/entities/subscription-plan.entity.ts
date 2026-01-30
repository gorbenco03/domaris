/**
 * 📦 SUBSCRIPTION PLAN ENTITY
 *
 * Definește planurile de abonament disponibile pe platformă.
 * Conform documentației 11-MONETIZATION.md:
 * - FREE: 0€ (1 anunț, 5 poze, stats de bază)
 * - STANDARD: 9.99€/lună (5 anunțuri, 15 poze, stats avansate)
 * - PREMIUM: 19.99€/lună (15 anunțuri, 30 poze, prioritate, badge)
 * - BUSINESS: 49.99€/lună (nelimitat, API, white-label)
 *
 * EXTENSIBILITATE:
 * - Prețurile sunt configurabile în DB, nu hardcodate
 * - Poate fi extins cu Stripe price_id când se integrează plățile
 */

import {
  Table,
  Column,
  DataType,
  HasMany,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { ExtModel } from './extend.model.js';

@Table({
  tableName: 'subscription_plans',
  underscored: true,
  timestamps: true,
})
export class SubscriptionPlan extends ExtModel {
  @ApiProperty({ example: 'premium', description: 'Unique plan identifier' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  code!: string; // 'free' | 'standard' | 'premium' | 'business'

  @ApiProperty({ example: 'Premium', description: 'Display name' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @ApiProperty({ example: 'Cel mai popular plan pentru proprietari activi' })
  @Column(DataType.TEXT)
  description?: string;

  // ======================== PRICING ========================

  @ApiProperty({ example: 19.99, description: 'Monthly price in EUR' })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  priceMonthly!: number;

  @ApiProperty({ example: 15.99, description: 'Monthly price when billed yearly' })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  priceYearly?: number; // Per month when billed yearly

  @ApiProperty({ example: 'EUR' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'EUR',
  })
  currency!: string;

  // ======================== LIMITS ========================

  @ApiProperty({ example: 15, description: 'Max active listings allowed' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  maxActiveListings!: number;

  @ApiProperty({ example: 30, description: 'Max photos per listing' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 5,
  })
  maxPhotosPerListing!: number;

  @ApiProperty({ example: 2, description: 'Free monthly boosts included' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  freeMonthlyBoosts!: number;

  // ======================== FEATURES ========================

  @ApiProperty({ example: true, description: 'Access to advanced analytics' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  hasAdvancedAnalytics!: boolean;

  @ApiProperty({ example: true, description: 'Priority support access' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  hasPrioritySupport!: boolean;

  @ApiProperty({ example: true, description: 'Shows verified badge' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  hasBadge!: boolean;

  @ApiProperty({ example: true, description: 'Priority in search results' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  hasPrioritySearch!: boolean;

  @ApiProperty({ example: true, description: 'AI features access' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  hasAIFeatures!: boolean;

  @ApiProperty({ example: true, description: 'Video tour upload' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  hasVideoTour!: boolean;

  // ======================== TRIAL ========================

  @ApiProperty({ example: 14, description: 'Trial period in days' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  trialDays!: number;

  // ======================== ORDERING ========================

  @ApiProperty({ example: 2, description: 'Display order in UI' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  displayOrder!: number;

  @ApiProperty({ example: true, description: 'Is this plan active and available' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @ApiProperty({ example: true, description: 'Show as "Popular" or "Recommended"' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isPopular!: boolean;

  // ======================== PAYMENT INTEGRATION (extensibilitate) ========================

  /**
   * Stripe Price ID - pentru integrare viitoare
   * Exemplu: 'price_1234567890'
   */
  @Column(DataType.STRING)
  stripePriceIdMonthly?: string;

  @Column(DataType.STRING)
  stripePriceIdYearly?: string;

  /**
   * Apple/Google In-App Purchase Product ID
   */
  @Column(DataType.STRING)
  appleProductId?: string;

  @Column(DataType.STRING)
  googleProductId?: string;

  // ======================== METADATA ========================

  @ApiProperty({ description: 'Additional features as JSON' })
  @Column({
    type: DataType.JSONB,
    defaultValue: [],
  })
  features!: string[]; // Lista de features pentru afișare în UI

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  metadata?: Record<string, any>;
}
