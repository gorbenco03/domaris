import {
  Table,
  Column,
  DataType,
  Index,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { ListingImage } from './listingImage.entity';
import { ExtModel } from './extend.model';
import { User } from './user.entity';

@Table({
  tableName: 'listings',
  underscored: true,
  timestamps: true,
  paranoid: true
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

  @Column(DataType.STRING)
  title: string;

  @Column(DataType.TEXT)
  description: string;

  @Index
  @Column(DataType.STRING)
  city: string;

  @Index
  @Column(DataType.STRING)
  neighborhood: string;

  // 👇 NOU
  @Column(DataType.STRING)
  rentType?: string; // camera / garsoniera / ap2 / ap3 / casa

  @Column(DataType.INTEGER)
  rooms: number;

  // 👇 NOU
  @Column(DataType.INTEGER)
  bathrooms?: number;

  // 👇 NOU
  @Column(DataType.INTEGER)
  floor?: number;

  // 👇 NOU
  @Column(DataType.STRING)
  buildingType?: string; // bloc vechi / bloc nou / casa

  @Column({
    type: DataType.INTEGER,
    field: 'price_eur',
  })
  priceEur: number;

  @Column({
    type: DataType.STRING,
    defaultValue: 'EUR',
  })
  currency: string;

  @Column(DataType.INTEGER)
  surfaceSqm: number;

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

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  isAgency: boolean;

  // 👇 NOU
  @Column(DataType.FLOAT)
  ownerTypeConfidence?: number;

  @Column(DataType.JSONB)
  aiMetadata: any;

  // ----------------- LOCATION -----------------

  @Column(DataType.STRING)
  addressText: string;

  @Column(DataType.DECIMAL(9, 6))
  lat: number;

  @Column(DataType.DECIMAL(9, 6))
  lng: number;

  // ----------------- TIMING -----------------

  @Column(DataType.DATE)
  postedAt: Date;

  @Column(DataType.DATE)
  scrapedAt: Date;

  // 👇 NOU — apare des în postările FB
  @Column(DataType.DATE)
  availableFrom?: Date;

  @Column({
    type: DataType.ENUM(
      'new',
      'early_access',
      'public',
      'rented',
      'hidden',
      'expired',
    ),
    defaultValue: 'new',
  })
  status: 'new' | 'early_access' | 'public' | 'rented' | 'hidden' | 'expired';

  @Index
  @Column(DataType.DATE)
  publicFrom: Date;

  // ----------------- RAW SOURCE (FB JSON) -----------------

  @Column(DataType.JSONB)
  rawSource: any;

  // ----------------- RELATIONS -----------------

  @HasMany(() => ListingImage)
  images: ListingImage[];

}
