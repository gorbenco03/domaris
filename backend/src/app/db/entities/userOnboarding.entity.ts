import {
  Table,
  Column,
  DataType,
  Model,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.entity';

export interface UserOnboardingAttributes {
  id?: number;
  userId: number;

  fullName: string;
  phoneNumber: string;
  phoneVerified: boolean;

  ownerType: 'individual' | 'company' | 'agency';
  companyName?: string | null;

  petFriendlyDefault?: boolean | null;
  longTermOnlyDefault?: boolean | null;
  genderPreferenceDefault?: 'female' | 'male' | 'any' | null;

  allowedContacts?: string[] | null;

  iban?: string | null;
  billingAddress?: string | null;

  isComplete: boolean;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

@Table({
  tableName: 'user_onboarding',
  paranoid: true,
})
export class UserOnboarding
  extends Model<UserOnboardingAttributes>
  implements UserOnboardingAttributes
{
  @Column(DataType.STRING)
  declare fullName: string;

  @Column(DataType.STRING)
  declare phoneNumber: string;

  @Column(DataType.BOOLEAN)
  declare phoneVerified: boolean;

  @Column({
    type: DataType.ENUM('individual', 'company', 'agency'),
  })
  declare ownerType: 'individual' | 'company' | 'agency';

  @Column(DataType.STRING)
  declare companyName?: string | null;

  @Column(DataType.BOOLEAN)
  declare petFriendlyDefault?: boolean | null;

  @Column(DataType.BOOLEAN)
  declare longTermOnlyDefault?: boolean | null;

  @Column({
    type: DataType.ENUM('female', 'male', 'any'),
  })
  declare genderPreferenceDefault?: 'female' | 'male' | 'any' | null;

  @Column(DataType.JSONB)
  declare allowedContacts?: string[] | null;

  @Column(DataType.STRING)
  declare iban?: string | null;

  @Column(DataType.STRING)
  declare billingAddress?: string | null;

  @Column(DataType.BOOLEAN)
  declare isComplete: boolean;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;
}
