import {
  Table,
  Column,
  DataType,
  Index,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { ListingImage } from './listingImage.entity';
import { ExtModel } from './extend.model';
import { User } from './user.entity';

@Table({
  tableName: 'listings',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class Listing extends ExtModel {
  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  ownerId!: number | null;

  @BelongsTo(() => User)
  owner?: User;

  // ----------------- SOURCE METADATA -----------------
  // Simplified - only track if manually created or imported

  @Column({
    type: DataType.ENUM('manual', 'imported'),
    allowNull: false,
    defaultValue: 'manual',
  })
  sourceType!: 'manual' | 'imported';

  // ----------------- LISTING BASIC DATA -----------------

  @ApiProperty({ example: 'Apartament 2 camere', description: 'Listing title' })
  @Column(DataType.STRING)
  title!: string;

  @ApiProperty({ example: 'Beautiful apartment...', description: 'Full description' })
  @Column(DataType.TEXT)
  description!: string;

  @ApiProperty({ example: 'SALE' })
  @Column(DataType.STRING)
  transactionType!: string;

  @ApiProperty({ example: 'APARTMENT' })
  @Column(DataType.STRING)
  propertyType!: string;

  @ApiProperty({ example: 'Bucuresti' })
  @Index
  @Column(DataType.STRING)
  city!: string;

  @ApiProperty({ example: 'Tineretului' })
  @Index
  @Column(DataType.STRING)
  neighborhood!: string;

  // 👇 NOU
  @ApiProperty({ required: false })
  @Column(DataType.STRING)
  rentType?: string; // camera / garsoniera / ap2 / ap3 / casa

  @ApiProperty({ example: 2 })
  @Column(DataType.INTEGER)
  rooms!: number;

  @ApiProperty({ required: false })
  @Column(DataType.INTEGER)
  bedrooms?: number;

  // 👇 NOU
  @ApiProperty({ required: false })
  @Column(DataType.INTEGER)
  bathrooms?: number;

  // 👇 NOU
  @ApiProperty({ required: false })
  @Column(DataType.INTEGER)
  floor?: number;

  // 👇 NOU
  @ApiProperty({ required: false })
  @Column(DataType.STRING)
  buildingType?: string; // bloc vechi / bloc nou / casa

  @ApiProperty({ required: false })
  @Column({ field: 'total_floors', type: DataType.INTEGER })
  totalFloors?: number;

  @ApiProperty({ required: false })
  @Column({ field: 'year_built', type: DataType.INTEGER })
  yearBuilt?: number;

  @ApiProperty({ required: false })
  @Column(DataType.JSONB)
  amenities?: string[];

  @ApiProperty({ example: 500 })
  @Column({
    type: DataType.INTEGER,
    field: 'price_eur',
    allowNull: false,
  })
  priceEur!: number;

  @ApiProperty({ default: 'EUR' })
  @Column({
    type: DataType.STRING,
    defaultValue: 'EUR',
  })
  currency!: string;

  @ApiProperty({ example: 55 })
  @Column(DataType.INTEGER)
  surfaceSqm!: number;

  @ApiProperty()
  @Column(DataType.BOOLEAN)
  isFurnished!: boolean;

  @Column(DataType.BOOLEAN)
  hasCentralHeating!: boolean;

  // ----------------- RENT RULES (useful from FB posts) -----------------

  @Column(DataType.BOOLEAN)
  petFriendly?: boolean;

  @Column(DataType.BOOLEAN)
  longTermOnly?: boolean;

  @Column(DataType.STRING)
  genderPreference?: 'female' | 'male' | 'any';

  // ----------------- AI FIELDS -----------------

  @ApiProperty({ required: false })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  isAgency!: boolean;

  // 👇 NOU
  @ApiProperty({ required: false })
  @Column(DataType.FLOAT)
  ownerTypeConfidence?: number;

  @ApiProperty({ required: false })
  @Column(DataType.JSONB)
  aiMetadata!: any;

  // ----------------- LOCATION -----------------

  @ApiProperty({ example: 'Strada Fericirii 10' })
  @Column(DataType.STRING)
  addressText!: string;

  @ApiProperty({ example: 44.4, required: false })
  @Column({
    type: DataType.DECIMAL(10, 8),
    allowNull: true,
  })
  lat?: number;

  @ApiProperty({ example: 26.1, required: false })
  @Column({
    type: DataType.DECIMAL(11, 8),
    allowNull: true,
  })
  lng?: number;

  @ApiProperty({ required: false, description: 'Whether location was manually set on map' })
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  locationSetManually?: boolean;

  // ----------------- TIMING -----------------

  @ApiProperty()
  @Column(DataType.DATE)
  postedAt!: Date;



  // 👇 NOU — apare des în postările FB
  @ApiProperty({ required: false })
  @Column(DataType.DATE)
  availableFrom?: Date;

  @ApiProperty({ enum: ['new', 'early_access', 'public', 'rented', 'hidden', 'expired'] })
  @Column({
    type: DataType.ENUM(
      'new',
      'early_access',
      'public',
      'rented',
      'hidden',
      'expired'
    ),
    defaultValue: 'new',
  })
  status!: 'new' | 'early_access' | 'public' | 'rented' | 'hidden' | 'expired';

  @ApiProperty()
  @Column({
    type: DataType.DATE,
    field: 'public_from',
  })
  publicFrom!: Date;



  // ----------------- OWNERSHIP VERIFICATION -----------------

  @ApiProperty({ description: 'Whether ownership has been verified by admin' })
  @Column({
    type: DataType.ENUM('none', 'pending', 'verified', 'rejected'),
    allowNull: false,
    defaultValue: 'none',
  })
  ownershipStatus!: 'none' | 'pending' | 'verified' | 'rejected';

  @ApiProperty({ required: false, description: 'URL of ownership proof document (Spaces)' })
  @Column(DataType.STRING)
  ownershipDocUrl?: string | null;

  @ApiProperty({ required: false, description: 'Type of ownership document' })
  @Column(DataType.STRING)
  ownershipDocType?: string | null;

  @ApiProperty({ required: false, description: 'Admin rejection reason' })
  @Column(DataType.TEXT)
  ownershipRejectionReason?: string | null;

  @ApiProperty({ required: false, description: 'When ownership doc was reviewed' })
  @Column(DataType.DATE)
  ownershipReviewedAt?: Date | null;

  @ApiProperty({ required: false, description: 'Admin who reviewed ownership' })
  @Column(DataType.BIGINT)
  ownershipReviewedBy?: number | null;

  // ----------------- RELATIONS -----------------

  @ApiProperty({ type: () => [ListingImage] })
  @HasMany(() => ListingImage)
  images!: ListingImage[];
}
