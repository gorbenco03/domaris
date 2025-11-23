import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { FbPostImage } from "./fb-post-image.model";

@Table({ tableName: 'fb_posts', paranoid: true, underscored: true, timestamps: true })
export class FbPost extends Model<FbPost> {
  @Column({ type: DataType.TEXT })
  fbPostUrl: string;

  @Column({ type: DataType.STRING })
  fbUserId: string;

  @Column({ type: DataType.STRING })
  fbUserName: string;

  @Column({ type: DataType.TEXT })
  fbUserProfileUrl: string;

  @Column({ type: DataType.STRING })
  groupId: string;

  @Column({ type: DataType.DATE })
  postedAt: Date;

  @Column({ type: DataType.TEXT })
  text: string;

  @Column(DataType.INTEGER)
  reactionCount: number;

  @Column(DataType.INTEGER)
  shareCount: number;

  @Column(DataType.INTEGER)
  commentCount: number;

  @Column(DataType.JSONB)
  rawJson: any;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  processed: boolean;

  @HasMany(() => FbPostImage)
  images: FbPostImage[];
}
