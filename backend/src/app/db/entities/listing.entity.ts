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
  ownerId: number | null;

  @BelongsTo(() => User)
  owner?: User;

  // ----------------- SOURCE METADATA -----------------

  @Column({
    type: DataType.ENUM('facebook', 'manual', 'other'),
    allowNull: false,
    defaultValue: 'facebook',
  })
  sourceType: 'facebook' | 'manual' | 'other';

  @Column(DataType.STRING)
  externalPostId?: string;

  @Column(DataType.STRING)
  externalGroupId?: string;

  @Column(DataType.STRING)
  sourceUrl?: string;

  // 👇 NOI — din scraper
  @Column(DataType.STRING)
  parsedOwnerName?: string;

  @Column(DataType.STRING)
  parsedOwnerProfileUrl?: string;

  // ----------------- SOCIAL METRICS (FB) -----------------

  @Column(DataType.INTEGER)
  reactionCount?: number;

  @Column(DataType.INTEGER)
  shareCount?: number;

  @Column(DataType.INTEGER)
  commentCount?: number;

  // ----------------- LISTING BASIC DATA -----------------

  @ApiProperty({ example: 'Apartament 2 camere', description: 'Listing title' })
  @Column(DataType.STRING)
  title: string;

  @ApiProperty({ example: 'Beautiful apartment...', description: 'Full description' })
  @Column(DataType.TEXT)
  description: string;

  @ApiProperty({ example: 'Bucuresti' })
  @Index
  @Column(DataType.STRING)
  city: string;

  @ApiProperty({ example: 'Tineretului' })
  @Index
  @Column(DataType.STRING)
  neighborhood: string;

  // 👇 NOU
  @ApiProperty({ required: false })
  @Column(DataType.STRING)
  rentType?: string; // camera / garsoniera / ap2 / ap3 / casa

  @ApiProperty({ example: 2 })
  @Column(DataType.INTEGER)
  rooms: number;

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

  @ApiProperty({ example: 500 })
  @Column({
    type: DataType.INTEGER,
    field: 'price_eur',
  })
  priceEur: number;

  @ApiProperty({ default: 'EUR' })
  @Column({
    type: DataType.STRING,
    defaultValue: 'EUR',
  })
  currency: string;

  @ApiProperty({ example: 55 })
  @Column(DataType.INTEGER)
  surfaceSqm: number;

  @ApiProperty()
  @Column(DataType.BOOLEAN)
  isFurnished: boolean;

  @Column(DataType.BOOLEAN)
  hasCentralHeating: boolean;

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
  isAgency: boolean;

  // 👇 NOU
  @ApiProperty({ required: false })
  @Column(DataType.FLOAT)
  ownerTypeConfidence?: number;

  @ApiProperty({ required: false })
  @Column(DataType.JSONB)
  aiMetadata: any;

  // ----------------- LOCATION -----------------

  @ApiProperty({ example: 'Strada Fericirii 10' })
  @Column(DataType.STRING)
  addressText: string;

  @ApiProperty({ example: 44.4 })
  @Column(DataType.DECIMAL(9, 6))
  lat: number;

  @ApiProperty({ example: 26.1 })
  @Column(DataType.DECIMAL(9, 6))
  lng: number;

  // ----------------- TIMING -----------------

  @ApiProperty()
  @Column(DataType.DATE)
  postedAt: Date;

  @ApiProperty({ required: false })
  @Column(DataType.DATE)
  scrapedAt: Date;

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
  status: 'new' | 'early_access' | 'public' | 'rented' | 'hidden' | 'expired';

  @ApiProperty()
  @Column({
    type: DataType.DATE,
    field: 'public_from',
  })
  publicFrom: Date;

  // ----------------- RAW SOURCE (FB JSON) -----------------

  @Column(DataType.JSONB)
  rawSource: any;

  // ----------------- RELATIONS -----------------

  @ApiProperty({ type: () => [ListingImage] })
  @HasMany(() => ListingImage)
  images: ListingImage[];
}
