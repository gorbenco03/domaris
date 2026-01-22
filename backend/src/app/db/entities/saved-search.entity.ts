/**
 * 🔍 SAVED SEARCH ENTITY
 * 
 * Pentru salvarea căutărilor și generarea alertelor de proprietăți noi
 */

import {
  Table,
  Column,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { ExtModel } from './extend.model.js';
import { User } from './user.entity.js';

@Table({
  tableName: 'saved_searches',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class SavedSearch extends ExtModel {
  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name!: string;

  /**
   * Search parameters - stored as JSONB for flexibility
   * Conține: query, city, priceMin, priceMax, rooms, etc.
   */
  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  params!: Record<string, any>;

  /**
   * Alerte - trimite notificări când apar proprietăți noi care se potrivesc
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  alertsEnabled!: boolean;

  @Column({
    type: DataType.ENUM('INSTANT', 'DAILY', 'WEEKLY'),
    allowNull: true,
  })
  alertFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastAlertAt?: Date;

  /**
   * Counter de match-uri noi de la ultima vizitare
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  newMatchesCount!: number;

  /**
   * Numărul total de proprietăți care se potrivesc în momentul salvării
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  totalMatchesCount!: number;

  /**
   * Ultima dată când user-ul a vizualizat această căutare
   */
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastViewedAt?: Date;
}
