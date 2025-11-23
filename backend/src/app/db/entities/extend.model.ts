import {
  Sequelize,
  Model,
  Column,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

export class ExtModel extends Model {
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.DATE, defaultValue: null })
  declare deletedAt: Date;
}
