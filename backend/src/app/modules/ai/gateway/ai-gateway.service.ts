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
} from '../types/index.js';

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
- După 2-3 întrebări, arată rezultate
- Nu repeta întrebări la care ai deja răspuns
- Nu inventa date despre proprietăți - folosește doar rezultatele tool-urilor
${isStrong ? '- Poți oferi raționamente complexe și comparații detaliate' : ''}
${prefsContext}

Când recomanzi proprietăți:
- Menționează de ce se potrivesc (1-2 motive scurte)
- Sugerează o acțiune următoare (salvează, programează, compară)

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
