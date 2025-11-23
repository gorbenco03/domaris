// src/db/entities/gis-node.entity.ts
import { Table, Column, DataType, Model, HasMany } from 'sequelize-typescript';
import { GroupSource } from './groupSource.entity';

@Table({
  tableName: 'gis_nodes',
  timestamps: true,
  underscored: true,
  paranoid: true
})
export class GisNode extends Model<GisNode> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  citySlug: string; // "timisoara", "cluj-napoca" etc.

  @Column({ type: DataType.STRING(150), allowNull: false })
  name: string; // "Timisoara - Centru", "Timisoara - Girocului" etc.

  @Column({ type: DataType.STRING(50), allowNull: false })
  type: string; // "city", "district", "area"

  @Column({ type: DataType.DOUBLE, allowNull: false })
  lat: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  lng: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  radiusKm: number;

  @HasMany(() => GroupSource)
  groupSources: GroupSource[];
}
