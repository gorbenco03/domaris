import {
    Table,
    Column,
    DataType,
    BelongsTo,
    HasMany,
    ForeignKey,
} from 'sequelize-typescript';
import { ExtModel } from './extend.model';
import { User } from './user.entity';
import { Listing } from './listing.entity';
import { Message } from './message.entity';

/**
 * 💬 Conversation Entity - Conform ADR-001: Model Unificat
 * 
 * Conversație între doi utilizatori despre o proprietate.
 * Nu mai folosim "tenant/landlord" - orice utilizator poate fi în orice rol.
 * 
 * participant1 = utilizatorul care a inițiat conversația (de obicei cel interesat)
 * participant2 = celălalt participant (de obicei owner-ul proprietății)
 */
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

    // Participant 1 (de obicei cel care inițiază conversația)
    @ForeignKey(() => User)
    @Column(DataType.BIGINT)
    participant1Id!: number;

    @BelongsTo(() => User, 'participant1Id')
    participant1!: User;

    // Participant 2 (de obicei owner-ul proprietății)
    @ForeignKey(() => User)
    @Column(DataType.BIGINT)
    participant2Id!: number;

    @BelongsTo(() => User, 'participant2Id')
    participant2!: User;

    @HasMany(() => Message)
    messages!: Message[];
}

