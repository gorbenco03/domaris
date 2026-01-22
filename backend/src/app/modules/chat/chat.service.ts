/**
 * 💬 CHAT SERVICE - Messaging/Conversations
 * Conform ADR-001: Model Unificat (participant1/participant2)
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Conversation } from '../../db/entities/conversation.entity';
import { Message } from '../../db/entities/message.entity';
import { Listing } from '../../db/entities/listing.entity';
import { ListingImage } from '../../db/entities/listingImage.entity';
import { User } from '../../db/entities/user.entity';
import { Op } from 'sequelize';

interface GetConversationsParams {
  type?: 'all' | 'unread' | 'archived';
  page?: number;
  limit?: number;
}

interface GetMessagesParams {
  before?: Date;
  limit?: number;
}

@Injectable()
export class ChatService {
  // ============================================================================
  // CONVERSATIONS
  // ============================================================================

  async getUserConversations(userId: number, params: GetConversationsParams = {}) {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const where: any = {
      [Op.or]: [{ participant1Id: userId }, { participant2Id: userId }],
    };

    // Note: archived/unread would need additional columns in Conversation entity
    // For now, return all

    const { rows, count } = await Conversation.findAndCountAll({
      where,
      include: [
        { 
          model: Listing, 
          attributes: ['id', 'title', 'priceEur'],
          include: [{ model: ListingImage, as: 'images', attributes: ['url'], limit: 1 }]
        },
        { model: User, as: 'participant1', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: User, as: 'participant2', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: Message, limit: 1, order: [['createdAt', 'DESC']] },
      ],
      order: [['updatedAt', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows.map((conv) => this.formatConversation(conv, userId)),
      meta: {
        page,
        limit,
        total: count,
        hasMore: offset + rows.length < count,
      },
    };
  }

  async getUnreadCount(userId: number) {
    // Determine all conversations user is part of
    const conversations = await Conversation.findAll({
      attributes: ['id'],
      where: {
        [Op.or]: [{ participant1Id: userId }, { participant2Id: userId }],
      },
    });

    const conversationIds = conversations.map(c => c.id);

    if (conversationIds.length === 0) {
      return { count: 0 };
    }

    // Count messages in these conversations:
    // - where sender is NOT the current user
    // - readAt is null
    const count = await Message.count({
      where: {
        conversationId: { [Op.in]: conversationIds },
        senderId: { [Op.ne]: userId },
        readAt: null,
      },
    });

    return { count };
  }

  async getConversation(userId: number, conversationId: number) {
    const conversation = await Conversation.findByPk(conversationId, {
      include: [
        { 
          model: Listing, 
          attributes: ['id', 'title', 'priceEur', 'ownerId'],
          include: [{ model: ListingImage, as: 'images', attributes: ['url'], limit: 1 }]
        },
        { model: User, as: 'participant1', attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationLevel'] },
        { model: User, as: 'participant2', attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationLevel'] },
      ],
    });

    if (!conversation) {
      throw new NotFoundException('Conversație negăsită');
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Acces interzis');
    }

    return this.formatConversation(conversation, userId);
  }

  async startConversation(userId: number, propertyId: number, initialMessage?: string) {
    const listing = await Listing.findByPk(propertyId);
    if (!listing) {
      throw new NotFoundException('Proprietate negăsită');
    }

    const ownerId = listing.ownerId;
    if (!ownerId) {
      throw new NotFoundException('Proprietarul nu a fost găsit');
    }

    if (ownerId === userId) {
      throw new ForbiddenException('Nu poți contacta propria proprietate');
    }

    // Check if conversation exists (either direction)
    let conversation = await Conversation.findOne({
      where: {
        propertyId,
        [Op.or]: [
          { participant1Id: userId, participant2Id: ownerId },
          { participant1Id: ownerId, participant2Id: userId },
        ],
      },
    });

    if (!conversation) {
      // Create new conversation: userId is participant1 (initiator), ownerId is participant2
      conversation = await Conversation.create({
        propertyId,
        participant1Id: userId,
        participant2Id: ownerId,
      });
    }

    if (initialMessage) {
      await this.sendMessage(userId, conversation.id, initialMessage);
    }

    return this.getConversation(userId, conversation.id);
  }

  // ============================================================================
  // MESSAGES
  // ============================================================================

  async getMessages(userId: number, conversationId: number, params: GetMessagesParams = {}) {
    const { before, limit = 50 } = params;

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversație negăsită');
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Acces interzis');
    }

    const where: any = { conversationId };
    if (before) {
      where.createdAt = { [Op.lt]: before };
    }

    const messages = await Message.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      ],
    });

    // Return in chronological order
    return {
      data: messages.reverse().map((msg) => this.formatMessage(msg, userId)),
      hasMore: messages.length === limit,
    };
  }

  async sendMessage(
    senderId: number,
    conversationId: number,
    content: string,
    type: string = 'TEXT',
  ) {
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversație negăsită');
    }

    if (conversation.participant1Id !== senderId && conversation.participant2Id !== senderId) {
      throw new ForbiddenException('Acces interzis');
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
      type,
    });

    // Update conversation timestamp
    conversation.changed('updatedAt', true);
    await conversation.save();

    return this.formatMessage(message, senderId);
  }

  // ============================================================================
  // CONVERSATION ACTIONS
  // ============================================================================

  async markAsRead(userId: number, conversationId: number) {
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversație negăsită');
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Acces interzis');
    }

    // Update all messages in this conversation where:
    // - sender is NOT current user
    // - readAt is null
    await Message.update(
      { readAt: new Date() },
      {
        where: {
          conversationId,
          senderId: { [Op.ne]: userId },
          readAt: null,
        },
      },
    );

    return { success: true };
  }

  async archiveConversation(userId: number, conversationId: number) {
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversație negăsită');
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Acces interzis');
    }

    // TODO: Implement archive functionality
    return { success: true, message: 'Conversație arhivată' };
  }

  async unarchiveConversation(userId: number, conversationId: number) {
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversație negăsită');
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Acces interzis');
    }

    // TODO: Implement unarchive functionality
    return { success: true, message: 'Conversație dezarhivată' };
  }

  // ============================================================================
  // FORMATTERS
  // ============================================================================

  private formatConversation(conversation: any, userId: number) {
    // Determină celălalt participant (nu userId)
    // Use loose comparison or strict with Number() casting to be safe
    const otherParticipant =
      Number(conversation.participant1Id) === Number(userId)
        ? conversation.participant2 
        : conversation.participant1;

    return {
      id: conversation.id,
      property: conversation.listing
        ? {
            id: conversation.listing.id,
            title: conversation.listing.title,
            price: conversation.listing.priceEur,
            // Safe access to nested images array
            image: conversation.listing.images?.[0]?.url,
          }
        : null,
      otherParticipant: otherParticipant
        ? {
            id: otherParticipant.id,
            firstName: otherParticipant.firstName,
            lastName: otherParticipant.lastName,
            avatar: otherParticipant.avatar,
            isVerified: (otherParticipant.verificationLevel || 0) >= 2,
          }
        : null,
      lastMessage: conversation.messages?.[0]
        ? {
            content: conversation.messages[0].content,
            createdAt: conversation.messages[0].createdAt,
            isFromMe: conversation.messages[0].senderId === userId,
          }
        : null,
      updatedAt: conversation.updatedAt,
    };
  }

  private formatMessage(message: any, userId: number) {
    return {
      id: message.id,
      content: message.content,
      type: message.type || 'TEXT',
      isFromMe: message.senderId === userId,
      sender: message.sender
        ? {
            id: message.sender.id,
            firstName: message.sender.firstName,
            lastName: message.sender.lastName,
            avatar: message.sender.avatar,
          }
        : null,
      createdAt: message.createdAt,
    };
  }
}
