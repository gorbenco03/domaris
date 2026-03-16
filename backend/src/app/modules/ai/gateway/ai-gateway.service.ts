/**
 * AI Gateway Service - Central orchestration layer for all AI operations
 * 
 * Responsibilities:
 * - Multi-tier routing (Tier 0/1/2)
 * - Tool orchestration
 * - Conversation state management
 * - Response generation
 * - Telemetry & cost tracking
 * - PII redaction
 */

import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { IntentRouter } from '../router/intent-router.js';
import { ToolExecutor } from '../tools/executor.js';
import { ValuationEngine } from '../avm/valuation-engine.js';
import { getToolsForOpenAI } from '../tools/definitions.js';
import {
  ConversationState,
  UserPreferences,
  AgentResponse,
  Intent,
  ToolCall,
  ToolResult,
  AIDecisionLog,
  AVMInput,
  AVMResult,
  AVMExplanation,
  ConversationMessage,
} from '../types/index.js';
import type { ClientProfile } from '../../../db/entities/ai-conversation.entity.js';

interface ChatInput {
  message: string;
  conversationId?: string;
  userId?: number;
  contextOptions?: {
    tone?: 'professional' | 'friendly' | 'concise';
    language?: 'ro' | 'en';
    maxResults?: number;
    userPreferences?: Partial<UserPreferences>;
  };
}

export interface ChatWithProfileInput {
  message: string;
  conversationId: string;
  userId?: number;
  clientProfile: ClientProfile;
  messageHistory: ConversationMessage[];
  contextOptions?: ChatInput['contextOptions'];
}

export interface ChatWithProfileResponse extends AgentResponse {
  clientProfileUpdate?: Partial<ClientProfile>;
}

@Injectable()
export class AIGatewayService {
  private readonly logger = new Logger(AIGatewayService.name);
  private openai: OpenAI | null = null;
  private readonly strongModel = 'gpt-4o';
  private readonly cheapModel = 'gpt-4o-mini';

  // In-memory conversation state (would be Redis in production)
  private readonly conversationStates = new Map<string, ConversationState>();
  private readonly decisionLogs: AIDecisionLog[] = [];

