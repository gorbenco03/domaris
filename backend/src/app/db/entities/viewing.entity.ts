import {
    Table,
    Column,
    DataType,
    BelongsTo,
    ForeignKey,
} from 'sequelize-typescript';
import { ExtModel } from './extend.model';
import { User } from './user.entity';
import { Listing } from './listing.entity';

@Table({
    tableName: 'viewings',
    underscored: true,
    timestamps: true,
    paranoid: true,
})
export class Viewing extends ExtModel {
    @ForeignKey(() => Listing)
    @Column(DataType.BIGINT)
    propertyId: number;

    @BelongsTo(() => Listing)
    property: Listing;

    @ForeignKey(() => User)
    @Column(DataType.BIGINT)
    seekerId: number;

    @BelongsTo(() => User)
    seeker: User;

    @Column(DataType.DATE)
    slot: Date;

    @Column({
        type: DataType.ENUM('pending', 'accepted', 'rejected', 'cancelled'),
        defaultValue: 'pending',
    })
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';

    @Column(DataType.TEXT)
    notes?: string;
}
