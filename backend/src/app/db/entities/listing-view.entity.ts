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
    tableName: 'listing_views',
    underscored: true,
    timestamps: true,
    updatedAt: false, // Views are immutable events usually
})
export class ListingView extends ExtModel {
    @ForeignKey(() => Listing)
    @Column(DataType.BIGINT)
    listingId!: number;

    @BelongsTo(() => Listing)
    listing!: Listing;

    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
    })
    viewerId?: number;

    @BelongsTo(() => User)
    viewer?: User;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    ip?: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    anonymousId?: string;

    // Potential future field: userAgent, source, etc.
}
