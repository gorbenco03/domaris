import {
    Table,
    Column,
    DataType,
    BelongsTo,
    HasMany,
    ForeignKey,
    BelongsToMany,
} from 'sequelize-typescript';
import { ExtModel } from './extend.model';
import { User } from './user.entity';
import { Listing } from './listing.entity';
import { Message } from './message.entity';

@Table({
    tableName: 'conversations',
    underscored: true,
    timestamps: true,
    paranoid: true,
})
export class Conversation extends ExtModel {
    @ForeignKey(() => Listing)
    @Column(DataType.BIGINT)
    propertyId!: number | null;

    @BelongsTo(() => Listing)
    property!: Listing;

    // Simple implementation: participant1 and participant2 instead of ManyToMany join table for simplicity?
    // Or stick to ManyToMany if more users allowed. Guide implies 1 on 1 mostly (seeker + owner).
    // Let's use two foreign keys for 1-1 chat simplicity: senderId, receiverId?
    // But standard is participants. Let's use two columns for simplicity:
    // tenantId, landlordId

    @ForeignKey(() => User)
    @Column(DataType.BIGINT)
    tenantId!: number;

    @BelongsTo(() => User, 'tenantId')
    tenant!: User;

    @ForeignKey(() => User)
    @Column(DataType.BIGINT)
    landlordId!: number;

    @BelongsTo(() => User, 'landlordId')
    landlord!: User;

    @HasMany(() => Message)
    messages!: Message[];
}
