import {
  Table,
  Column,
  DataType,
  Model,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { GisNode } from './gisNode.entity';

@Table({
  tableName: 'group_sources',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class GroupSource extends Model<GroupSource> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  // ex: "timisoara", "cluj-napoca"
  @Column({ type: DataType.STRING(100), allowNull: false })
  citySlug: string;

  // ex: "RO"
  @Column({ type: DataType.STRING(2), allowNull: false, defaultValue: 'RO' })
  countryCode: string;

  @ForeignKey(() => GisNode)
  @Column({ type: DataType.BIGINT, allowNull: true })
  gisNodeId: number | null;

  @BelongsTo(() => GisNode)
  gisNode: GisNode;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'facebook',
  })
  platform: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string; // numele grupului

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  url: string; // link spre grupul de Facebook

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  isActive: boolean;

  // pentru prioritizare la scraping (1 = high, 10 = low)
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 5 })
  priority: number;

  @Column({ type: DataType.DATE, allowNull: true })
  lastScrapedAt: Date | null;
}
