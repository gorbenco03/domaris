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
    tableName: 'rental_contracts',
    underscored: true,
    timestamps: true,
    paranoid: false,
})
export class RentalContract extends ExtModel {
    @ForeignKey(() => Listing)
    @Column(DataType.BIGINT)
    listingId!: number;

    @BelongsTo(() => Listing)
    listing!: Listing;

    @ForeignKey(() => User)
    @Column({ type: DataType.BIGINT, field: 'owner_id' })
    ownerId!: number;

    @BelongsTo(() => User, 'owner_id')
    owner!: User;

    @ForeignKey(() => User)
    @Column({ type: DataType.BIGINT, field: 'seeker_id' })
    seekerId!: number;

    @BelongsTo(() => User, 'seeker_id')
    seeker!: User;

    @Column({
        type: DataType.ENUM('draft', 'proposed', 'accepted', 'signed'),
        defaultValue: 'draft',
    })
    status!: 'draft' | 'proposed' | 'accepted' | 'signed';

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
    monthlyRent!: number;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
    deposit!: number;

    @Column({ type: DataType.STRING, defaultValue: 'EUR' })
    currency!: string;

    @Column({ type: DataType.DATE, allowNull: false })
    startDate!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    endDate!: Date;

    @Column({ type: DataType.TEXT, allowNull: true })
    terms?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    signedByOwnerAt?: Date | null;

    @Column({ type: DataType.DATE, allowNull: true })
    signedBySeekerAt?: Date | null;
}
