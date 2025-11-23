import { Table, Column, DataType, HasMany } from 'sequelize-typescript';
import { ExtModel } from './extend.model.js';

@Table({
  tableName: 'users',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class User extends ExtModel {
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  email: string;

  @Column(DataType.STRING)
  fullName?: string;

  @Column(DataType.STRING)
  phone?: string;

  @Column({
    type: DataType.ENUM('tenant', 'landlord', 'admin'),
    defaultValue: 'tenant',
  })
  role: 'tenant' | 'landlord' | 'admin';

  /** Subscription pentru alerte / matching AI */
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  hasActiveSubscription: boolean;

  @Column(DataType.DATE)
  subscriptionExpiresAt: Date | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  appleId: string | null;
}
