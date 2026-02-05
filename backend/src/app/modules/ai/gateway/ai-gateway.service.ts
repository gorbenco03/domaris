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
    const { clientProfile, messageHistory } = input;

    // Build preferences from client profile
    const preferences: UserPreferences = {
      transactionType: clientProfile.transactionType,
      cities: clientProfile.preferences?.cities,
      neighborhoods: clientProfile.preferences?.neighborhoods,
      priceMin: clientProfile.budget?.min,
      priceMax: clientProfile.budget?.max,
      roomsMin: clientProfile.preferences?.rooms || clientProfile.preferences?.roomsMin,
      roomsMax: clientProfile.preferences?.roomsMax,
      surfaceMin: clientProfile.preferences?.surfaceMin,
      surfaceMax: clientProfile.preferences?.surfaceMax,
      mustHave: clientProfile.preferences?.amenities,
      isFurnished: clientProfile.preferences?.isFurnished,
      petFriendly: clientProfile.preferences?.petFriendly,
      confidence: {},
      lastUpdated: new Date(),
    };

    // If classification is NOT complete, use LLM for conversational classification
    if (!clientProfile.classificationComplete) {
      return this.handleClassificationChat(input, preferences, startTime);
    }

    // Classification complete - skip IntentRouter, go direct to LLM with tools
    // This saves one GPT API call and lets the LLM decide the right tool itself
    const state = this.getOrCreateState(input.conversationId, input.userId);
    state.preferences = preferences;
    state.messages = messageHistory;

    // Add user message
    state.messages.push({
      role: 'user',
      content: input.message,
      timestamp: new Date(),
    });

    // Quick Tier 0 check for trivial intents (greeting, thanks) — no GPT needed
    const normalizedMsg = input.message.toLowerCase().trim();
    const isTrivial = /^(bună|salut|hello|hi|hey|buna ziua|mulțumesc|multumesc|mersi|thanks|ms|ajutor|help)\b/i.test(normalizedMsg);

    let response: AgentResponse;
    const intent: Intent = {
      type: 'search',
      confidence: 0.8,
      slots: {},
      requiresLLM: true,
      tier: 1,
    };

    if (isTrivial) {
      const routerResult = await this.intentRouter.route(input.message, state);
      response = await this.handleTier0(state, routerResult.intent, { ...input, contextOptions: input.contextOptions });
      Object.assign(intent, routerResult.intent);
    } else {
      response = await this.handleProfileTier1(state, intent, input, clientProfile);
    }

    state.messages.push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
    });

    // Extract profile updates from slots
    const profileUpdate = this.extractProfileUpdate(intent, input.message);

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
      clientProfileUpdate: Object.keys(profileUpdate).length > 0 ? profileUpdate : undefined,
      debug: {
        tier: intent.tier,
        latencyMs: Date.now() - startTime,
        cached: false,
      },
    };
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
      ...messageHistory.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.cheapModel,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 800,
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
            shownListingIds: [],
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
          slots: result.extracted || {},
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

    const recentMessages = state.messages.slice(-8);
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

          // Also capture get_property_details results as a single-item property list
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

          // Capture schedule_viewing listing so the CORRECT property card is shown
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

    const recentMessages = state.messages.slice(-10);
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
        temperature: 0.7,
        max_tokens: 1000,
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
              id: dp.id, title: dp.title, city: dp.city, neighborhood: dp.neighborhood,
              priceEur: dp.priceEur, transactionType: dp.transactionType, rooms: dp.rooms,
              surfaceSqm: dp.surfaceSqm, floor: dp.floor, totalFloors: dp.totalFloors,
              yearBuilt: dp.yearBuilt, isFurnished: dp.isFurnished,
              amenities: dp.amenities || [], imageUrl: dp.images?.[0]?.url, isPromoted: false,
            }];
          }

          // Capture schedule_viewing listing so the CORRECT property card is shown
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
      this.logger.error(`Profile Tier 2 error: ${error.message}`);
      return this.handleProfileTier1(state, intent, input, clientProfile);
    }
  }

  private extractProfileUpdate(intent: Intent, message: string): Partial<ClientProfile> {
    const update: Partial<ClientProfile> = {};
    const slots = intent.slots;

    if (slots.transactionType) update.transactionType = slots.transactionType;
    if (slots.city) {
      update.preferences = { ...update.preferences, cities: [slots.city] };
    }
    if (slots.neighborhood) {
      update.preferences = { ...update.preferences, neighborhoods: [slots.neighborhood] };
    }
    if (slots.priceMin || slots.priceMax) {
      update.budget = { currency: 'EUR' };
      if (slots.priceMin) update.budget.min = slots.priceMin;
      if (slots.priceMax) update.budget.max = slots.priceMax;
    }
    if (slots.rooms) {
      update.preferences = { ...update.preferences, rooms: slots.rooms };
    }
    if (slots.propertyType) {
      update.propertyType = slots.propertyType as any;
    }

    return update;
  }

  // ========================================================================
  // TIER HANDLERS
  // ========================================================================

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
        // Execute search tool
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
            message = this.formatSearchResponse(properties, searchResult.result.total, intent.slots);
          } else {
            message = 'Nu am găsit proprietăți care să corespundă criteriilor. Încearcă să ajustezi filtrele.';
          }
        }
        break;

      case 'mortgage':
        // Handle simple mortgage calculation
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
    // Tier 1 uses cheap model with tools for more complex operations
    if (!this.openai) {
      return this.handleTier0(state, intent, input);
    }

    const toolsUsed: string[] = [];
    let properties: any[] | undefined;

    // Build context from recent messages
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

      // Handle tool calls
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

          // Collect properties from search results
          if (tc.name === 'search_properties' && result.result?.properties) {
            properties = result.result.properties;
            state.shownListingIds.push(...(properties || []).map(p => p.id));
          }

          // Capture schedule_viewing listing so the CORRECT property card is shown
          if (tc.name === 'schedule_viewing' && result.result?.scheduledListing) {
            properties = [result.result.scheduledListing];
          }
        }

        // Generate response with tool results
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

      // No tool calls - direct response
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
    // Tier 2 uses strong model for complex reasoning, trade-off analysis, explanations
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

      // Handle tool calls (same as Tier 1)
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
              id: d2.id, title: d2.title, city: d2.city, neighborhood: d2.neighborhood,
              priceEur: d2.priceEur, transactionType: d2.transactionType, rooms: d2.rooms,
              surfaceSqm: d2.surfaceSqm, floor: d2.floor, totalFloors: d2.totalFloors,
              yearBuilt: d2.yearBuilt, isFurnished: d2.isFurnished,
              amenities: d2.amenities || [], imageUrl: d2.images?.[0]?.url, isPromoted: false,
            }];
          }

          // Capture schedule_viewing listing so the CORRECT property card is shown
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

  // ========================================================================
  // AVM / PRICE RECOMMENDATION
  // ========================================================================

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

    return `Ești RIVA, consultant imobiliar de elită pentru platforma RIVA din Republica Moldova.
${language === 'en' ? 'Respond in English.' : 'Răspunde ÎNTOTDEAUNA în română.'}

ROLUL TĂU ACUM: Clasificarea clientului prin conversație naturală.
NU arăta proprietăți până nu ai suficiente date (minim: transactionType + oraș + buget).

CE ȘTII DEJA DESPRE CLIENT:
${alreadyKnown.length > 0 ? alreadyKnown.join('\n') : 'Nimic încă.'}

CE MAI TREBUIE SĂ AFLI:
${notYetAsked.length > 0 ? notYetAsked.join('\n') : 'Ai toate datele minime - poți căuta!'}

REGULI:
1. Pune MAXIM 1-2 întrebări per mesaj, natural, ca un consultant real
2. NU repeta întrebări la care ai deja răspuns
3. Extrage informații chiar și din răspunsuri indirecte
4. Fii empatic și profesional
5. Dacă utilizatorul dă informații voluntar (ex: "caut apartament 2 camere în Botanica sub 400€"), extrage TOATE datele dintr-o dată
6. Când ai minim transactionType + oraș + buget, setează readyToSearch=true și include searchParams
7. Încearcă să afli cât mai multe detalii relevante ÎNAINTE de a căuta:
   - Câte camere dorește? (1, 2, 3+)
   - Ce suprafață (mp) ar fi ideală?
   - Ce etaj preferă? (nu la parter, etajele 2-5, ultimul etaj, nu contează)
   - Ce facilități sunt importante? (parcare, balcon, terasă, debara, încălzire autonomă/centrală, ascensor, aer condiționat)
   - Mobilat sau nemobilat?
   - Animale de companie?
   - Într-un bloc nou sau vechi? (anul construcției)
   - Care este scopul (personal/investiție/relocare/familie)?
   - Cât de urgent este? (imediat/1 lună/3 luni/fără grabă)
   - Ce zone/cartiere preferă? (Botanica, Centru, Buiucani, Ciocana, Rîșcani, Telecentru)
   - Există dealbreakers? (ex: fără parter, fără ultimul etaj, doar bloc nou)
8. NU pune toate întrebările deodată - distribuie-le natural pe parcursul conversației (1-2 per mesaj)

RĂSPUNDE STRICT în acest format JSON:
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

IMPORTANT despre quickReplies:
- quickReplies sunt butoane de răspuns rapid care apar sub mesajul tău
- Scrie texte CONCRETE și SPECIFICE contextului întrebării tale, NU generice
- Exemple BUNE: ["Închiriez", "Cumpăr"], ["1 cameră", "2 camere", "3+ camere"], ["Da, mobilat", "Nu contează"], ["Sub 300€", "300-500€", "Peste 500€"]
- NICIODATĂ nu scrie "Opțiune 1", "Opțiune 2" sau variante generice!
- Oferă 2-4 opțiuni relevante bazate pe întrebarea pe care o pui

Când readyToSearch=true, include searchParams:
"searchParams": {
  "transactionType": "RENT",
  "city": "Chișinău",
  "priceMax": 400,
  "rooms": 2
}

IMPORTANT: Trimite DOAR câmpurile care au valori noi din mesajul curent. Nu retrimite ce ai extras deja.
NU folosi markdown în "response" - text simplu.`;
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

    return `Ești RIVA, un consultant imobiliar de elită pentru platforma RIVA din Republica Moldova.

Principii:
- ${toneGuide[tone]}
- ${language === 'en' ? 'Respond in English.' : 'Răspunde în română.'}
- Fii concis - răspunsuri clare și la obiect
- Nu inventa date despre proprietăți - folosește doar rezultatele tool-urilor
${isStrong ? '- Poți oferi raționamente complexe și comparații detaliate' : ''}

PROFILUL CLIENTULUI (deja clasificat - doar pentru contextul tău, NU pentru filtre):
${profileContext.join('\n')}

REGULI CĂUTARE (FOARTE IMPORTANT):
- Când apelezi search_properties, trimite DOAR filtrele pe care clientul le-a menționat EXPLICIT în mesajul curent
- NU trimite automat isFurnished, petFriendly, neighborhood, priceMin sau alte filtre din profil dacă clientul NU le-a cerut acum
- Sistemul aplică automat filtrele de bază (transactionType, city, priceMax) din profil - tu nu trebuie să le trimiți
- Dacă clientul zice "arată-mi toate" sau "toate proprietățile", trimite search_properties cu cât MAI PUȚINE filtre posibil (doar transactionType și city)
- Folosește limit:10 sau mai mult ca să arăți mai multe rezultate

Când recomanzi proprietăți:
- Menționează de ce se potrivesc profilului clientului (1-2 motive scurte)
- Sugerează acțiuni: salvează, programează vizionare, compară

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
  ): string {
    const location = [slots.neighborhood, slots.city].filter(Boolean).join(', ') || 'zona căutată';
    const count = properties.length;

    let response = `Am găsit ${total} proprietăți în ${location}. Iată ${count} opțiuni:\n\n`;

    properties.slice(0, 5).forEach((p, i) => {
      const price = p.transactionType === 'RENT' ? `${p.priceEur}€/lună` : `${p.priceEur.toLocaleString()}€`;
      response += `${i + 1}. ${p.title}\n   ${p.rooms} camere, ${p.surfaceSqm}mp - ${price}\n`;
    });

    if (total > count) {
      response += `\nMai sunt ${total - count} proprietăți disponibile. Vrei să vezi mai multe sau să rafinăm căutarea?`;
    }

    return response;
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

  private getSuggestedActions(intent: Intent, properties?: any[]): AgentResponse['suggestedActions'] {
    const actions: AgentResponse['suggestedActions'] = [];

    if (properties && properties.length > 0) {
      actions.push(
        { type: 'save_search', label: 'Salvează căutarea' },
        { type: 'refine', label: 'Rafinează filtrele' },
      );
      if (properties.length >= 2) {
        actions.push({
          type: 'compare',
          label: 'Compară opțiunile',
          payload: { listingIds: properties.slice(0, 3).map(p => p.id) },
        });
      }
    }

    if (intent.type === 'search' && (!properties || properties.length === 0)) {
      actions.push({ type: 'refine', label: 'Ajustează criteriile' });
    }

    return actions.length > 0 ? actions : undefined;
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
