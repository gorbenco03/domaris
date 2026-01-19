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
    tableName: 'devices',
    underscored: true,
    timestamps: true,
    paranoid: true,
})
export class Device extends ExtModel {
    @ForeignKey(() => User)
    @Column(DataType.BIGINT)
    userId: number;

    @BelongsTo(() => User)
    user: User;

    @Column(DataType.STRING)
    token: string;

    @Column(DataType.STRING)
    platform: 'ios' | 'android' | 'web';

    @Column(DataType.STRING)
    deviceId: string;
}
