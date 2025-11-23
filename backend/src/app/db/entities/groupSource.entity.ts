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
  declare id: number;

  // ex: "timisoara", "cluj-napoca"
  @Column({ type: DataType.STRING(100), allowNull: false })
  declare citySlug: string;

  // ex: "RO"
  @Column({ type: DataType.STRING(2), allowNull: false, defaultValue: 'RO' })
  declare countryCode: string;

  @ForeignKey(() => GisNode)
  @Column({ type: DataType.BIGINT, allowNull: true })
  declare gisNodeId: number | null;

  @BelongsTo(() => GisNode)
  declare gisNode: GisNode;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'facebook',
  })
  declare platform: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string; // numele grupului

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  declare url: string; // link spre grupul de Facebook

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;

  // pentru prioritizare la scraping (1 = high, 10 = low)
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 5 })
  declare priority: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastScrapedAt: Date | null;
}
