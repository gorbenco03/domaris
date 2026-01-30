/**
 * 📦 TRANSACTION ENTITY
 *
 * Înregistrează toate tranzacțiile de monetizare.
 * Servește ca audit log pentru plăți.
 *
 * Types:
 * - subscription: Plată pentru abonament
 * - promotion: Plată pentru promovare listing
 * - service: Servicii auxiliare (foto profesionale, etc.)
 *
 * EXTENSIBILITATE:
 * - Poate fi extins pentru facturi
 * - Receipt URL pentru descărcare
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

export type TransactionType = 'subscription' | 'promotion' | 'service' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

/**
 * Metode de plată suportate
 *
 * MOLDOVA-SPECIFIC:
 * - paynet: PAYNET Moldova (terminale și online) - cel mai popular
 * - mpay: MPAY Moldova (plăți mobile)
 * - maib: MAIB E-Commerce (cea mai mare bancă)
 * - runpay: RunPay Moldova
 *
 * INTERNATIONAL:
 * - card: Card bancar generic
 * - apple_pay: Apple Pay (prin Apple IAP) - funcționează în MD!
 * - google_pay: Google Pay (prin Google Play Billing) - funcționează în MD!
 * - bank_transfer: Transfer bancar direct
 *
 * INTERNAL:
 * - free: Gratuit (trial, boost din abonament)
 */
export type PaymentMethod =
  | 'card'
  | 'apple_pay'
  | 'google_pay'
  | 'bank_transfer'
  | 'paynet'      // PAYNET Moldova
  | 'mpay'        // MPAY Moldova
  | 'maib'        // MAIB E-Commerce
  | 'runpay'      // RunPay Moldova
  | 'free';

/**
 * Provideri de plată suportați
 */
export type PaymentProvider =
  | 'apple'       // Apple IAP
  | 'google'      // Google Play Billing
  | 'paynet'      // PAYNET Moldova
  | 'maib'        // MAIB E-Commerce
  | 'mpay'        // MPAY Moldova
  | 'runpay'      // RunPay Moldova
  | 'manual';     // Plată manuală/transfer

@Table({
  tableName: 'transactions',
  underscored: true,
  timestamps: true,
})
export class Transaction extends ExtModel {
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

  // ======================== TYPE & STATUS ========================

  @ApiProperty({ example: 'subscription', enum: ['subscription', 'promotion', 'service', 'refund'] })
  @Index
  @Column({
    type: DataType.ENUM('subscription', 'promotion', 'service', 'refund'),
    allowNull: false,
  })
  type!: TransactionType;

  @ApiProperty({ example: 'completed', enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'] })
  @Index
  @Column({
    type: DataType.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  })
  status!: TransactionStatus;

  // ======================== AMOUNT ========================

  @ApiProperty({ example: 19.99, description: 'Transaction amount' })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount!: number;

  @ApiProperty({ example: 'EUR' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'EUR',
  })
  currency!: string;

  // ======================== PAYMENT ========================

  @ApiProperty({
    example: 'card',
    enum: ['card', 'apple_pay', 'google_pay', 'bank_transfer', 'paynet', 'mpay', 'maib', 'runpay', 'free'],
  })
  @Column({
    type: DataType.STRING, // Using STRING instead of ENUM for flexibility
    allowNull: true,
  })
  paymentMethod?: PaymentMethod;

  // ======================== REFERENCES ========================

  @ApiProperty({ description: 'Related entity ID (subscription, promotion, etc.)' })
  @Column(DataType.BIGINT)
  referenceId?: number;

  @ApiProperty({ description: 'Related entity type' })
  @Column(DataType.STRING)
  referenceType?: string; // 'user_subscription' | 'listing_promotion'

  // ======================== PAYMENT PROVIDER ========================

  @ApiProperty({
    example: 'paynet',
    enum: ['apple', 'google', 'paynet', 'maib', 'mpay', 'runpay', 'manual'],
  })
  @Column(DataType.STRING)
  paymentProvider?: PaymentProvider;

  // ======================== EXTERNAL IDS ========================

  /**
   * ID-uri specifice fiecărui provider
   * Folosim câmpuri separate pentru claritate și indexare
   */

  // Apple IAP
  @Column(DataType.STRING)
  appleTransactionId?: string;

  // Google Play Billing
  @Column(DataType.STRING)
  googleOrderId?: string;

  // PAYNET Moldova
  @Column(DataType.STRING)
  paynetTransactionId?: string;

  // MAIB E-Commerce
  @Column(DataType.STRING)
  maibTransactionId?: string;

  // MPAY Moldova
  @Column(DataType.STRING)
  mpayTransactionId?: string;

  // RunPay Moldova
  @Column(DataType.STRING)
  runpayTransactionId?: string;

  // Generic external reference (backup)
  @Column(DataType.STRING)
  externalTransactionId?: string;

  // ======================== RECEIPT ========================

  @ApiProperty({ description: 'Receipt/Invoice URL' })
  @Column(DataType.STRING)
  receiptUrl?: string;

  @ApiProperty({ description: 'Invoice number' })
  @Column(DataType.STRING)
  invoiceNumber?: string;

  // ======================== DESCRIPTION ========================

  @ApiProperty({ example: 'Premium Subscription - Monthly' })
  @Column(DataType.STRING)
  description?: string;

  // ======================== REFUND ========================

  @ApiProperty({ description: 'Original transaction if this is a refund' })
  @Column(DataType.BIGINT)
  originalTransactionId?: number;

  @ApiProperty({ description: 'Refund reason' })
  @Column(DataType.TEXT)
  refundReason?: string;

  // ======================== DATES ========================

  @ApiProperty({ description: 'When payment was completed' })
  @Column(DataType.DATE)
  completedAt?: Date;

  @ApiProperty({ description: 'When payment failed' })
  @Column(DataType.DATE)
  failedAt?: Date;

  @ApiProperty({ description: 'When refund was processed' })
  @Column(DataType.DATE)
  refundedAt?: Date;

  // ======================== ERROR HANDLING ========================

  @Column(DataType.STRING)
  failureCode?: string;

  @Column(DataType.TEXT)
  failureMessage?: string;

  // ======================== METADATA ========================

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  metadata?: Record<string, any>;

  // ======================== IP & DEVICE ========================

  @Column(DataType.STRING)
  ipAddress?: string;

  @Column(DataType.STRING)
  userAgent?: string;
}