  constructor(
    private readonly intentRouter: IntentRouter,
    private readonly toolExecutor: ToolExecutor,
    private readonly valuationEngine: ValuationEngine,
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('AI Gateway initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not set - AI features limited');
    }
  }

  // ========================================================================
  // MAIN CHAT ENDPOINT
  // ========================================================================

  async chat(input: ChatInput): Promise<AgentResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();

    // Get or create conversation state
    const conversationId = input.conversationId || uuidv4();
    let state = this.getOrCreateState(conversationId, input.userId, input.contextOptions?.userPreferences);

    // Add user message to state
    state.messages.push({
      role: 'user',
      content: input.message,
      timestamp: new Date(),
    });

    try {
      // Step 1: Route the intent (Tier 0 → Tier 1 → Tier 2)
      const routerResult = await this.intentRouter.route(input.message, state);
      const intent = routerResult.intent;

      this.logger.debug(`Intent: ${intent.type} (tier ${intent.tier}, conf ${intent.confidence})`);

      // Step 2: Update preferences from extracted slots
      this.updatePreferencesFromSlots(state, intent);

      // Step 3: Generate response based on tier
      let response: AgentResponse;

      if (intent.tier === 0 && !intent.requiresLLM) {
        // Tier 0: Deterministic response
        response = await this.handleTier0(state, intent, input);
      } else if (intent.tier === 1 && !routerResult.shouldEscalate) {
        // Tier 1: Cheap model with tools
        response = await this.handleTier1(state, intent, input);
      } else {
        // Tier 2: Strong model for complex reasoning
        response = await this.handleTier2(state, intent, input);
      }

      // Add assistant response to state
      state.messages.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      });

      state.lastIntent = intent;
      state.updatedAt = new Date();

      // Log decision
      this.logDecision({
        requestId,
        userId: input.userId,
        conversationId,
        tierUsed: intent.tier,
        intent: intent.type,
        toolsCalled: response.toolsUsed,
        latencyMs: Date.now() - startTime,
        cached: false,
        timestamp: new Date(),
      });

      return {
        ...response,
        conversationId,
        debug: {
          tier: intent.tier,
          latencyMs: Date.now() - startTime,
          cached: false,
        },
      };
    } catch (error: any) {
      this.logger.error(`Chat error: ${error.message}`, error.stack);

      return {
        conversationId,
        message: 'Îmi pare rău, a apărut o eroare. Te rog să încerci din nou.',
        intent: { type: 'unclear', confidence: 0, slots: {}, requiresLLM: false, tier: 0 },
        toolsUsed: [],
        debug: {
          tier: 0,
          latencyMs: Date.now() - startTime,
          cached: false,
        },
      };
    }
  }

  // ========================================================================
  // CHAT WITH PROFILE (persistent conversations)
  // ========================================================================

  async chatWithProfile(input: ChatWithProfileInput): Promise<ChatWithProfileResponse> {
    const startTime = Date.now();
    const state = this.getOrCreateState(input.conversationId, input.userId);
    this.restoreStateFromProfile(state, input.clientProfile, input.messageHistory);

    try {
      const routerResult = await this.intentRouter.route(input.message, state);
      const intent = routerResult.intent;
      this.updatePreferencesFromSlots(state, intent);

      const intentProfileUpdate = this.extractProfileUpdate(intent, input.message, input.clientProfile);
      const hasMinimumCriteriaNow = this.hasMinimumCriteriaWithUpdate(
        input.clientProfile,
        intentProfileUpdate,
      );

      if (!input.clientProfile.classificationComplete && !hasMinimumCriteriaNow) {
        const classificationResponse = await this.handleClassificationChat(
          input,
          state.preferences,
          startTime,
        );

        this.captureShownProperties(state, classificationResponse.properties);
        state.messages.push({
          role: 'assistant',
          content: classificationResponse.message,
          timestamp: new Date(),
          metadata: {
            suggestedActions: classificationResponse.suggestedActions,
            propertyCards: classificationResponse.properties,
            toolsUsed: classificationResponse.toolsUsed,
          },
        });

        const classificationProfileUpdate = this.buildFinalProfileUpdate(
          input.clientProfile,
          classificationResponse.intent,
          classificationResponse.properties,
          classificationResponse.toolsUsed,
          state,
          this.mergeProfileUpdates(intentProfileUpdate, classificationResponse.clientProfileUpdate),
        );

        this.logDecision({
          requestId: uuidv4(),
          userId: input.userId,
          conversationId: input.conversationId,
          tierUsed: classificationResponse.intent.tier,
          intent: classificationResponse.intent.type,
          toolsCalled: classificationResponse.toolsUsed,
          latencyMs: Date.now() - startTime,
          cached: false,
          timestamp: new Date(),
        });

        return {
          ...classificationResponse,
          conversationId: input.conversationId,
          clientProfileUpdate: classificationProfileUpdate,
        };
      }

      if (!input.clientProfile.classificationComplete && hasMinimumCriteriaNow) {
        intentProfileUpdate.classificationComplete = true;
        intentProfileUpdate.conversationPhase = input.clientProfile.lastShownListingIds?.length
          ? 'results_shown'
          : 'ready_to_search';
      }

      let response: AgentResponse;
      if (intent.tier === 0 && !intent.requiresLLM && ['greeting', 'thanks', 'help'].includes(intent.type)) {
        response = await this.handleTier0(state, intent, {
          message: input.message,
          conversationId: input.conversationId,
          userId: input.userId,
          contextOptions: input.contextOptions,
        });
      } else if (routerResult.shouldEscalate || intent.tier === 2) {
        response = await this.handleProfileTier2(state, intent, input, input.clientProfile);
      } else {
        response = await this.handleProfileTier1(state, intent, input, input.clientProfile);
      }

      this.captureShownProperties(state, response.properties);
      state.messages.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: {
          suggestedActions: response.suggestedActions,
          propertyCards: response.properties,
          toolsUsed: response.toolsUsed,
        },
      });
      state.lastIntent = intent;
      state.updatedAt = new Date();

      const profileUpdate = this.buildFinalProfileUpdate(
        input.clientProfile,
        intent,
        response.properties,
        response.toolsUsed,
        state,
        intentProfileUpdate,
      );

      this.logDecision({
        requestId: uuidv4(),
        userId: input.userId,
        conversationId: input.conversationId,
        tierUsed: intent.tier,
        intent: intent.type,
        toolsCalled: response.toolsUsed,
        latencyMs: Date.now() - startTime,
        cached: false,
        timestamp: new Date(),
      });

      return {
        ...response,
        conversationId: input.conversationId,
        clientProfileUpdate: profileUpdate,
        debug: {
          tier: intent.tier,
          latencyMs: Date.now() - startTime,
          cached: false,
        },
      };
    } catch (error: any) {
      this.logger.error(`Profile chat error: ${error.message}`, error.stack);

      return {
        conversationId: input.conversationId,
        message: 'Îmi pare rău, a apărut o eroare. Te rog să încerci din nou.',
        intent: { type: 'unclear', confidence: 0, slots: {}, requiresLLM: false, tier: 0 },
        toolsUsed: [],
        debug: {
          tier: 0,
          latencyMs: Date.now() - startTime,
          cached: false,
        },
      };
    }
  }

  private restoreStateFromProfile(
    state: ConversationState,
    clientProfile: ClientProfile,
    messageHistory: ConversationMessage[],
  ): void {
    state.preferences = this.buildPreferencesFromClientProfile(clientProfile);
    state.messages = [...messageHistory];
    state.lastShownProperties = this.extractLastShownProperties(messageHistory);
    state.shownListingIds = [
      ...(clientProfile.lastShownListingIds || []),
      ...(state.lastShownProperties?.map(property => property.id) || []),
    ].filter((value, index, arr) => arr.indexOf(value) === index);
    state.updatedAt = new Date();
  }

  private buildPreferencesFromClientProfile(clientProfile: ClientProfile): UserPreferences {
    return {
      transactionType: clientProfile.transactionType,
      propertyType: clientProfile.propertyType,
      cities: clientProfile.preferences?.cities,
      neighborhoods: clientProfile.preferences?.neighborhoods,
      priceMin: clientProfile.budget?.min,
      priceMax: clientProfile.budget?.max,
      roomsMin: clientProfile.preferences?.rooms ?? clientProfile.preferences?.roomsMin,
      roomsMax: clientProfile.preferences?.rooms ?? clientProfile.preferences?.roomsMax,
      surfaceMin: clientProfile.preferences?.surfaceMin,
      surfaceMax: clientProfile.preferences?.surfaceMax,
      mustHave: clientProfile.preferences?.amenities,
      dealbreakers: clientProfile.dealbreakers,
      isFurnished: clientProfile.preferences?.isFurnished,
      petFriendly: clientProfile.preferences?.petFriendly,
      floorMin: clientProfile.preferences?.floorMin,
      floorMax: clientProfile.preferences?.floorMax,
      yearBuiltMin: clientProfile.preferences?.yearBuiltMin,
      yearBuiltMax: clientProfile.preferences?.yearBuiltMax,
      confidence: {},
      lastUpdated: new Date(),
    };
  }

  private extractLastShownProperties(messageHistory: ConversationMessage[]): any[] | undefined {
    for (let index = messageHistory.length - 1; index >= 0; index--) {
      const message = messageHistory[index];
      const propertyCards = message.metadata?.propertyCards;
      if (Array.isArray(propertyCards) && propertyCards.length > 0) {
        return propertyCards;
      }
    }

    return undefined;
  }

  private captureShownProperties(state: ConversationState, properties?: any[]): void {
    if (!properties?.length) {
      return;
    }

    state.lastShownProperties = properties;
    state.shownListingIds = [
      ...state.shownListingIds,
      ...properties.map(property => property.id),
    ].filter((value, index, arr) => arr.indexOf(value) === index).slice(-30);
  }

  private mergeProfileUpdates(
    ...updates: Array<Partial<ClientProfile> | undefined>
  ): Partial<ClientProfile> | undefined {
    const merged: Partial<ClientProfile> = {};

    for (const update of updates) {
      if (!update) continue;

      if (update.transactionType) merged.transactionType = update.transactionType;
      if (update.propertyType) merged.propertyType = update.propertyType;
      if (update.purpose) merged.purpose = update.purpose;
      if (update.urgency) merged.urgency = update.urgency;
      if (update.conversationPhase) merged.conversationPhase = update.conversationPhase;
      if (update.classificationComplete !== undefined) {
        merged.classificationComplete = update.classificationComplete;
      }

      if (update.budget) {
        merged.budget = {
          ...(merged.budget || {}),
          ...update.budget,
          currency: update.budget.currency || merged.budget?.currency || 'EUR',
        };
      }

      if (update.preferences) {
        merged.preferences = {
          ...(merged.preferences || {}),
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
          ...(merged.lastShownListingIds || []),
          ...update.lastShownListingIds,
        ].filter((value, index, arr) => arr.indexOf(value) === index).slice(-20);
      }

      if (update.lastSearchFilters) {
        merged.lastSearchFilters = {
          ...(merged.lastSearchFilters || {}),
          ...update.lastSearchFilters,
        };
      }
    }

    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  private buildFinalProfileUpdate(
    currentProfile: ClientProfile,
    intent: Intent,
    properties: any[] | undefined,
    toolsUsed: string[],
    state: ConversationState,
    baseUpdate?: Partial<ClientProfile>,
  ): Partial<ClientProfile> | undefined {
    const profileUpdate = this.mergeProfileUpdates(baseUpdate) || {};
    const propertyIds = properties?.map(property => property.id) || [];

    if (propertyIds.length > 0) {
      profileUpdate.lastShownListingIds = propertyIds;
    }

    if (toolsUsed.includes('search_properties')) {
      profileUpdate.classificationComplete = true;
      profileUpdate.lastSearchFilters = this.buildSearchFilterSnapshot(intent, state.preferences);
    }

    const hasMinimumCriteria = this.hasMinimumCriteriaWithUpdate(currentProfile, profileUpdate);

    if (toolsUsed.includes('get_property_details') || intent.type === 'details' || intent.type === 'schedule') {
      profileUpdate.conversationPhase = 'property_followup';
    } else if (propertyIds.length > 0 || toolsUsed.includes('search_properties')) {
      profileUpdate.conversationPhase = 'results_shown';
    } else if (!hasMinimumCriteria) {
      profileUpdate.conversationPhase = 'discovery';
    } else if (intent.type === 'refine') {
      profileUpdate.conversationPhase = 'refining';
    } else {
      profileUpdate.conversationPhase = 'ready_to_search';
    }

    if (hasMinimumCriteria) {
      profileUpdate.classificationComplete = true;
    }

    return Object.keys(profileUpdate).length > 0 ? profileUpdate : undefined;
  }

  private buildSearchFilterSnapshot(
    intent: Intent,
    preferences: UserPreferences,
  ): Record<string, any> {
    const snapshot = {
      transactionType: intent.slots.transactionType || preferences.transactionType,
      city: intent.slots.city || preferences.cities?.[0],
      neighborhood: intent.slots.neighborhood || preferences.neighborhoods?.[0],
      priceMin: intent.slots.priceMin ?? preferences.priceMin,
      priceMax: intent.slots.priceMax ?? preferences.priceMax,
      roomsMin: intent.slots.roomsMin ?? intent.slots.rooms ?? preferences.roomsMin,
      roomsMax: intent.slots.roomsMax ?? intent.slots.rooms ?? preferences.roomsMax,
      surfaceMin: intent.slots.surfaceMin ?? preferences.surfaceMin,
      surfaceMax: intent.slots.surfaceMax ?? preferences.surfaceMax,
      propertyType: intent.slots.propertyType || preferences.propertyType,
      isFurnished: intent.slots.isFurnished ?? preferences.isFurnished,
      petFriendly: intent.slots.petFriendly ?? preferences.petFriendly,
      floorMin: intent.slots.floorMin ?? preferences.floorMin,
      floorMax: intent.slots.floorMax ?? preferences.floorMax,
      yearBuiltMin: intent.slots.yearBuiltMin ?? preferences.yearBuiltMin,
      yearBuiltMax: intent.slots.yearBuiltMax ?? preferences.yearBuiltMax,
      amenities: intent.slots.amenities?.length ? intent.slots.amenities : preferences.mustHave,
      sortBy: intent.slots.sortBy || 'relevance',
    };

    return Object.fromEntries(
      Object.entries(snapshot).filter(([, value]) => value !== undefined && value !== null),
    );
  }

  private hasMinimumCriteriaWithUpdate(
    currentProfile: ClientProfile,
    update?: Partial<ClientProfile>,
  ): boolean {
    const transactionType = update?.transactionType || currentProfile.transactionType;
    const cities = update?.preferences?.cities || currentProfile.preferences?.cities;
    const budgetMin = update?.budget?.min ?? currentProfile.budget?.min;
    const budgetMax = update?.budget?.max ?? currentProfile.budget?.max;

    return Boolean(
      transactionType &&
      cities?.length &&
      (budgetMin !== undefined || budgetMax !== undefined),
    );
  }

  private mergeStringArrays(
    existing?: string[],
    incoming?: string[],
  ): string[] | undefined {
    const merged = [...(existing || []), ...(incoming || [])]
      .map(value => value?.trim())
      .filter(Boolean);

    if (merged.length === 0) {
      return undefined;
    }

    return [...new Set(merged)];
  }

  private async handleClassificationChat(
    input: ChatWithProfileInput,
    preferences: UserPreferences,
    startTime: number,
  ): Promise<ChatWithProfileResponse> {
    if (!this.openai) {
      // Fallback without OpenAI
      return {
        conversationId: input.conversationId,
        message: 'Spune-mi ce cauți și te ajut să găsești proprietatea perfectă!',
        intent: { type: 'unclear', confidence: 0.5, slots: {}, requiresLLM: true, tier: 1 },
        toolsUsed: [],
        debug: { tier: 1, latencyMs: Date.now() - startTime, cached: false },
      };
    }

    const { clientProfile, messageHistory } = input;

    const systemPrompt = this.buildClassificationPrompt(clientProfile, input.contextOptions);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messageHistory.slice(-6).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.cheapModel,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.35,
        max_tokens: 450,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      // Extract profile update from AI response
      const profileUpdate: Partial<ClientProfile> = {};
      if (result.extracted) {
        if (result.extracted.transactionType) profileUpdate.transactionType = result.extracted.transactionType;
        if (result.extracted.propertyType) profileUpdate.propertyType = result.extracted.propertyType;
        if (result.extracted.purpose) profileUpdate.purpose = result.extracted.purpose;
        if (result.extracted.urgency) profileUpdate.urgency = result.extracted.urgency;
        if (result.extracted.budget) {
          profileUpdate.budget = { ...result.extracted.budget, currency: 'EUR' };
        }
        if (result.extracted.preferences) {
          profileUpdate.preferences = result.extracted.preferences;
        }
        if (result.extracted.dealbreakers) {
          profileUpdate.dealbreakers = result.extracted.dealbreakers;
        }
        if (result.extracted.answeredQuestions) {
          profileUpdate.answeredQuestions = result.extracted.answeredQuestions;
        }
      }

      // Build suggested actions (quick replies)
      const suggestedActions = result.quickReplies?.map((qr: string) => ({
        type: 'quick_reply' as const,
        label: qr,
      })) || [];

      // If AI says classification is ready, trigger search
      let properties: any[] | undefined;
      const toolsUsed: string[] = [];

      if (result.readyToSearch && result.searchParams) {
        const searchResult = await this.toolExecutor.execute(
          {
            id: uuidv4(),
            name: 'search_properties',
            arguments: {
              ...result.searchParams,
              limit: input.contextOptions?.maxResults || 5,
            },
          },
          {
            conversationId: input.conversationId,
            userId: input.userId,
            preferences,
            shownListingIds: input.clientProfile.lastShownListingIds || [],
          },
        );

        toolsUsed.push('search_properties');
        if (searchResult.result?.properties) {
          properties = searchResult.result.properties;
        }
        profileUpdate.classificationComplete = true;
      }

      return {
        conversationId: input.conversationId,
        message: this.cleanResponse(result.response || 'Cum te pot ajuta?'),
        properties,
        intent: {
          type: result.readyToSearch ? 'search' : 'unclear',
          confidence: 0.8,
          slots: result.readyToSearch ? (result.searchParams || {}) : {},
          requiresLLM: true,
          tier: 1,
        },
        toolsUsed,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
        clientProfileUpdate: Object.keys(profileUpdate).length > 0 ? profileUpdate : undefined,
        debug: {
          tier: 1,
          latencyMs: Date.now() - startTime,
          cached: false,
        },
      };
    } catch (error: any) {
      this.logger.error(`Classification chat error: ${error.message}`);
      return {
        conversationId: input.conversationId,
        message: 'Spune-mi ce tip de proprietate cauți și unde?',
        intent: { type: 'unclear', confidence: 0.3, slots: {}, requiresLLM: true, tier: 1 },
        toolsUsed: [],
        debug: { tier: 1, latencyMs: Date.now() - startTime, cached: false },
      };
    }
  }

  private async handleProfileTier1(
    state: ConversationState,
    intent: Intent,
    input: ChatWithProfileInput,
    clientProfile: ClientProfile,
  ): Promise<AgentResponse> {
    if (!this.openai) {
      return this.handleTier0(state, intent, { ...input, contextOptions: input.contextOptions });
    }

    const toolsUsed: string[] = [];
    let properties: any[] | undefined;

    const recentMessages = state.messages.slice(-6);
    const systemPrompt = this.buildProfileAwarePrompt(clientProfile, input.contextOptions);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.cheapModel,
        messages,
        tools: getToolsForOpenAI(),
        tool_choice: 'auto',
        temperature: 0.35,
        max_tokens: 500,
      });

      const choice = completion.choices[0];

      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolResults: ToolResult[] = [];

        for (const toolCall of choice.message.tool_calls) {
          const fn = (toolCall as any).function;
          const tc: ToolCall = {
            id: toolCall.id,
            name: fn.name,
            arguments: JSON.parse(fn.arguments || '{}'),
          };

          const result = await this.toolExecutor.execute(tc, {
            conversationId: state.conversationId,
            userId: input.userId,
            preferences: state.preferences,
            shownListingIds: state.shownListingIds,
          });

          toolResults.push(result);
          toolsUsed.push(tc.name);

          if (tc.name === 'search_properties' && result.result?.properties) {
            properties = result.result.properties;
            state.shownListingIds.push(...(properties || []).map(p => p.id));
          }

          if (tc.name === 'get_property_details' && result.result && !result.error) {
            const detail = result.result;
            properties = [{
              id: detail.id,
              title: detail.title,
              city: detail.city,
              neighborhood: detail.neighborhood,
              priceEur: detail.priceEur,
              transactionType: detail.transactionType,
              rooms: detail.rooms,
              surfaceSqm: detail.surfaceSqm,
              floor: detail.floor,
              totalFloors: detail.totalFloors,
              yearBuilt: detail.yearBuilt,
              isFurnished: detail.isFurnished,
              amenities: detail.amenities || [],
              imageUrl: detail.images?.[0]?.url,
              isPromoted: false,
            }];
          }

          if (tc.name === 'schedule_viewing' && result.result?.scheduledListing) {
            properties = [result.result.scheduledListing];
          }
        }

        const fastToolResponse = this.buildFastToolResponse(intent, properties, toolResults);
        if (fastToolResponse) {
          return {
            conversationId: state.conversationId,
            message: fastToolResponse,
            properties,
            intent,
            toolsUsed,
            suggestedActions: this.getSuggestedActions(intent, properties),
          };
        }

        const toolMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          ...messages,
          choice.message,
          ...toolResults.map(tr => ({
            role: 'tool' as const,
            tool_call_id: tr.toolCallId,
            content: JSON.stringify(tr.result || { error: tr.error }),
          })),
        ];

        const responseCompletion = await this.openai.chat.completions.create({
          model: this.cheapModel,
          messages: toolMessages,
          temperature: 0.35,
          max_tokens: 350,
        });

        return {
          conversationId: state.conversationId,
          message: this.cleanResponse(responseCompletion.choices[0].message.content || ''),
          properties,
          intent,
          toolsUsed,
          suggestedActions: this.getSuggestedActions(intent, properties),
        };
      }

      return {
        conversationId: state.conversationId,
        message: this.cleanResponse(choice.message.content || ''),
        intent,
        toolsUsed,
        suggestedActions: this.getSuggestedActions(intent, properties),
      };
    } catch (error: any) {
      this.logger.error(`Profile Tier 1 error: ${error.message}`);
      return this.handleTier0(state, intent, { ...input, contextOptions: input.contextOptions });
    }
  }

  private async handleProfileTier2(
    state: ConversationState,
    intent: Intent,
    input: ChatWithProfileInput,
    clientProfile: ClientProfile,
  ): Promise<AgentResponse> {
    if (!this.openai) {
      return this.handleProfileTier1(state, intent, input, clientProfile);
    }

    const toolsUsed: string[] = [];
    let properties: any[] | undefined;

    const recentMessages = state.messages.slice(-8);
    const systemPrompt = this.buildProfileAwarePrompt(clientProfile, input.contextOptions, true);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.strongModel,
        messages,
        tools: getToolsForOpenAI(),
        tool_choice: 'auto',
        temperature: 0.35,
        max_tokens: 700,
      });

      const choice = completion.choices[0];

      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolResults: ToolResult[] = [];

        for (const toolCall of choice.message.tool_calls) {
          const fn = (toolCall as any).function;
          const tc: ToolCall = {
            id: toolCall.id,
            name: fn.name,
            arguments: JSON.parse(fn.arguments || '{}'),
          };

          const result = await this.toolExecutor.execute(tc, {
            conversationId: state.conversationId,
            userId: input.userId,
            preferences: state.preferences,
            shownListingIds: state.shownListingIds,
          });

          toolResults.push(result);
          toolsUsed.push(tc.name);

          if (tc.name === 'search_properties' && result.result?.properties) {
            properties = result.result.properties;
            state.shownListingIds.push(...(properties || []).map(p => p.id));
          }

          if (tc.name === 'get_property_details' && result.result && !result.error) {
            const dp = result.result;
            properties = [{
              id: dp.id,
              title: dp.title,
              city: dp.city,
              neighborhood: dp.neighborhood,
              priceEur: dp.priceEur,
              transactionType: dp.transactionType,
              rooms: dp.rooms,
              surfaceSqm: dp.surfaceSqm,
              floor: dp.floor,
              totalFloors: dp.totalFloors,
              yearBuilt: dp.yearBuilt,
              isFurnished: dp.isFurnished,
              amenities: dp.amenities || [],
              imageUrl: dp.images?.[0]?.url,
              isPromoted: false,
            }];
          }

          if (tc.name === 'schedule_viewing' && result.result?.scheduledListing) {
            properties = [result.result.scheduledListing];
          }
        }

        const fastToolResponse = this.buildFastToolResponse(intent, properties, toolResults);
        if (fastToolResponse) {
          return {
            conversationId: state.conversationId,
            message: fastToolResponse,
            properties,
            intent,
            toolsUsed,
            suggestedActions: this.getSuggestedActions(intent, properties),
          };
        }

        const toolMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          ...messages,
          choice.message,
          ...toolResults.map(tr => ({
            role: 'tool' as const,
            tool_call_id: tr.toolCallId,
            content: JSON.stringify(tr.result || { error: tr.error }),
          })),
        ];

        const responseCompletion = await this.openai.chat.completions.create({
          model: this.strongModel,
          messages: toolMessages,
          temperature: 0.35,
          max_tokens: 450,
        });

        return {
          conversationId: state.conversationId,
          message: this.cleanResponse(responseCompletion.choices[0].message.content || ''),
          properties,
          intent,
          toolsUsed,
          suggestedActions: this.getSuggestedActions(intent, properties),
        };
      }

      return {
        conversationId: state.conversationId,
        message: this.cleanResponse(choice.message.content || ''),
        intent,
        toolsUsed,
        suggestedActions: this.getSuggestedActions(intent, properties),
      };
    } catch (error: any) {
      this.logger.error(`Profile Tier 2 error: ${error.message}`);
      return this.handleProfileTier1(state, intent, input, clientProfile);
    }
  }

  private extractProfileUpdate(
    intent: Intent,
    _message: string,
    _currentProfile?: ClientProfile,
  ): Partial<ClientProfile> {
    const update: Partial<ClientProfile> = {};
    const slots = intent.slots;

    if (slots.transactionType) update.transactionType = slots.transactionType;
    if (slots.propertyType) {
      update.propertyType = slots.propertyType as ClientProfile['propertyType'];
    }
    if (slots.city) {
      update.preferences = { ...update.preferences, cities: [slots.city] };
    }
    if (slots.neighborhood) {
      update.preferences = { ...update.preferences, neighborhoods: [slots.neighborhood] };
    }
    if (slots.priceMin !== undefined || slots.priceMax !== undefined) {
      update.budget = { currency: 'EUR' };
      if (slots.priceMin !== undefined) update.budget.min = slots.priceMin;
      if (slots.priceMax !== undefined) update.budget.max = slots.priceMax;
    }
    if (slots.rooms !== undefined) {
      update.preferences = { ...update.preferences, rooms: slots.rooms };
    }
    if (slots.roomsMin !== undefined) {
      update.preferences = { ...update.preferences, roomsMin: slots.roomsMin };
    }
    if (slots.roomsMax !== undefined) {
      update.preferences = { ...update.preferences, roomsMax: slots.roomsMax };
    }
    if (slots.surfaceMin !== undefined) {
      update.preferences = { ...update.preferences, surfaceMin: slots.surfaceMin };
    }
    if (slots.surfaceMax !== undefined) {
      update.preferences = { ...update.preferences, surfaceMax: slots.surfaceMax };
    }
    if (slots.isFurnished !== undefined) {
      update.preferences = { ...update.preferences, isFurnished: slots.isFurnished };
    }
    if (slots.petFriendly !== undefined) {
      update.preferences = { ...update.preferences, petFriendly: slots.petFriendly };
    }
    if (slots.floorMin !== undefined) {
      update.preferences = { ...update.preferences, floorMin: slots.floorMin };
    }
    if (slots.floorMax !== undefined) {
      update.preferences = { ...update.preferences, floorMax: slots.floorMax };
    }
    if (slots.yearBuiltMin !== undefined) {
      update.preferences = { ...update.preferences, yearBuiltMin: slots.yearBuiltMin };
    }
    if (slots.yearBuiltMax !== undefined) {
      update.preferences = { ...update.preferences, yearBuiltMax: slots.yearBuiltMax };
    }
    if (slots.amenities?.length) {
      update.preferences = { ...update.preferences, amenities: slots.amenities };
    }
    if (slots.dealbreakers?.length) {
      update.dealbreakers = slots.dealbreakers;
    }

    return update;
  }

  private async handleTier0(
    state: ConversationState,
    intent: Intent,
    input: ChatInput,
  ): Promise<AgentResponse> {
    const toolsUsed: string[] = [];
    let properties: any[] | undefined;
    let message: string;

    switch (intent.type) {
      case 'greeting':
        message = this.getGreeting(input.contextOptions?.tone);
        break;

      case 'thanks':
        message = 'Cu plăcere! Dacă ai alte întrebări despre proprietăți, sunt aici să te ajut.';
        break;

      case 'help':
        message = `Pot să te ajut cu:
• Căutare proprietăți - spune-mi ce cauți (ex: "apartament 2 camere în Botanica")
• Estimare preț - verific dacă un preț e corect pentru zonă
• Calculator credit - calculez rata lunară
• Recomandări zone - sugerez cartiere potrivite bugetului

Ce te interesează?`;
        break;

      case 'search':
      case 'refine':
        const searchResult = await this.toolExecutor.execute(
          {
            id: uuidv4(),
            name: 'search_properties',
            arguments: {
              ...intent.slots,
              limit: input.contextOptions?.maxResults || 5,
            },
          },
          {
            conversationId: state.conversationId,
            userId: input.userId,
            preferences: state.preferences,
            shownListingIds: state.shownListingIds,
          },
        );

        toolsUsed.push('search_properties');

        if (searchResult.error) {
          message = `Nu am putut efectua căutarea: ${searchResult.error}`;
        } else {
          properties = searchResult.result.properties;
          state.shownListingIds.push(...(properties?.map(p => p.id) || []));

          if (properties && properties.length > 0) {
            message = this.formatSearchResponse(
              properties,
              searchResult.result.total,
              intent.slots,
              searchResult.result.hasMore,
            );
          } else {
            message = 'Nu am găsit proprietăți care să corespundă criteriilor. Încearcă să ajustezi filtrele.';
          }
        }
        break;

      case 'mortgage':
        if (intent.slots.priceMax) {
          const mortgageResult = await this.toolExecutor.execute(
            {
              id: uuidv4(),
              name: 'calculate_mortgage',
              arguments: {
                propertyPrice: intent.slots.priceMax,
                downPaymentPercent: 20,
                interestRateApr: 8,
                termYears: 20,
              },
            },
            {
              conversationId: state.conversationId,
              userId: input.userId,
              preferences: state.preferences,
              shownListingIds: state.shownListingIds,
            },
          );

          toolsUsed.push('calculate_mortgage');
          const mr = mortgageResult.result;
          message = `Pentru o proprietate de ${mr.propertyPrice}€ cu avans 20%:
• Rată lunară: ~${mr.monthlyPayment}€
• Credit: ${mr.loanAmount}€ pe ${mr.termYears} ani
• Dobândă totală: ${mr.totalInterest}€

Vrei să caut proprietăți în acest buget?`;
        } else {
          message = 'Spune-mi prețul proprietății și pot calcula rata lunară estimată.';
        }
        break;

      default:
        message = 'Cum te pot ajuta cu căutarea de proprietăți?';
    }

    return {
      conversationId: state.conversationId,
      message,
      properties,
      intent,
      toolsUsed,
      suggestedActions: this.getSuggestedActions(intent, properties),
    };
  }

  private async handleTier1(
    state: ConversationState,
    intent: Intent,
    input: ChatInput,
  ): Promise<AgentResponse> {
    if (!this.openai) {
      return this.handleTier0(state, intent, input);
    }

    const toolsUsed: string[] = [];
    let properties: any[] | undefined;

    const recentMessages = state.messages.slice(-6);
    const systemPrompt = this.buildSystemPrompt(state, input.contextOptions);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.cheapModel,
        messages,
        tools: getToolsForOpenAI(),
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 800,
      });

      const choice = completion.choices[0];

      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolResults: ToolResult[] = [];

        for (const toolCall of choice.message.tool_calls) {
          const fn = (toolCall as any).function;
          const tc: ToolCall = {
            id: toolCall.id,
            name: fn.name,
            arguments: JSON.parse(fn.arguments || '{}'),
          };

          const result = await this.toolExecutor.execute(tc, {
            conversationId: state.conversationId,
            userId: input.userId,
            preferences: state.preferences,
            shownListingIds: state.shownListingIds,
          });

          toolResults.push(result);
          toolsUsed.push(tc.name);

          if (tc.name === 'search_properties' && result.result?.properties) {
            properties = result.result.properties;
            state.shownListingIds.push(...(properties || []).map(p => p.id));
          }

          if (tc.name === 'schedule_viewing' && result.result?.scheduledListing) {
            properties = [result.result.scheduledListing];
          }
        }

        const toolMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          ...messages,
          choice.message,
          ...toolResults.map(tr => ({
            role: 'tool' as const,
            tool_call_id: tr.toolCallId,
            content: JSON.stringify(tr.result || { error: tr.error }),
          })),
        ];

        const responseCompletion = await this.openai.chat.completions.create({
          model: this.cheapModel,
          messages: toolMessages,
          temperature: 0.7,
          max_tokens: 600,
        });

        return {
          conversationId: state.conversationId,
          message: this.cleanResponse(responseCompletion.choices[0].message.content || ''),
          properties,
          intent,
          toolsUsed,
          suggestedActions: this.getSuggestedActions(intent, properties),
        };
      }

      return {
        conversationId: state.conversationId,
        message: this.cleanResponse(choice.message.content || ''),
        intent,
        toolsUsed,
        suggestedActions: this.getSuggestedActions(intent, properties),
      };
    } catch (error: any) {
      this.logger.error(`Tier 1 error: ${error.message}`);
      return this.handleTier0(state, intent, input);
    }
  }

  private async handleTier2(
    state: ConversationState,
    intent: Intent,
    input: ChatInput,
  ): Promise<AgentResponse> {
    if (!this.openai) {
      return this.handleTier1(state, intent, input);
    }

    const toolsUsed: string[] = [];
    let properties: any[] | undefined;

    const recentMessages = state.messages.slice(-8);
    const systemPrompt = this.buildSystemPrompt(state, input.contextOptions, true);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.strongModel,
        messages,
        tools: getToolsForOpenAI(),
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000,
      });

      const choice = completion.choices[0];

      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolResults: ToolResult[] = [];

        for (const toolCall of choice.message.tool_calls) {
          const fn2 = (toolCall as any).function;
          const tc: ToolCall = {
            id: toolCall.id,
            name: fn2.name,
            arguments: JSON.parse(fn2.arguments || '{}'),
          };

          const result = await this.toolExecutor.execute(tc, {
            conversationId: state.conversationId,
            userId: input.userId,
            preferences: state.preferences,
            shownListingIds: state.shownListingIds,
          });

          toolResults.push(result);
          toolsUsed.push(tc.name);

          if (tc.name === 'search_properties' && result.result?.properties) {
            properties = result.result.properties;
            state.shownListingIds.push(...(properties || []).map(p => p.id));
          }

          if (tc.name === 'get_property_details' && result.result && !result.error) {
            const d2 = result.result;
            properties = [{
              id: d2.id,
              title: d2.title,
              city: d2.city,
              neighborhood: d2.neighborhood,
              priceEur: d2.priceEur,
              transactionType: d2.transactionType,
              rooms: d2.rooms,
              surfaceSqm: d2.surfaceSqm,
              floor: d2.floor,
              totalFloors: d2.totalFloors,
              yearBuilt: d2.yearBuilt,
              isFurnished: d2.isFurnished,
              amenities: d2.amenities || [],
              imageUrl: d2.images?.[0]?.url,
              isPromoted: false,
            }];
          }

          if (tc.name === 'schedule_viewing' && result.result?.scheduledListing) {
            properties = [result.result.scheduledListing];
          }
        }

        const toolMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          ...messages,
          choice.message,
          ...toolResults.map(tr => ({
            role: 'tool' as const,
            tool_call_id: tr.toolCallId,
            content: JSON.stringify(tr.result || { error: tr.error }),
          })),
        ];

        const responseCompletion = await this.openai.chat.completions.create({
          model: this.strongModel,
          messages: toolMessages,
          temperature: 0.7,
          max_tokens: 800,
        });

        return {
          conversationId: state.conversationId,
          message: this.cleanResponse(responseCompletion.choices[0].message.content || ''),
          properties,
          intent,
          toolsUsed,
          suggestedActions: this.getSuggestedActions(intent, properties),
        };
      }

      return {
        conversationId: state.conversationId,
        message: this.cleanResponse(choice.message.content || ''),
        intent,
        toolsUsed,
        suggestedActions: this.getSuggestedActions(intent, properties),
      };
    } catch (error: any) {
      this.logger.error(`Tier 2 error: ${error.message}`);
      return this.handleTier1(state, intent, input);
    }
  }

  async getValuation(input: AVMInput): Promise<{ valuation: AVMResult; explanation: AVMExplanation }> {
    const valuation = await this.valuationEngine.valuate(input);
    const explanation = await this.valuationEngine.generateExplanation(valuation, input, true);

    return { valuation, explanation };
  }

  async getValuationForListing(listingId: number): Promise<{ valuation: AVMResult; explanation: AVMExplanation } | null> {
    const { Listing } = await import('../../../db/entities/listing.entity.js');
    const listing = await Listing.findByPk(listingId);

    if (!listing) return null;

    const input: AVMInput = {
      city: listing.city,
      neighborhood: listing.neighborhood,
      propertyType: listing.propertyType,
      transactionType: listing.transactionType as 'RENT' | 'SALE',
      rooms: listing.rooms,
      surfaceSqm: listing.surfaceSqm,
      floor: listing.floor ?? undefined,
      totalFloors: listing.totalFloors ?? undefined,
      yearBuilt: listing.yearBuilt ?? undefined,
      amenities: listing.amenities ?? undefined,
      isFurnished: listing.isFurnished,
    };

    return this.getValuation(input);
  }

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  private getOrCreateState(
    conversationId: string,
    userId?: number,
    userPrefs?: Partial<UserPreferences>,
  ): ConversationState {
    let state = this.conversationStates.get(conversationId);

    if (!state) {
      state = {
        conversationId,
        userId,
        messages: [],
        preferences: {
          confidence: {},
          lastUpdated: new Date(),
          ...userPrefs,
        },
        lastIntent: null,
        shownListingIds: [],
        currentPlan: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours TTL
      };
      this.conversationStates.set(conversationId, state);
    }

    return state;
  }

  private updatePreferencesFromSlots(state: ConversationState, intent: Intent): void {
    const slots = intent.slots;
    const prefs = state.preferences;

    if (slots.transactionType) {
      prefs.transactionType = slots.transactionType;
      prefs.confidence['transactionType'] = intent.confidence;
    }
    if (slots.city) {
      prefs.cities = [slots.city];
      prefs.confidence['city'] = intent.confidence;
    }
    if (slots.neighborhood) {
      prefs.neighborhoods = [slots.neighborhood];
      prefs.confidence['neighborhood'] = intent.confidence;
    }
    if (slots.priceMin !== undefined) {
      prefs.priceMin = slots.priceMin;
      prefs.confidence['priceMin'] = intent.confidence;
    }
    if (slots.priceMax !== undefined) {
      prefs.priceMax = slots.priceMax;
      prefs.confidence['priceMax'] = intent.confidence;
    }
    if (slots.rooms !== undefined) {
      prefs.roomsMin = slots.rooms;
      prefs.roomsMax = slots.rooms;
      prefs.confidence['rooms'] = intent.confidence;
    }
    if (slots.roomsMin !== undefined) prefs.roomsMin = slots.roomsMin;
    if (slots.roomsMax !== undefined) prefs.roomsMax = slots.roomsMax;
    if (slots.surfaceMin !== undefined) prefs.surfaceMin = slots.surfaceMin;
    if (slots.surfaceMax !== undefined) prefs.surfaceMax = slots.surfaceMax;
    if (slots.propertyType) {
      prefs.propertyType = slots.propertyType as UserPreferences['propertyType'];
      prefs.confidence['propertyType'] = intent.confidence;
    }
    if (slots.isFurnished !== undefined) {
      prefs.isFurnished = slots.isFurnished;
      prefs.confidence['isFurnished'] = intent.confidence;
    }
    if (slots.petFriendly !== undefined) {
      prefs.petFriendly = slots.petFriendly;
      prefs.confidence['petFriendly'] = intent.confidence;
    }
    if (slots.floorMin !== undefined) prefs.floorMin = slots.floorMin;
    if (slots.floorMax !== undefined) prefs.floorMax = slots.floorMax;
    if (slots.yearBuiltMin !== undefined) prefs.yearBuiltMin = slots.yearBuiltMin;
    if (slots.yearBuiltMax !== undefined) prefs.yearBuiltMax = slots.yearBuiltMax;
    if (slots.amenities?.length) {
      prefs.mustHave = this.mergeStringArrays(prefs.mustHave, slots.amenities);
      prefs.confidence['amenities'] = intent.confidence;
    }
    if (slots.dealbreakers?.length) {
      prefs.dealbreakers = this.mergeStringArrays(prefs.dealbreakers, slots.dealbreakers);
      prefs.confidence['dealbreakers'] = intent.confidence;
    }

    prefs.lastUpdated = new Date();
  }

  getConversationState(conversationId: string): ConversationState | undefined {
    return this.conversationStates.get(conversationId);
  }

  clearConversation(conversationId: string): void {
    this.conversationStates.delete(conversationId);
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  private buildSystemPrompt(
    state: ConversationState,
    options?: ChatInput['contextOptions'],
    isStrong: boolean = false,
  ): string {
    const tone = options?.tone || 'friendly';
    const language = options?.language || 'ro';

    const toneGuide = {
      professional: 'Răspunde formal și profesional.',
      friendly: 'Răspunde într-un ton cald și prietenos.',
      concise: 'Răspunde foarte scurt și la obiect.',
    };

    const prefsContext = Object.keys(state.preferences).length > 2
      ? `\nPreferințe utilizator: ${JSON.stringify({
          transactionType: state.preferences.transactionType,
          cities: state.preferences.cities,
          priceRange: state.preferences.priceMax ? `${state.preferences.priceMin || 0}-${state.preferences.priceMax}€` : null,
          rooms: state.preferences.roomsMin,
        })}`
      : '';

    return `Ești RIVA, un consultant imobiliar de elită pentru platforma RIVA din Republica Moldova.

Principii:
- ${toneGuide[tone]}
- ${language === 'en' ? 'Respond in English.' : 'Răspunde în română.'}
- Fii concis - întrebări scurte, răspunsuri clare
- Pune întrebări doar când ai nevoie de informații esențiale
- Nu repeta întrebări la care ai deja răspuns
- Nu inventa date despre proprietăți - folosește doar rezultatele tool-urilor
${isStrong ? '- Poți oferi raționamente complexe și comparații detaliate' : ''}
${prefsContext}

REGULI CĂUTARE (FOARTE IMPORTANT):
- Când apelezi search_properties, trimite DOAR filtrele cerute explicit de client
- NU adăuga filtre automat din preferințe - sistemul le aplică singur
- Dacă clientul zice "arată-mi toate", trimite search_properties fără filtre extra

Când recomanzi proprietăți:
- Menționează de ce se potrivesc (1-2 motive scurte)
- Sugerează o acțiune următoare (salvează, programează, compară)

REGULI VIZIONARE:
- NU programa vizionări automat! Mai întâi ÎNTREABĂ clientul data și ora preferată
- Folosește schedule_viewing DOAR după ce clientul a confirmat data și intervalul orar

REGULI DETALII PROPRIETATE:
- Când clientul întreabă despre o proprietate specifică deja arătată, folosește get_property_details, NU search_properties
- search_properties doar pentru căutări noi sau criterii modificate

NU folosi markdown (fără **, *, #, etc.) - text simplu.`;
  }

  private buildClassificationPrompt(
    clientProfile: ClientProfile,
    options?: ChatInput['contextOptions'],
  ): string {
    const language = options?.language || 'ro';

    const alreadyKnown: string[] = [];
    if (clientProfile.transactionType) alreadyKnown.push(`Tip tranzacție: ${clientProfile.transactionType}`);
    if (clientProfile.propertyType) alreadyKnown.push(`Tip proprietate: ${clientProfile.propertyType}`);
    if (clientProfile.budget?.max) alreadyKnown.push(`Buget max: ${clientProfile.budget.max}€`);
    if (clientProfile.budget?.min) alreadyKnown.push(`Buget min: ${clientProfile.budget.min}€`);
    if (clientProfile.preferences?.cities?.length) alreadyKnown.push(`Oraș: ${clientProfile.preferences.cities.join(', ')}`);
    if (clientProfile.preferences?.neighborhoods?.length) alreadyKnown.push(`Cartier: ${clientProfile.preferences.neighborhoods.join(', ')}`);
    if (clientProfile.preferences?.rooms) alreadyKnown.push(`Camere: ${clientProfile.preferences.rooms}`);
    if (clientProfile.preferences?.roomsMin) alreadyKnown.push(`Camere min: ${clientProfile.preferences.roomsMin}`);
    if (clientProfile.preferences?.surfaceMin) alreadyKnown.push(`Suprafață min: ${clientProfile.preferences.surfaceMin}mp`);
    if (clientProfile.preferences?.surfaceMax) alreadyKnown.push(`Suprafață max: ${clientProfile.preferences.surfaceMax}mp`);
    if (clientProfile.preferences?.floorMin !== undefined) alreadyKnown.push(`Etaj min: ${clientProfile.preferences.floorMin}`);
    if (clientProfile.preferences?.floorMax !== undefined) alreadyKnown.push(`Etaj max: ${clientProfile.preferences.floorMax}`);
    if (clientProfile.preferences?.amenities?.length) alreadyKnown.push(`Facilități: ${clientProfile.preferences.amenities.join(', ')}`);
    if (clientProfile.preferences?.isFurnished !== undefined) alreadyKnown.push(`Mobilat: ${clientProfile.preferences.isFurnished ? 'Da' : 'Nu'}`);
    if (clientProfile.preferences?.petFriendly !== undefined) alreadyKnown.push(`Pet-friendly: ${clientProfile.preferences.petFriendly ? 'Da' : 'Nu'}`);
    if (clientProfile.purpose) alreadyKnown.push(`Scop: ${clientProfile.purpose}`);
    if (clientProfile.urgency) alreadyKnown.push(`Urgență: ${clientProfile.urgency}`);
    if (clientProfile.dealbreakers?.length) alreadyKnown.push(`Dealbreakers: ${clientProfile.dealbreakers.join(', ')}`);

    const notYetAsked: string[] = [];
    if (!clientProfile.transactionType) notYetAsked.push('transactionType (RENT sau SALE)');
    if (!clientProfile.preferences?.cities?.length) notYetAsked.push('city (orașul)');
    if (!clientProfile.budget?.max && !clientProfile.budget?.min) notYetAsked.push('budget (bugetul)');
    if (!clientProfile.preferences?.rooms && !clientProfile.preferences?.roomsMin) notYetAsked.push('rooms (câte camere)');
    if (!clientProfile.propertyType) notYetAsked.push('propertyType (tip proprietate: apartament, casă, garsonieră)');
    if (!clientProfile.preferences?.neighborhoods?.length) notYetAsked.push('neighborhood (ce cartier/zonă preferă)');
    if (!clientProfile.preferences?.amenities?.length) notYetAsked.push('amenities (facilități: parcare, balcon, ascensor, încălzire autonomă, aer condiționat)');
    if (!clientProfile.preferences?.surfaceMin && !clientProfile.preferences?.surfaceMax) notYetAsked.push('surface (suprafața dorită în mp)');
    if (!clientProfile.preferences?.floorMin && !clientProfile.preferences?.floorMax) notYetAsked.push('floor (etajul preferat)');
    if (clientProfile.preferences?.isFurnished === undefined) notYetAsked.push('isFurnished (mobilat sau nu)');
    if (!clientProfile.purpose) notYetAsked.push('purpose (scopul: personal, investiție, relocare, familie)');
    if (!clientProfile.urgency) notYetAsked.push('urgency (urgența: imediat, 1 lună, 3 luni, fără grabă)');

    return `Ești RIVA, consultant imobiliar pentru Republica Moldova.
${language === 'en' ? 'Respond in English.' : 'Răspunde ÎNTOTDEAUNA în română.'}

Scopul tău este să completezi rapid profilul clientului, fără să pari formular.
Poți porni căutarea imediat ce ai minim: transactionType + city + budget.

Date cunoscute:
${alreadyKnown.length > 0 ? alreadyKnown.join('\n') : 'Nimic încă.'}

Informații care mai pot fi utile:
${notYetAsked.length > 0 ? notYetAsked.join('\n') : 'Ai deja datele minime necesare pentru căutare.'}

Reguli:
- Sună ca un consultant real, nu ca un formular
- Scrie scurt: 1-3 propoziții
- Pune o singură întrebare principală; doar dacă e foarte logic, poți adăuga încă una scurtă
- Nu repeta ce știi deja
- Dacă utilizatorul spune criterii clare, extrage tot dintr-un foc
- Dacă utilizatorul este nehotărât, întreabă următorul lucru cu impact mare: tranzacție, oraș, buget, camere, zonă
- După ce ai datele minime, setează readyToSearch=true chiar dacă nu ai toate preferințele fine
- quickReplies trebuie să fie concrete și scurte, exact pe întrebarea pusă

Răspunde STRICT în acest JSON:
{
  "response": "textul răspunsului tău natural (fără markdown)",
  "extracted": {
    "transactionType": "RENT" | "SALE" | null,
    "propertyType": "APARTMENT" | "HOUSE" | "STUDIO" | null,
    "purpose": "personal" | "investment" | "relocation" | "family" | null,
    "urgency": "immediate" | "1_month" | "3_months" | "no_rush" | null,
    "budget": { "min": number | null, "max": number | null } | null,
    "preferences": {
      "rooms": number | null,
      "roomsMin": number | null,
      "roomsMax": number | null,
      "surfaceMin": number | null,
      "surfaceMax": number | null,
      "cities": ["Chișinău"] | null,
      "neighborhoods": ["Botanica"] | null,
      "amenities": ["parcare", "balcon", "ascensor"] | null,
      "isFurnished": boolean | null,
      "petFriendly": boolean | null,
      "floorMin": number | null,
      "floorMax": number | null
    } | null,
    "dealbreakers": ["fara parter"] | null,
    "answeredQuestions": ["transactionType", "city"]
  },
  "readyToSearch": false,
  "searchParams": null,
  "quickReplies": ["Da, închiriez", "Nu, vreau să cumpăr"]
}

Important:
- quickReplies: 2-4 opțiuni reale, fără texte generice
- extracted conține doar noutățile din mesajul curent
- nu folosi markdown în response
- când readyToSearch=true, include searchParams de forma:
"searchParams": {
  "transactionType": "RENT",
  "city": "Chișinău",
  "priceMax": 400,
  "rooms": 2
}`;
  }

  private buildProfileAwarePrompt(
    clientProfile: ClientProfile,
    options?: ChatInput['contextOptions'],
    isStrong: boolean = false,
  ): string {
    const tone = options?.tone || 'friendly';
    const language = options?.language || 'ro';

    const toneGuide = {
      professional: 'Răspunde formal și profesional.',
      friendly: 'Răspunde într-un ton cald și prietenos.',
      concise: 'Răspunde foarte scurt și la obiect.',
    };

    const profileContext: string[] = [];
    if (clientProfile.transactionType) profileContext.push(`Caută să ${clientProfile.transactionType === 'RENT' ? 'închirieze' : 'cumpere'}`);
    if (clientProfile.propertyType) profileContext.push(`Tip: ${clientProfile.propertyType}`);
    if (clientProfile.budget?.max) profileContext.push(`Buget max: ${clientProfile.budget.max}€`);
    if (clientProfile.preferences?.cities?.length) profileContext.push(`Oraș: ${clientProfile.preferences.cities.join(', ')}`);
    if (clientProfile.preferences?.neighborhoods?.length) profileContext.push(`Cartier: ${clientProfile.preferences.neighborhoods.join(', ')}`);
    if (clientProfile.preferences?.rooms) profileContext.push(`Camere: ${clientProfile.preferences.rooms}`);
    if (clientProfile.purpose) profileContext.push(`Scop: ${clientProfile.purpose}`);
    if (clientProfile.urgency) profileContext.push(`Urgență: ${clientProfile.urgency}`);
    if (clientProfile.conversationPhase) profileContext.push(`Faza: ${clientProfile.conversationPhase}`);

    return `Ești RIVA, un consultant imobiliar de elită pentru platforma RIVA din Republica Moldova.

Principii:
- ${toneGuide[tone]}
- ${language === 'en' ? 'Respond in English.' : 'Răspunde în română.'}
- Fii concis - 2 până la 4 propoziții clare
- Nu inventa date despre proprietăți - folosește doar rezultatele tool-urilor
- Sună ca un consultant care înțelege piața și vrea să economisească timpul clientului
${isStrong ? '- Poți oferi raționamente complexe și comparații detaliate' : ''}

PROFILUL CLIENTULUI (deja clasificat - doar pentru contextul tău, NU pentru filtre):
${profileContext.length ? profileContext.join('\n') : 'Context limitat.'}

COMPORTAMENT PE FAZE:
- discovery / ready_to_search: pui o singură întrebare utilă sau confirmi clar următorul pas
- results_shown: scoți în evidență 2-3 opțiuni bune și de ce se potrivesc
- refining: confirmi pe scurt ce s-a schimbat și ce efect are
- property_followup: răspunzi despre proprietatea selectată și propui detalii sau vizionare

REGULI CĂUTARE (FOARTE IMPORTANT):
- Când apelezi search_properties, trimite DOAR filtrele pe care clientul le-a menționat EXPLICIT în mesajul curent
- NU trimite automat isFurnished, petFriendly, neighborhood, priceMin sau alte filtre din profil dacă clientul NU le-a cerut acum
- Sistemul aplică automat filtrele de bază (transactionType, city, priceMax) din profil - tu nu trebuie să le trimiți
- Dacă clientul zice "arată-mi toate" sau "toate proprietățile", trimite search_properties cu cât MAI PUȚINE filtre posibil (doar transactionType și city)
- Nu cere clarificări suplimentare dacă poți răspunde deja util

Când recomanzi proprietăți:
- Spune de ce se potrivesc în 1-2 motive scurte
- Dacă există matchReasons în tool results, reutilizează-le natural
- Încheie cu un singur pas următor clar

REGULI VIZIONARE (FOARTE IMPORTANT):
- Când clientul vrea să programeze o vizionare, NU programa automat!
- Mai întâi ÎNTREABĂ: "În ce dată ai vrea să mergi la vizionare?" și "Ce oră ți-ar conveni - dimineață (9-12), după-amiază (12-17) sau seara (17-20)?"
- Folosește tool-ul schedule_viewing DOAR după ce ai primit de la client: data, intervalul orar
- Dacă clientul spune doar "vreau vizionare", răspunde-i cu opțiunile de date și ore

REGULI DETALII PROPRIETATE (FOARTE IMPORTANT):
- Când clientul întreabă detalii despre O SINGURĂ proprietate deja afișată (ex: "povesteste-mi mai mult despre prima", "detalii despre asta"), folosește DOAR tool-ul get_property_details cu listingId-ul respectiv
- NU apela search_properties când clientul discută despre o proprietate specifică deja arătată
- Folosește search_properties DOAR când clientul cere proprietăți noi sau modifică criteriile de căutare

NU folosi markdown (fără **, *, #, etc.) - text simplu.`;
  }

  private getGreeting(tone?: string): string {
    const greetings = {
      professional: 'Bună ziua! Sunt RIVA, asistentul dumneavoastră imobiliar. Cu ce vă pot ajuta astăzi?',
      friendly: 'Salut! Sunt RIVA, asistentul tău imobiliar. Spune-mi ce cauți și te ajut să găsești proprietatea perfectă!',
      concise: 'Salut! Ce tip de proprietate cauți?',
    };
    return greetings[tone as keyof typeof greetings] || greetings.friendly;
  }

  private formatSearchResponse(
    properties: any[],
    total: number,
    slots: any,
    hasMore?: boolean,
  ): string {
    const location = [slots.neighborhood, slots.city].filter(Boolean).join(', ') || 'zona căutată';
    const count = properties.length;

    if (count === 0) {
      return `Momentan nu am găsit potriviri bune în ${location}. Pot să lărgim puțin bugetul, zona sau numărul de camere ca să găsim variante mai bune.`;
    }

    const intro = total > count
      ? `Am selectat ${count} opțiuni bune din ${total} rezultate în ${location}.`
      : `Am găsit ${count} opțiuni bune în ${location}.`;

    const preview = properties.slice(0, 3).map((property, index) => {
      const price = property.transactionType === 'RENT'
        ? `${property.priceEur}€/lună`
        : `${property.priceEur.toLocaleString()}€`;
      const reasons = Array.isArray(property.matchReasons)
        ? property.matchReasons.slice(0, 2).join(', ')
        : '';
      return `${index + 1}. ${property.title} — ${price}, ${property.rooms} camere, ${property.surfaceSqm} mp${reasons ? `, ${reasons}` : ''}.`;
    }).join('\n');

    const nextStep = hasMore || total > count
      ? 'Dacă vrei, îți mai arăt variante sau restrângem căutarea.'
      : 'Spune-mi dacă vrei să comparăm două opțiuni sau să intrăm în detalii pe una.';

    return `${intro}\n\n${preview}\n\n${nextStep}`;
  }

  private formatPropertyFollowupResponse(property: any): string {
    const price = property.transactionType === 'RENT'
      ? `${property.priceEur}€/lună`
      : `${property.priceEur.toLocaleString()}€`;

    const highlights = [
      property.rooms ? `${property.rooms} camere` : undefined,
      property.surfaceSqm ? `${property.surfaceSqm} mp` : undefined,
      property.floor !== undefined ? `etaj ${property.floor}${property.totalFloors ? ` din ${property.totalFloors}` : ''}` : undefined,
      property.isFurnished ? 'mobilat' : undefined,
      Array.isArray(property.amenities) && property.amenities.length ? property.amenities[0] : undefined,
    ].filter(Boolean).slice(0, 3);

    return `${property.title} este la ${price} și are ${highlights.join(', ')}. Dacă vrei, îți spun pe scurt avantajele, eventualele compromisuri sau pregătim o vizionare.`;
  }

  private cleanResponse(text: string): string {
    // Remove markdown formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/`(.*?)`/g, '$1')
      .trim();
  }

  private buildFastToolResponse(
    intent: Intent,
    properties: any[] | undefined,
    toolResults: ToolResult[],
  ): string | undefined {
    const uniqueTools = [...new Set(toolResults.map(result => result.name))];
    if (uniqueTools.length !== 1) {
      return undefined;
    }

    const toolName = uniqueTools[0];
    const primaryResult = toolResults.find(result => result.name === toolName)?.result;

    if (toolName === 'search_properties') {
      return this.formatSearchResponse(
        properties || [],
        primaryResult?.total || properties?.length || 0,
        intent.slots,
        primaryResult?.hasMore,
      );
    }

    if (toolName === 'get_property_details' && properties?.[0]) {
      return this.formatPropertyFollowupResponse(properties[0]);
    }

    if (toolName === 'schedule_viewing') {
      if (typeof primaryResult?.message === 'string') {
        return this.cleanResponse(primaryResult.message);
      }
      if (properties?.[0]) {
        return `Perfect, am pregătit vizionarea pentru ${properties[0].title}. Dacă vrei, îți spun și ce merită verificat la vizită.`;
      }
    }

    return undefined;
  }

  private getSuggestedActions(intent: Intent, properties?: any[]): AgentResponse['suggestedActions'] {
    const actions: AgentResponse['suggestedActions'] = [];

    if (properties && properties.length > 0) {
      if (properties[0]) {
        actions.push({
          type: 'quick_reply',
          label: 'Spune-mi mai multe despre prima',
          payload: { message: `Spune-mi mai multe despre ${properties[0].title}` },
        });
      }
      if (properties.length >= 2) {
        actions.push({
          type: 'quick_reply',
          label: 'Compară primele opțiuni',
          payload: { message: 'Compară-mi primele opțiuni' },
        });
      }
      actions.push(
        {
          type: 'quick_reply',
          label: 'Arată-mi și altele',
          payload: { message: 'Arată-mi și alte variante' },
        },
        {
          type: 'quick_reply',
          label: 'Rafinează căutarea',
          payload: { message: 'Vreau să rafinăm căutarea' },
        },
      );
      if (properties.length >= 3) {
        actions.push({
          type: 'compare',
          label: 'Compară opțiunile',
          payload: { listingIds: properties.slice(0, 3).map(p => p.id) },
        });
      }
    }

    if (intent.type === 'search' && (!properties || properties.length === 0)) {
      actions.push(
        {
          type: 'quick_reply',
          label: 'Lărgim bugetul',
          payload: { message: 'Poți să-mi arăți opțiuni cu un buget puțin mai mare?' },
        },
        {
          type: 'quick_reply',
          label: 'Schimbăm zona',
          payload: { message: 'Hai să căutăm și în altă zonă' },
        },
      );
    }

    if (intent.type === 'details') {
      actions.push({
        type: 'quick_reply',
        label: 'Vreau o vizionare',
        payload: { message: 'Vreau să programez o vizionare' },
      });
    }

    return actions.length > 0 ? actions.slice(0, 4) : undefined;
  }

  // ========================================================================
  // TELEMETRY
  // ========================================================================

  private logDecision(log: AIDecisionLog): void {
    this.decisionLogs.push(log);

    // Keep last 1000 logs in memory
    if (this.decisionLogs.length > 1000) {
      this.decisionLogs.shift();
    }

    this.logger.debug(
      `AI Decision: tier=${log.tierUsed} intent=${log.intent} tools=[${log.toolsCalled.join(',')}] latency=${log.latencyMs}ms`,
    );
  }

  getDecisionStats(): { tier0: number; tier1: number; tier2: number; avgLatency: number } {
    const stats = { tier0: 0, tier1: 0, tier2: 0, totalLatency: 0 };

    for (const log of this.decisionLogs) {
      if (log.tierUsed === 0) stats.tier0++;
      else if (log.tierUsed === 1) stats.tier1++;
      else stats.tier2++;
      stats.totalLatency += log.latencyMs;
    }

    return {
      tier0: stats.tier0,
      tier1: stats.tier1,
      tier2: stats.tier2,
      avgLatency: this.decisionLogs.length > 0 ? Math.round(stats.totalLatency / this.decisionLogs.length) : 0,
    };
  }
}
