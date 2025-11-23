// src/db/entities/gis-node.entity.ts
import { Table, Column, DataType, Model, HasMany } from 'sequelize-typescript';
import { GroupSource } from './groupSource.entity';

@Table({
  tableName: 'gis_nodes',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class GisNode extends Model<GisNode> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare citySlug: string; // "timisoara", "cluj-napoca" etc.

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare name: string; // "Timisoara - Centru", "Timisoara - Girocului" etc.

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare type: string; // "city", "district", "area"

  @Column({ type: DataType.DOUBLE, allowNull: false })
  declare lat: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  declare lng: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  declare radiusKm: number;

  @HasMany(() => GroupSource)
  declare groupSources: GroupSource[];
}
