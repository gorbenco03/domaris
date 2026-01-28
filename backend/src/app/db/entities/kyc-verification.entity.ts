import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Index,
} from 'sequelize-typescript';
import { ExtModel } from './extend.model.js';
import { User } from './user.entity.js';
import { KycDocument } from './kyc-document.entity.js';

@Table({
  tableName: 'kyc_verifications',
  underscored: true,
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id'],
    },
  ],
})
export class KycVerification extends ExtModel {
  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, field: 'user_id' })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.ENUM(
      'NOT_STARTED',
      'PENDING',
      'IN_REVIEW',
      'APPROVED',
      'REJECTED',
      'EXPIRED',
    ),
    allowNull: false,
    defaultValue: 'NOT_STARTED',
  })
  status!: 'NOT_STARTED' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: { min: 2, max: 3 },
  })
  targetLevel!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'MANUAL',
  })
  provider!: string;

  @Column(DataType.DATE)
  submittedAt?: Date | null;

  @Column(DataType.DATE)
  reviewedAt?: Date | null;

  @Column(DataType.BIGINT)
  reviewedBy?: number | null;

  @Column(DataType.TEXT)
  rejectionReason?: string | null;

  @Column(DataType.DATE)
  expiresAt?: Date | null;

  @HasMany(() => KycDocument)
  documents!: KycDocument[];
}
