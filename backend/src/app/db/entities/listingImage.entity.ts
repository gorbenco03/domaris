// src/db/entities/listingImage.entity.ts
import {
  Table,
  Column,
  DataType,
  Model,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Listing } from './listing.entity.js';

export interface ListingImageAttributes {
  id: number;
  listingId: number;
  url: string;
  isPrimary: boolean;
  alt?: string | null;
}

export type ListingImageCreationAttributes = Optional<
  ListingImageAttributes,
  'id' | 'isPrimary' | 'alt'
>;

@Table({
  tableName: 'listing_images',
  timestamps: true,
  underscored: true,
})
export class ListingImage
  extends Model<ListingImageAttributes, ListingImageCreationAttributes>
  implements ListingImageAttributes
{
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Listing)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  declare listingId: number;

  @BelongsTo(() => Listing)
  declare listing: Listing;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
  })
  declare order: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare url: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isPrimary: boolean;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare alt?: string | null;
}
