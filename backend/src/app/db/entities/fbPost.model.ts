import { Table, Column, DataType, Model, HasMany } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { FbPostImage } from './fb-post-image.model';

export interface FbPostAttributes {
  id: number;
  fbPostUrl: string;
  fbUserId: string;
  fbUserName: string;
  fbUserProfileUrl: string;
  groupId: string;
  postedAt: Date;
  text: string;
  reactionCount: number;
  shareCount: number;
  commentCount: number;
  rawJson: any;
  processed: boolean;
}

export type FbPostCreationAttributes = Optional<
  FbPostAttributes,
  | 'id'
  | 'reactionCount'
  | 'shareCount'
  | 'commentCount'
  | 'rawJson'
  | 'processed'
>;

@Table({
  tableName: 'fb_posts',
  paranoid: true,
  underscored: true,
  timestamps: true,
})
export class FbPost
  extends Model<FbPostAttributes, FbPostCreationAttributes>
  implements FbPostAttributes
{
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare fbPostUrl: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare fbUserId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare fbUserName: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare fbUserProfileUrl: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare groupId: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare postedAt: Date;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare text: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare reactionCount: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare shareCount: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare commentCount: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare rawJson: any;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare processed: boolean;

  @HasMany(() => FbPostImage)
  declare images: FbPostImage[];
}
