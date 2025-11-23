import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { FbPost } from "./fbPost.model";

@Table({ 
  tableName: 'fb_post_images', 
  paranoid: true, 
  underscored: true,
  timestamps: true 
})
export class FbPostImage extends Model<FbPostImage> {
  @ForeignKey(() => FbPost)
  @Column
  fbPostId: number;

  @Column(DataType.TEXT)
  url: string;

  @Column(DataType.TEXT)
  alt: string;

  @Column(DataType.INTEGER)
  position: number;
}
