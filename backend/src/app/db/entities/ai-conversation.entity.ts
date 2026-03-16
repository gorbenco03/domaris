import {
    Table,
    Column,
    DataType,
    BelongsTo,
    ForeignKey,
    HasMany,
} from 'sequelize-typescript';
import { ExtModel } from './extend.model';
import { User } from './user.entity';
import { AiMessage } from './ai-message.entity';

export interface ClientProfile {
    transactionType?: 'RENT' | 'SALE';
    propertyType?: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'COMMERCIAL' | 'LAND';
    purpose?: 'personal' | 'investment' | 'relocation' | 'family';
    urgency?: 'immediate' | '1_month' | '3_months' | 'no_rush';
    conversationPhase?: 'discovery' | 'ready_to_search' | 'results_shown' | 'refining' | 'property_followup';
    budget?: { min?: number; max?: number; currency: string };
    preferences?: {
        rooms?: number;
        roomsMin?: number;
        roomsMax?: number;
        surfaceMin?: number;
        surfaceMax?: number;
        cities?: string[];
        neighborhoods?: string[];
        amenities?: string[];
        isFurnished?: boolean;
        petFriendly?: boolean;
        floorMin?: number;
        floorMax?: number;
        yearBuiltMin?: number;
        yearBuiltMax?: number;
    };
    dealbreakers?: string[];
    classificationComplete: boolean;
    classificationScore: number; // 0-100
    answeredQuestions: string[];
    lastShownListingIds?: number[];
    lastSearchFilters?: Record<string, any>;
}

@Table({
    tableName: 'ai_conversations',
    underscored: true,
    timestamps: true,
    paranoid: true,
})
export class AiConversation extends ExtModel {
    @ForeignKey(() => User)
    @Column({ type: DataType.BIGINT, allowNull: true })
    userId?: number;

    @BelongsTo(() => User)
    user?: User;

    @Column({ type: DataType.STRING, allowNull: true })
    anonymousId?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    title?: string;

    @Column({
        type: DataType.ENUM('active', 'archived', 'closed'),
        defaultValue: 'active',
    })
    status!: 'active' | 'archived' | 'closed';

    @Column({
        type: DataType.JSONB,
        defaultValue: {
            conversationPhase: 'discovery',
            classificationComplete: false,
            classificationScore: 0,
            answeredQuestions: [],
            lastShownListingIds: [],
        },
    })
    clientProfile!: ClientProfile;

    @Column({ type: DataType.DATE, allowNull: true })
    lastMessageAt?: Date;

    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    messageCount!: number;

    @HasMany(() => AiMessage)
    messages?: AiMessage[];
}
