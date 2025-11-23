import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Listing } from "./listing.entity";

@Table({ tableName: 'listing_images', paranoid: true })
export class ListingImage extends Model<ListingImage> {
  @ForeignKey(() => Listing)
  @Column
  listingId: number;

  @Column(DataType.TEXT)
  url: string;
}
