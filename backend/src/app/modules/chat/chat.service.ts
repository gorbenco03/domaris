/**
 * 💬 CHAT SERVICE - Messaging/Conversations
 * Conform ADR-001: Model Unificat (participant1/participant2)
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Conversation } from '../../db/entities/conversation.entity';
import { Message } from '../../db/entities/message.entity';
import { Listing } from '../../db/entities/listing.entity';
import { ListingImage } from '../../db/entities/listingImage.entity';
import { User } from '../../db/entities/user.entity';
import { Op } from 'sequelize';
import Redis from 'ioredis';
import { PushNotificationService } from '../../core/push/push.service';

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
  private readonly logger = new Logger(ChatService.name);
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly pushService: PushNotificationService,
  ) {}
  // ============================================================================
  // CONVERSATIONS
  // ============================================================================

  async getUserConversations(userId: number, params: GetConversationsParams = {}) {
    const { page = 1, limit = 20, type = 'all' } = params;
    const offset = (page - 1) * limit;

    const where: any = {
      [Op.or]: [{ participant1Id: userId }, { participant2Id: userId }],
    };

    const { rows, count } = await Conversation.findAndCountAll({
      where,
      include: [
        { 
          model: Listing, 
          as: 'property',
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

    const mapped = await Promise.all(
      rows.map(async (conv) => {
        const unreadCount = await Message.count({
          where: {
            conversationId: conv.id,
            senderId: { [Op.ne]: userId },
            readAt: null,
          },
        });

        const archivedBy = Array.isArray((conv as any).archivedBy) ? (conv as any).archivedBy : [];
        const isArchived = archivedBy.includes(userId);

        return await this.formatConversation(conv, userId, {
          unreadCount,
          isArchived,
        });
      })
    );

    const filtered = mapped.filter((conv) => {
      if (type === 'archived') {
        return conv.status === 'ARCHIVED';
      }
      if (type === 'unread') {
        return conv.unreadCount > 0 && conv.status !== 'ARCHIVED';
      }
      return conv.status !== 'ARCHIVED';
    });

    const totalFiltered = filtered.length;

    return {
      data: filtered,
      meta: {
        page,
        limit,
        total: totalFiltered,
        hasMore: offset + filtered.length < totalFiltered,
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
          as: 'property',
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

    const unreadCount = await Message.count({
      where: {
        conversationId,
        senderId: { [Op.ne]: userId },
        readAt: null,
      },
    });

    const archivedBy = Array.isArray((conversation as any).archivedBy)
      ? (conversation as any).archivedBy
      : [];
    const isArchived = archivedBy.includes(userId);

    return await this.formatConversation(conversation, userId, {
      unreadCount,
      isArchived,
    });
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
    this.logger.debug(`💬 sendMessage sender=${senderId} convo=${conversationId}`);
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

    await this.notifyRecipientIfOffline(conversation, senderId, content);

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

    const archivedBy = Array.isArray((conversation as any).archivedBy)
      ? (conversation as any).archivedBy
      : [];

    if (!archivedBy.includes(userId)) {
      await conversation.update({ archivedBy: [...archivedBy, userId] });
    }

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

    const archivedBy = Array.isArray((conversation as any).archivedBy)
      ? (conversation as any).archivedBy
      : [];
    const updated = archivedBy.filter((id: number) => id !== userId);

    await conversation.update({ archivedBy: updated });

    return { success: true, message: 'Conversație dezarhivată' };
  }

  // ============================================================================
  // ONLINE STATUS
  // ============================================================================

  /**
   * Check if a user is currently online (has active socket connections)
   */
  async isUserOnline(userId: number): Promise<boolean> {
    try {
      const presence = await this.redisClient.get(`user:${userId}:presence`);
      const socketsCount = await this.redisClient.scard(`user:${userId}:sockets`);
      this.logger.debug(`📡 onlineCheck user=${userId} presence=${Boolean(presence)} sockets=${socketsCount}`);
      return Boolean(presence) && socketsCount > 0;
    } catch {
      return false;
    }
  }

  private async notifyRecipientIfOffline(
    conversation: Conversation,
    senderId: number,
    content: string,
  ) {
    const recipientId =
      conversation.participant1Id === senderId
        ? conversation.participant2Id
        : conversation.participant1Id;

    if (!recipientId) {
      return;
    }

    this.logger.debug(`🔔 notifyRecipientIfOffline sender=${senderId} recipient=${recipientId}`);

    const isOnline = await this.isUserOnline(recipientId);
    this.logger.debug(`🟢 recipient ${recipientId} online=${isOnline}`);
    if (isOnline) {
      return;
    }

    const sender = await User.findByPk(senderId, {
      attributes: ['firstName', 'lastName'],
    });

    const senderName = sender
      ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Utilizator'
      : 'Utilizator';

    await this.pushService.notifyNewMessage(
      recipientId,
      senderName,
      content || 'Ai primit un mesaj nou',
      conversation.id,
      conversation.propertyId || undefined,
    );
  }

  // ============================================================================
  // FORMATTERS
  // ============================================================================

  private async formatConversation(
    conversation: any,
    userId: number,
    options?: { unreadCount?: number; isArchived?: boolean }
  ) {
    // Determină celălalt participant (nu userId)
    // Use loose comparison or strict with Number() casting to be safe
    const otherParticipant =
      Number(conversation.participant1Id) === Number(userId)
        ? conversation.participant2 
        : conversation.participant1;

    const lastMessage = conversation.messages?.[0];
    const lastMessageCreatedAt = lastMessage?.createdAt;

    // Check if other participant is online
    const isOnline = otherParticipant ? await this.isUserOnline(otherParticipant.id) : false;

    return {
      id: conversation.id,
      property: conversation.property
        ? {
            id: conversation.property.id,
            title: conversation.property.title,
            price: conversation.property.priceEur,
            // Safe access to nested images array
            image: conversation.property.images?.[0]?.url,
          }
        : null,
      otherParticipant: otherParticipant
        ? {
            id: otherParticipant.id,
            firstName: otherParticipant.firstName,
            lastName: otherParticipant.lastName,
            avatar: otherParticipant.avatar,
            isVerified: (otherParticipant.verificationLevel || 0) >= 2,
            isOnline,
          }
        : null,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            text: lastMessage.content,
            type: lastMessage.type || 'TEXT',
            createdAt: lastMessageCreatedAt,
            sentAt: lastMessageCreatedAt,
            isFromMe: lastMessage.senderId === userId,
          }
        : null,
      unreadCount: options?.unreadCount ?? 0,
      status: options?.isArchived ? 'ARCHIVED' : 'ACTIVE',
      updatedAt: conversation.updatedAt,
    };
  }

  private formatMessage(message: any, userId: number) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      text: message.content,
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
      sentAt: message.createdAt,
      readAt: message.readAt || null,
    };
  }
}
