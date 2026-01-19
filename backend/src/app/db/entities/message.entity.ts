import {
    Table,
    Column,
    DataType,
    BelongsTo,
    ForeignKey,
} from 'sequelize-typescript';
import { ExtModel } from './extend.model';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';

@Table({
    tableName: 'messages',
    underscored: true,
    timestamps: true,
    paranoid: true,
})
export class Message extends ExtModel {
    @ForeignKey(() => Conversation)
    @Column(DataType.BIGINT)
    conversationId: number;

    @BelongsTo(() => Conversation)
    conversation: Conversation;

    @ForeignKey(() => User)
    @Column(DataType.BIGINT)
    senderId: number;

    @BelongsTo(() => User)
    sender: User;

    @Column(DataType.TEXT)
    content: string;

    @Column(DataType.DATE)
    readAt: Date | null;
}
