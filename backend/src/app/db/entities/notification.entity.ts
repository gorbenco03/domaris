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
    tableName: 'notifications',
    underscored: true,
    timestamps: true,
    paranoid: true,
})
export class Notification extends ExtModel {
    @ForeignKey(() => User)
    @Column(DataType.BIGINT)
    userId!: number;

    @BelongsTo(() => User)
    user!: User;

    @Column(DataType.STRING)
    title!: string;

    @Column(DataType.TEXT)
    body!: string;

    @Column(DataType.STRING)
    type!: string; // e.g. 'message', 'viewing_request', 'system'

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
    })
    isRead!: boolean;

    @Column(DataType.JSONB)
    metadata!: any;
}
