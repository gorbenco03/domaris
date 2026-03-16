/**
 * AI Conversation Service - Persistent conversation management
 *
 * Handles:
 * - CRUD for AI conversations
 * - Message persistence (save to DB, load history)
 * - Client profile accumulation
 * - Integration with AIGatewayService for AI responses
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AiConversation, ClientProfile } from '../../../db/entities/ai-conversation.entity.js';
import { AiMessage } from '../../../db/entities/ai-message.entity.js';
import { AIGatewayService } from '../gateway/ai-gateway.service.js';
import { Op } from 'sequelize';

@Injectable()
export class AiConversationService {
  constructor(
    private readonly aiGateway: AIGatewayService,
  ) {}

  // ========================================================================
  // LIST CONVERSATIONS
  // ========================================================================

  async getConversations(userId: number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await AiConversation.findAndCountAll({
      where: {
        userId,
        status: { [Op.ne]: 'closed' },
      },
      order: [['lastMessageAt', 'DESC']],
      offset,
      limit,
      include: [{
        model: AiMessage,
        limit: 1,
        order: [['createdAt', 'DESC']],
        attributes: ['content', 'role', 'createdAt'],
      }],
    });

    return {
      data: rows.map(conv => ({
        id: conv.id,
        title: conv.title || 'Conversație nouă',
        status: conv.status,
        clientProfile: conv.clientProfile,
        lastMessageAt: conv.lastMessageAt,
        messageCount: conv.messageCount,
        lastMessage: conv.messages?.[0] ? {
          content: conv.messages[0].content.substring(0, 100),
          role: conv.messages[0].role,
        } : null,
        createdAt: conv.createdAt,
      })),
      meta: {
        page,
        limit,
        total: count,
        hasMore: offset + limit < count,
      },
    };
  }

  // ========================================================================
  // GET CONVERSATION WITH MESSAGES
  // ========================================================================

  async getConversation(conversationId: number, userId: number) {
    const conversation = await AiConversation.findByPk(conversationId, {
      include: [{
        model: AiMessage,
        order: [['createdAt', 'ASC']],
      }],
    });

    if (!conversation) {
      throw new NotFoundException('Conversație negăsită');
    }

    if (conversation.userId && conversation.userId !== userId) {
      throw new ForbiddenException('Acces interzis');
    }

    return {
      id: conversation.id,
      title: conversation.title || 'Conversație nouă',
      status: conversation.status,
      clientProfile: conversation.clientProfile,
      lastMessageAt: conversation.lastMessageAt,
      messageCount: conversation.messageCount,
      messages: (conversation.messages || []).map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata,
        createdAt: msg.createdAt,
      })),
      createdAt: conversation.createdAt,
    };
  }

  // ========================================================================
  // CREATE CONVERSATION
  // ========================================================================

  async createConversation(userId?: number, anonymousId?: string) {
    const conversation = await AiConversation.create({
      userId,
      anonymousId,
      status: 'active',
      clientProfile: {
        conversationPhase: 'discovery',
        classificationComplete: false,
        classificationScore: 0,
        answeredQuestions: [],
        lastShownListingIds: [],
      },
      messageCount: 0,
    });

    // Add welcome message
    const welcomeContent = 'Bună! Sunt RIVA, consultantul tău imobiliar.\n\nÎnainte să îți arăt proprietăți, vreau să te cunosc mai bine ca să găsesc exact ce ai nevoie.\n\nCauți să cumperi sau să închiriezi?';

    const welcomeMsg = await AiMessage.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: welcomeContent,
      metadata: {
        intent: 'greeting',
        conversationPhase: 'discovery',
        suggestedActions: [
          { type: 'quick_reply', label: 'Vreau să închiriez' },
          { type: 'quick_reply', label: 'Vreau să cumpăr' },
        ],
      },
    });

    await conversation.update({
      messageCount: 1,
      lastMessageAt: new Date(),
    });

    return {
      id: conversation.id,
      title: 'Conversație nouă',
      status: conversation.status,
      clientProfile: conversation.clientProfile,
      messages: [{
        id: welcomeMsg.id,
        role: welcomeMsg.role,
        content: welcomeMsg.content,
        metadata: welcomeMsg.metadata,
        createdAt: welcomeMsg.createdAt,
      }],
      createdAt: conversation.createdAt,
    };
  }

  // ========================================================================
  // SEND MESSAGE (core method)
  // ========================================================================

  async sendMessage(conversationId: number, message: string, userId?: number) {
    const conversation = await AiConversation.findByPk(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversație negăsită');
    }

    if (conversation.userId && userId && conversation.userId !== userId) {
      throw new ForbiddenException('Acces interzis');
    }

    // 1. Save user message to DB
    const userMsg = await AiMessage.create({
      conversationId,
      role: 'user',
      content: message,
      metadata: {},
    });

    // 2. Load recent messages for context (last 12)
    const recentMessages = await AiMessage.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
      limit: 12,
      offset: Math.max(0, conversation.messageCount - 11), // get last 12 including the new one
    });

    const messageHistory = recentMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: m.createdAt,
      metadata: m.metadata,
    }));

    // 3. Send to AI Gateway with client profile context
    const aiResponse = await this.aiGateway.chatWithProfile({
      message,
      conversationId: String(conversationId),
      userId: conversation.userId,
      clientProfile: conversation.clientProfile,
      messageHistory,
      contextOptions: {
        tone: 'friendly',
        language: 'ro',
        maxResults: 5,
      },
    });

    // 4. Update client profile if AI extracted new info
    const updatedProfile = aiResponse.clientProfileUpdate
      ? this.mergeClientProfile(conversation.clientProfile, aiResponse.clientProfileUpdate)
      : conversation.clientProfile;

    if (aiResponse.clientProfileUpdate) {
      await conversation.update({ clientProfile: updatedProfile });
    }

    // 5. Save assistant response to DB
    const assistantMsg = await AiMessage.create({
      conversationId,
      role: 'assistant',
      content: aiResponse.message,
      metadata: {
        intent: aiResponse.intent?.type,
        tier: aiResponse.debug?.tier,
        toolsUsed: aiResponse.toolsUsed,
        propertiesShown: aiResponse.properties?.map((p: any) => p.id),
        propertyCards: aiResponse.properties,
        suggestedActions: aiResponse.suggestedActions,
        clientProfileUpdate: aiResponse.clientProfileUpdate,
        conversationPhase: updatedProfile.conversationPhase,
        latencyMs: aiResponse.debug?.latencyMs,
      },
    });

    // 6. Update conversation metadata
    const title = conversation.title || this.generateTitle(message);
    await conversation.update({
      messageCount: conversation.messageCount + 2, // user + assistant
      lastMessageAt: new Date(),
      title,
    });

    return {
      userMessage: {
        id: userMsg.id,
        role: 'user',
        content: message,
        createdAt: userMsg.createdAt,
      },
      assistantMessage: {
        id: assistantMsg.id,
        role: 'assistant',
        content: aiResponse.message,
        metadata: assistantMsg.metadata,
        createdAt: assistantMsg.createdAt,
      },
      properties: aiResponse.properties,
      clientProfile: updatedProfile,
      suggestedActions: aiResponse.suggestedActions,
      debug: aiResponse.debug,
    };
  }

  // ========================================================================
  // ARCHIVE CONVERSATION
  // ========================================================================

  async archiveConversation(conversationId: number, userId: number) {
    const conversation = await AiConversation.findByPk(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversație negăsită');
    }

    if (conversation.userId && conversation.userId !== userId) {
      throw new ForbiddenException('Acces interzis');
    }

    await conversation.update({ status: 'archived' });
    return { success: true };
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  private generateTitle(firstMessage: string): string {
    // Generate a short title from the first user message
    const cleaned = firstMessage.replace(/[^\w\sîăâșțĂÎÂȘȚ]/g, '').trim();
    if (cleaned.length <= 40) return cleaned;
    return cleaned.substring(0, 37) + '...';
  }

  private mergeClientProfile(
    existing: ClientProfile,
    update: Partial<ClientProfile>,
  ): ClientProfile {
    const merged: ClientProfile = {
      ...existing,
      conversationPhase: existing.conversationPhase || 'discovery',
      classificationComplete: existing.classificationComplete || false,
      classificationScore: existing.classificationScore || 0,
      answeredQuestions: [...(existing.answeredQuestions || [])],
      lastShownListingIds: [...(existing.lastShownListingIds || [])],
      lastSearchFilters: existing.lastSearchFilters,
    };

    if (update.transactionType) merged.transactionType = update.transactionType;
    if (update.propertyType) merged.propertyType = update.propertyType;
    if (update.purpose) merged.purpose = update.purpose;
    if (update.urgency) merged.urgency = update.urgency;
    if (update.conversationPhase) merged.conversationPhase = update.conversationPhase;

    if (update.budget) {
      merged.budget = { ...merged.budget, ...update.budget, currency: 'EUR' };
    }

    if (update.preferences) {
      merged.preferences = {
        ...merged.preferences,
        ...update.preferences,
        cities: this.mergeStringArrays(merged.preferences?.cities, update.preferences.cities),
        neighborhoods: this.mergeStringArrays(merged.preferences?.neighborhoods, update.preferences.neighborhoods),
        amenities: this.mergeStringArrays(merged.preferences?.amenities, update.preferences.amenities),
      };
    }

    if (update.dealbreakers) {
      merged.dealbreakers = this.mergeStringArrays(merged.dealbreakers, update.dealbreakers);
    }

    if (update.answeredQuestions) {
      merged.answeredQuestions = this.mergeStringArrays(
        merged.answeredQuestions,
        update.answeredQuestions,
      ) || [];
    }

    if (update.lastShownListingIds) {
      merged.lastShownListingIds = [
        ...new Set([...(merged.lastShownListingIds || []), ...update.lastShownListingIds]),
      ].slice(-20);
    }

    if (update.lastSearchFilters) {
      merged.lastSearchFilters = {
        ...(merged.lastSearchFilters || {}),
        ...update.lastSearchFilters,
      };
    }

    // Recalculate classification score
    merged.classificationScore = this.calculateClassificationScore(merged);
    merged.classificationComplete =
      update.classificationComplete === true ||
      merged.classificationComplete === true ||
      this.hasMinimumSearchCriteria(merged) ||
      merged.classificationScore >= 70;

    if (!update.conversationPhase) {
      merged.conversationPhase = this.deriveConversationPhase(merged);
    }

    return merged;
  }

  private calculateClassificationScore(profile: ClientProfile): number {
    let score = 0;

    // Core (required for search)
    if (profile.transactionType) score += 15;
    if (profile.budget?.max || profile.budget?.min) score += 15;
    if (profile.preferences?.cities?.length) score += 12;

    // Important details
    if (profile.propertyType) score += 8;
    if (profile.preferences?.rooms || profile.preferences?.roomsMin) score += 8;
    if (profile.preferences?.neighborhoods?.length) score += 6;
    if (profile.preferences?.amenities?.length) score += 6;
    if (profile.preferences?.surfaceMin || profile.preferences?.surfaceMax) score += 5;
    if (profile.preferences?.floorMin !== undefined || profile.preferences?.floorMax !== undefined) score += 5;
    if (profile.preferences?.isFurnished !== undefined) score += 4;
    if (profile.preferences?.petFriendly !== undefined) score += 3;
    if (profile.preferences?.yearBuiltMin || profile.preferences?.yearBuiltMax) score += 4;

    // Nice to have
    if (profile.purpose) score += 4;
    if (profile.urgency) score += 4;
    if (profile.dealbreakers?.length) score += 5;

    return Math.min(100, score);
  }

  private hasMinimumSearchCriteria(profile: ClientProfile): boolean {
    return Boolean(
      profile.transactionType &&
      profile.preferences?.cities?.length &&
      (profile.budget?.max !== undefined || profile.budget?.min !== undefined),
    );
  }

  private deriveConversationPhase(profile: ClientProfile): ClientProfile['conversationPhase'] {
    if (!this.hasMinimumSearchCriteria(profile)) {
      return 'discovery';
    }

    if (profile.lastShownListingIds?.length) {
      return 'results_shown';
    }

    return 'ready_to_search';
  }

  private mergeStringArrays(
    existing?: string[],
    update?: string[],
  ): string[] | undefined {
    const merged = [...(existing || []), ...(update || [])]
      .map(value => value?.trim())
      .filter(Boolean);

    if (merged.length === 0) return undefined;
    return [...new Set(merged)];
  }

  // ========================================================================
  // GET OR CREATE ACTIVE CONVERSATION
  // ========================================================================

  async getOrCreateActive(userId?: number, anonymousId?: string) {
    // Try to find the most recent active conversation
    const where: any = { status: 'active' };
    if (userId) {
      where.userId = userId;
    } else if (anonymousId) {
      where.anonymousId = anonymousId;
    } else {
      // No user info - create new
      return this.createConversation();
    }

    const existing = await AiConversation.findOne({
      where,
      order: [['lastMessageAt', 'DESC']],
    });

    if (existing) {
      return this.getConversation(existing.id, userId || 0);
    }

    return this.createConversation(userId, anonymousId);
  }
}
