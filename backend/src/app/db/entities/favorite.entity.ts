import {
    Table,
    Column,
    DataType,
    BelongsTo,
    ForeignKey,
} from 'sequelize-typescript';
import { ExtModel } from './extend.model.js';
import { User } from './user.entity.js';
import { Listing } from './listing.entity.js';

@Table({
    tableName: 'favorites',
    underscored: true,
    timestamps: true,
    paranoid: true,
})
export class Favorite extends ExtModel {
    @ForeignKey(() => User)
    @Column(DataType.BIGINT)
    userId!: number;

    @BelongsTo(() => User)
    user!: User;

    @ForeignKey(() => Listing)
    @Column(DataType.BIGINT)
    propertyId!: number;

    @BelongsTo(() => Listing)
    property!: Listing;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    listId?: string; // Optional custom list identifier/name
}
