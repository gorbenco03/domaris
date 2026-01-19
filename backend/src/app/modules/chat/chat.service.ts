import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Conversation } from '../../db/entities/conversation.entity';
import { Message } from '../../db/entities/message.entity';
import { Listing } from '../../db/entities/listing.entity';
import { User } from '../../db/entities/user.entity';
import { Op } from 'sequelize';

@Injectable()
export class ChatService {
    async getUserConversations(userId: number) {
        return Conversation.findAll({
            where: {
                [Op.or]: [{ tenantId: userId }, { landlordId: userId }],
            },
            include: [
                { model: Listing, attributes: ['id', 'title', 'priceEur'] },
                { model: User, as: 'tenant', attributes: ['id', 'firstName', 'lastName'] },
                { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName'] },
                { model: Message, limit: 1, order: [['createdAt', 'DESC']] }
            ],
            order: [['updatedAt', 'DESC']],
        });
    }

    async startConversation(userId: number, propertyId: number, initialMessage?: string) {
        const listing = await Listing.findByPk(propertyId);
        if (!listing) throw new NotFoundException('Property not found');

        const landlordId = listing.ownerId || 0; // fallback if null, essentially error

        // Check if exists
        let conversation = await Conversation.findOne({
            where: {
                propertyId,
                tenantId: userId,
                landlordId,
            }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                propertyId,
                tenantId: userId,
                landlordId,
            });
        }

        if (initialMessage) {
            await this.sendMessage(userId, conversation.id, initialMessage);
        }

        return conversation;
    }

    async getMessages(userId: number, conversationId: number) {
        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) throw new NotFoundException('Conversation not found');

        if (conversation.tenantId != userId && conversation.landlordId != userId) {
            throw new ForbiddenException('Access denied');
        }

        return Message.findAll({
            where: { conversationId },
            order: [['createdAt', 'ASC']],
            include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }]
        });
    }

    async sendMessage(senderId: number, conversationId: number, content: string) {
        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) throw new NotFoundException('Conversation not found');

        if (conversation.tenantId != senderId && conversation.landlordId != senderId) {
            throw new ForbiddenException('Access denied');
        }

        const message = await Message.create({
            conversationId,
            senderId,
            content,
        });

        // Update conversation timestamp
        conversation.changed('updatedAt', true);
        await conversation.save();

        return message;
    }
}
