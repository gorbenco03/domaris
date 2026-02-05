import {
    Table,
    Column,
    DataType,
    BelongsTo,
    ForeignKey,
} from 'sequelize-typescript';
import { ExtModel } from './extend.model';
import { AiConversation } from './ai-conversation.entity';

export interface AiMessageMetadata {
    intent?: string;
    tier?: number;
    toolsUsed?: string[];
    propertiesShown?: number[];
    suggestedActions?: Array<{
        type: string;
        label: string;
        payload?: Record<string, any>;
    }>;
    clientProfileUpdate?: Record<string, any>;
    latencyMs?: number;
}

@Table({
    tableName: 'ai_messages',
    underscored: true,
    timestamps: true,
})
export class AiMessage extends ExtModel {
    @ForeignKey(() => AiConversation)
    @Column({ type: DataType.BIGINT, allowNull: false })
    conversationId!: number;

    @BelongsTo(() => AiConversation)
    conversation?: AiConversation;

    @Column({
        type: DataType.ENUM('user', 'assistant', 'system'),
        allowNull: false,
    })
    role!: 'user' | 'assistant' | 'system';

    @Column({ type: DataType.TEXT, allowNull: false })
    content!: string;

    @Column({
        type: DataType.JSONB,
        defaultValue: {},
    })
    metadata!: AiMessageMetadata;
}
