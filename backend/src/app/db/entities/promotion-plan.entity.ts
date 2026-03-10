/**
 * 📦 PROMOTION PLAN ENTITY
 *
 * Definește tipurile de promovare disponibile pentru anunțuri.
 * Conform documentației 11-MONETIZATION.md:
 *
 * - BOOST_24H: 1.99€ - Top lista 24h în zonă
 * - BOOST_7D: 9.99€ - Top lista 7 zile (+50% mai multe views)
 * - HIGHLIGHT: 4.99€ - Badge "Promovat" 14 zile
 * - HOMEPAGE: 29.99€ - Afișare pe homepage 7 zile
 *
 * EXTENSIBILITATE:
 * - Prețurile configurabile
 * - Poate fi extins cu noi tipuri de promovare
 */

import {
  Table,
  Column,
  DataType,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { ExtModel } from './extend.model.js';

export type PromotionType = 'boost_24h' | 'boost_7d' | 'highlight' | 'homepage';

@Table({
  tableName: 'promotion_plans',
  underscored: true,
  timestamps: true,
})
export class PromotionPlan extends ExtModel {
  @ApiProperty({ example: 'boost_7d', description: 'Unique promotion identifier' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  code!: string; // boost_24h, boost_7d, highlight, homepage

  @ApiProperty({ example: 'Boost 7 zile', description: 'Display name' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @ApiProperty({ example: 'Top lista 7 zile, +50% mai multe views' })
  @Column(DataType.TEXT)
  description?: string;

  // ======================== PRICING ========================

  @ApiProperty({ example: 9.99, description: 'Price in EUR' })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  price!: number;

  @ApiProperty({ example: 'EUR' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'EUR',
  })
  currency!: string;

  // ======================== DURATION ========================

  @ApiProperty({ example: 7, description: 'Duration in days' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  durationDays!: number;

  // ======================== EFFECTS ========================

  /**
   * Search boost multiplier
   * Exemplu: 1.5 = 50% mai sus în rezultate
   */
  @ApiProperty({ example: 1.5, description: 'Search ranking boost multiplier' })
  @Column({
    type: DataType.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 1.0,
  })
  searchBoostMultiplier!: number;

  @ApiProperty({ example: true, description: 'Shows "Promovat" badge' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  showBadge!: boolean;

  @ApiProperty({ example: 'Promovat', description: 'Text shown in the badge' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  badgeText?: string;

  @ApiProperty({ example: true, description: 'Appears on homepage' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  showOnHomepage!: boolean;

  @ApiProperty({ example: true, description: 'Highlighted in search results' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isHighlighted!: boolean;

  // ======================== STATUS ========================

  @ApiProperty({ example: true, description: 'Is this promotion available for purchase' })
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

  @ApiProperty({ example: 1, description: 'Display order in UI' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  displayOrder!: number;

  // ======================== UI CONFIG ========================

  @ApiProperty({ example: '#FF6B00', description: 'Gradient start color' })
  @Column(DataType.STRING)
  gradientStart?: string;

  @ApiProperty({ example: '#FF9500', description: 'Gradient end color' })
  @Column(DataType.STRING)
  gradientEnd?: string;

  @ApiProperty({ example: 'rocket', description: 'Icon name for UI' })
  @Column(DataType.STRING)
  iconName?: string;

  @ApiProperty({ example: '+300% views estimate', description: 'Impact text for UI' })
  @Column(DataType.STRING)
  impactText?: string;

  // ======================== PAYMENT INTEGRATION ========================

  @Column(DataType.STRING)
  stripePriceId?: string;

  @Column(DataType.STRING)
  appleProductId?: string;

  @Column(DataType.STRING)
  googleProductId?: string;

  // ======================== METADATA ========================

  @ApiProperty({ description: 'Benefits list for UI' })
  @Column({
    type: DataType.JSONB,
    defaultValue: [],
  })
  benefits!: string[];

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  metadata?: Record<string, any>;
}
