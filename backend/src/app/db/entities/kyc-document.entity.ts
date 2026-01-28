import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { ExtModel } from './extend.model.js';
import { User } from './user.entity.js';
import { KycVerification } from './kyc-verification.entity.js';

@Table({
  tableName: 'kyc_documents',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class KycDocument extends ExtModel {
  @ForeignKey(() => KycVerification)
  @Column(DataType.BIGINT)
  verificationId!: number;

  @BelongsTo(() => KycVerification)
  verification!: KycVerification;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column(DataType.BIGINT)
  propertyId?: number | null;

  @Column({
    type: DataType.ENUM(
      'ID_CARD',
      'PASSPORT',
      'DRIVING_LICENSE',
      'PROPERTY_DEED',
      'UTILITY_BILL',
      'SELFIE',
      'OTHER',
    ),
    allowNull: false,
  })
  type!: string;

  @Column({
    type: DataType.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    allowNull: false,
    defaultValue: 'PENDING',
  })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column(DataType.STRING)
  fileUrl?: string | null;

  @Column(DataType.DATE)
  uploadedAt!: Date;

  @Column(DataType.DATE)
  reviewedAt?: Date | null;

  @Column(DataType.TEXT)
  rejectionReason?: string | null;
}
