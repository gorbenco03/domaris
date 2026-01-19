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
  firstName?: string;

  @Column(DataType.STRING)
  lastName?: string;

  @Column(DataType.STRING)
  password?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  googleId: string | null;

  @Column(DataType.STRING)
  appleId: string | null;

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

  // --- Profile Fields ---
  @Column(DataType.TEXT)
  bio?: string;

  @Column(DataType.STRING)
  location?: string;

  @Column(DataType.STRING)
  avatar?: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  verificationLevel: number; // 0=none, 1=id, 2=property, etc.

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  rating: number;

  // Virtual field or relation count can be handled via repository, keeping simpler for now
  @Column({
    type: DataType.VIRTUAL,
    get() {
      // detailed logic would go here or in a getter
      return 0;
    },
  })
  activeListings: number;
}
