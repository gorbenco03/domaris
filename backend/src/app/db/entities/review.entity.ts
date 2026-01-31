/**
 * ⭐ REVIEW ENTITY - User Reviews
 *
 * Stochează review-urile lăsate după vizionări.
 * Ambele părți pot lăsa review:
 * - Seeker-ul lasă review pentru Owner (cum a fost vizionarea)
 * - Owner-ul lasă review pentru Seeker (cum s-a comportat)
 */

import {
  Table,
  Column,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { ExtModel } from './extend.model';
import { User } from './user.entity';
import { Viewing } from './viewing.entity';
import { Listing } from './listing.entity';

@Table({
  tableName: 'reviews',
  underscored: true,
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['recipient_id'] },
    { fields: ['author_id'] },
    { fields: ['viewing_id'], unique: true },
  ],
})
export class Review extends ExtModel {
  // ============================================================================
  // RELATIONSHIPS
  // ============================================================================

  @ForeignKey(() => Viewing)
  @Column(DataType.BIGINT)
  viewingId!: number;

  @BelongsTo(() => Viewing)
  viewing!: Viewing;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  authorId!: number;

  @BelongsTo(() => User, 'authorId')
  author!: User;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  recipientId!: number;

  @BelongsTo(() => User, 'recipientId')
  recipient!: User;

  @ForeignKey(() => Listing)
  @Column(DataType.BIGINT)
  listingId!: number;

  @BelongsTo(() => Listing)
  listing!: Listing;

  // ============================================================================
  // REVIEW CONTENT
  // ============================================================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  })
  rating!: number;

  @Column(DataType.STRING)
  title?: string;

  @Column(DataType.TEXT)
  comment?: string;

  /**
   * Tipul de review:
   * - seeker_to_owner: Cel care a vizionat lasă review pentru proprietar
   * - owner_to_seeker: Proprietarul lasă review pentru cel care a vizionat
   */
  @Column({
    type: DataType.ENUM('seeker_to_owner', 'owner_to_seeker'),
    allowNull: false,
  })
  type!: 'seeker_to_owner' | 'owner_to_seeker';

  /**
   * Tipul tranzacției (context pentru review)
   */
  @Column({
    type: DataType.ENUM('buyer', 'seller', 'renter', 'landlord'),
    allowNull: true,
  })
  transactionType?: 'buyer' | 'seller' | 'renter' | 'landlord';

  /**
   * Dacă seeker-ul este încă interesat de proprietate
   */
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  interested!: boolean;

  // ============================================================================
  // ENGAGEMENT
  // ============================================================================

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  helpfulCount!: number;

  @Column({
    type: DataType.ARRAY(DataType.BIGINT),
    defaultValue: [],
  })
  helpfulByUserIds!: number[];

  // ============================================================================
  // OWNER RESPONSE
  // ============================================================================

  @Column(DataType.TEXT)
  ownerResponse?: string;

  @Column(DataType.DATE)
  ownerRespondedAt?: Date;

  // ============================================================================
  // MODERATION
  // ============================================================================

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isReported!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isVisible!: boolean;

  @Column(DataType.TEXT)
  reportReason?: string;
}
