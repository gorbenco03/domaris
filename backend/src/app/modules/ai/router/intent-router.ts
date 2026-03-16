/**
 * Multi-Tier Intent Router
 * 
 * Tier 0: Deterministic rules (regex, keywords, state machine) - FREE
 * Tier 1: Cheap classifier model for intent + slot extraction - LOW COST
 * Tier 2: Strong LLM for complex reasoning - EXPENSIVE (use sparingly)
 * 
 * Goal: 70% Tier 0, 25% Tier 1, 5% Tier 2
 */

import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { Intent, IntentType, ExtractedSlots, ConversationState } from '../types/index.js';

interface RouterResult {
  intent: Intent;
  shouldEscalate: boolean;
  reason?: string;
}

@Injectable()
export class IntentRouter {
  private readonly logger = new Logger(IntentRouter.name);
  private openai: OpenAI | null = null;
  private readonly cheapModel = 'gpt-4o-mini';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async route(
    message: string,
    conversationState: ConversationState | null,
  ): Promise<RouterResult> {
    const normalizedMessage = message.toLowerCase().trim();

    // TIER 0: Deterministic rules
    const tier0Result = this.tier0Deterministic(normalizedMessage, conversationState);
    if (tier0Result.intent.confidence >= 0.9) {
      this.logger.debug(`Tier 0 match: ${tier0Result.intent.type} (${tier0Result.intent.confidence})`);
      return tier0Result;
    }

    // TIER 1: Cheap classifier
    const tier1Result = await this.tier1Classifier(message, conversationState);
    if (tier1Result.intent.confidence >= 0.8 && !tier1Result.shouldEscalate) {
      this.logger.debug(`Tier 1 match: ${tier1Result.intent.type} (${tier1Result.intent.confidence})`);
      return tier1Result;
    }

    // TIER 2: Mark for strong LLM processing
    tier1Result.intent.tier = 2;
    tier1Result.intent.requiresLLM = true;
    tier1Result.shouldEscalate = true;
    this.logger.debug(`Escalating to Tier 2: ${tier1Result.reason || 'low confidence'}`);
    return tier1Result;
  }

  // ========================================================================
  // TIER 0: Deterministic Pattern Matching
  // ========================================================================

  private tier0Deterministic(
    message: string,
    state: ConversationState | null,
  ): RouterResult {
    const slots: ExtractedSlots = {};
    const referencedListingId = this.resolveListingReference(message, state);
    if (referencedListingId) {
      slots.listingId = referencedListingId;
    }

    // Greetings
    if (/^(bună|salut|hello|hi|hey|buna ziua|neata|servus)\b/i.test(message)) {
      return this.makeResult('greeting', 0.95, slots, 0);
    }

    // Thanks / closing
    if (/^(mulțumesc|multumesc|mersi|thanks|thank you|ms|mulțam)\b/i.test(message)) {
      return this.makeResult('thanks', 0.95, slots, 0);
    }

    // Help request
    if (/^(ajutor|help|cum funcționează|cum functioneaza|ce poți|ce poti)\b/i.test(message)) {
      return this.makeResult('help', 0.92, slots, 0);
    }

    // Direct commands - show more, sort, filter adjustments
    if (/^(arată|arata|mai multe|show more|următoarele|urmatoarele)/i.test(message)) {
      return this.makeResult('refine', 0.9, { ...slots }, 0);
    }

    // Sort commands
    const sortMatch = message.match(/sortea?ză?\s*(după|dupa)?\s*(preț|pret|dată|data|nou|vechi)/i);
    if (sortMatch) {
      const sortType = sortMatch[2].toLowerCase();
      if (sortType.includes('preț') || sortType.includes('pret')) {
        slots.sortBy = message.includes('desc') || message.includes('scump') ? 'price_desc' : 'price_asc';
      } else {
        slots.sortBy = 'newest';
      }
      return this.makeResult('refine', 0.9, slots, 0);
    }

    // Property details for shown listings
    if (
      slots.listingId &&
      /(detalii|mai multe|mai mult|spune-mi|povestește|povesteste|despre|asta|acesta|aceasta|prima|primul|a doua|a treia|ultima|ultimul)/i.test(message)
    ) {
      return this.makeResult('details', 0.92, slots, 0);
    }

    // Compare intent
    if (/compar|compara|vs|versus|diferenț|diferent/i.test(message)) {
      return this.makeResult('compare', 0.88, slots, 0);
    }

    // Extract structured data with regex
    this.extractSlotsFromText(message, slots);

    if (
      state &&
      (
        slots.neighborhood ||
        slots.priceMax ||
        slots.priceMin ||
        slots.rooms ||
        slots.roomsMin ||
        slots.roomsMax ||
        slots.surfaceMin ||
        slots.surfaceMax ||
        slots.propertyType ||
        slots.isFurnished !== undefined ||
        slots.petFriendly !== undefined ||
        slots.floorMin !== undefined ||
        slots.floorMax !== undefined ||
        slots.yearBuiltMin !== undefined ||
        slots.yearBuiltMax !== undefined ||
        (slots.amenities && slots.amenities.length > 0) ||
        (slots.dealbreakers && slots.dealbreakers.length > 0)
      )
    ) {
      return this.makeResult('refine', 0.86, slots, 0);
    }

    // If we have location or price, it's likely a search
    if (slots.city || slots.priceMax || slots.priceMin || slots.rooms) {
      // Check if it looks like a search query
      if (/caut|vreau|caută|găsește|arată|doresc|am nevoie/i.test(message) || 
          slots.city || slots.rooms) {
        return this.makeResult('search', 0.85, slots, 0);
      }
    }

    // Property type detection suggests search
    if (/apartament|casă|casa|garsonieră|garsoniera|studio|vilă|vila/i.test(message)) {
      this.extractPropertyType(message, slots);
      return this.makeResult('search', 0.8, slots, 0);
    }

    // Schedule viewing
    if (/programez|programează|vizionare|viewing|să văd|sa vad|vizit/i.test(message)) {
      return this.makeResult('schedule', 0.85, slots, 0);
    }

    // Mortgage / budget questions
    if (/credit|ipotecar|rată|rata|mortgage|împrumut|imprumut|buget|îmi permit|imi permit/i.test(message)) {
      return this.makeResult('mortgage', 0.85, slots, 0);
    }

    // Price check
    if (/preț\s*(corect|bun|ok|fair|rezonabil)|merită|merita|scump|ieftin|negociabil/i.test(message)) {
      return this.makeResult('price_check', 0.8, slots, 0);
    }

    // Area info
    if (/cartier|zonă|zona|neighborhood|despre\s+(botanica|buiucani|ciocana|rîșcani|centru)/i.test(message)) {
      return this.makeResult('area_info', 0.8, slots, 0);
    }

    // No confident match at Tier 0
    return this.makeResult('unclear', 0.3, slots, 0);
  }

  // ========================================================================
  // TIER 1: Cheap Model Classifier
  // ========================================================================

  private async tier1Classifier(
    message: string,
    state: ConversationState | null,
  ): Promise<RouterResult> {
    if (!this.openai) {
      return this.makeResult('unclear', 0.5, {}, 1, true, 'No OpenAI configured');
    }

    const systemPrompt = `You are an intent classifier for a real estate app in Moldova.

Classify the user message into ONE intent and extract any slots.

INTENTS:
- search: User wants to find properties
- refine: User wants to adjust/filter current results
- details: User asks about a specific property
- compare: User wants to compare properties
- schedule: User wants to schedule a viewing
- mortgage: User asks about financing/payments
- area_info: User asks about neighborhoods
- price_check: User asks if a price is fair
- greeting: Simple hello
- thanks: Thank you / goodbye
- help: Asks how to use the app
- unclear: Cannot determine

SLOTS to extract (only if mentioned):
- transactionType: RENT or SALE
- city: City name
- neighborhood: District/neighborhood
- priceMin, priceMax: Numbers in EUR
- rooms, roomsMin, roomsMax: Integer
- surfaceMin, surfaceMax: sqm
- propertyType: APARTMENT, HOUSE, STUDIO
- isFurnished, petFriendly: boolean
- floorMin, floorMax: preferred floor range
- yearBuiltMin, yearBuiltMax: construction year preferences
- dealbreakers: array of exclusions like "fara parter"
- amenities: array of strings
- listingId: if referencing specific property

CONTEXT (if available):
${state ? `Current preferences: ${JSON.stringify(state.preferences)}
Last shown listings: ${state.shownListingIds.slice(0, 5).join(', ')}` : 'No context'}

Respond in JSON:
{
  "intent": "search",
  "confidence": 0.9,
  "slots": { ... },
  "requiresStrongLLM": false,
  "reason": "optional reason if needs escalation"
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.cheapModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 300,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      return this.makeResult(
        result.intent || 'unclear',
        result.confidence || 0.5,
        result.slots || {},
        1,
        result.requiresStrongLLM || false,
        result.reason,
      );
    } catch (error: any) {
      this.logger.error(`Tier 1 classifier error: ${error.message}`);
      return this.makeResult('unclear', 0.4, {}, 1, true, 'Classifier error');
    }
  }

  // ========================================================================
  // SLOT EXTRACTION HELPERS
  // ========================================================================

  private extractSlotsFromText(message: string, slots: ExtractedSlots): void {
    // Cities - Moldova
    const cityPatterns = [
      { pattern: /chișinău|chisinau/i, value: 'Chișinău' },
      { pattern: /bălți|balti/i, value: 'Bălți' },
      { pattern: /cahul/i, value: 'Cahul' },
      { pattern: /ungheni/i, value: 'Ungheni' },
      { pattern: /orhei/i, value: 'Orhei' },
      { pattern: /soroca/i, value: 'Soroca' },
      { pattern: /comrat/i, value: 'Comrat' },
      { pattern: /edineț|edinet/i, value: 'Edineț' },
    ];

    for (const { pattern, value } of cityPatterns) {
      if (pattern.test(message)) {
        slots.city = value;
        break;
      }
    }

    // Chișinău neighborhoods
    const neighborhoodPatterns = [
      { pattern: /botanica/i, value: 'Botanica', city: 'Chișinău' },
      { pattern: /buiucani/i, value: 'Buiucani', city: 'Chișinău' },
      { pattern: /ciocana/i, value: 'Ciocana', city: 'Chișinău' },
      { pattern: /rîșcani|riscani|râșcani/i, value: 'Rîșcani', city: 'Chișinău' },
      { pattern: /centru/i, value: 'Centru', city: 'Chișinău' },
      { pattern: /telecentru/i, value: 'Telecentru', city: 'Chișinău' },
      { pattern: /sculeni/i, value: 'Sculeni', city: 'Chișinău' },
      { pattern: /poșta veche|posta veche/i, value: 'Poșta Veche', city: 'Chișinău' },
    ];

    for (const { pattern, value, city } of neighborhoodPatterns) {
      if (pattern.test(message)) {
        slots.neighborhood = value;
        if (!slots.city) slots.city = city;
        break;
      }
    }

    // Price extraction
    const priceMaxMatch = message.match(/(?:până la|pana la|sub|maxim|max|<|≤)\s*(\d+(?:[.,]\d+)?)\s*(?:€|euro?|eur)/i);
    if (priceMaxMatch) {
      slots.priceMax = parseFloat(priceMaxMatch[1].replace(',', '.'));
    }

    const priceMinMatch = message.match(/(?:de la|minim|min|>|≥|peste)\s*(\d+(?:[.,]\d+)?)\s*(?:€|euro?|eur)/i);
    if (priceMinMatch) {
      slots.priceMin = parseFloat(priceMinMatch[1].replace(',', '.'));
    }

    const priceRangeMatch = message.match(/(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(?:€|euro?|eur)/i);
    if (priceRangeMatch) {
      slots.priceMin = parseFloat(priceRangeMatch[1].replace(',', '.'));
      slots.priceMax = parseFloat(priceRangeMatch[2].replace(',', '.'));
    }

    // Just a number with euro might be max price
    if (!slots.priceMax && !slots.priceMin) {
      const simplePrice = message.match(/(\d{2,5})\s*(?:€|euro?|eur)/i);
      if (simplePrice) {
        slots.priceMax = parseFloat(simplePrice[1]);
      }
    }

    // Rooms extraction
    const roomsMatch = message.match(/(\d)\s*(?:camer[eăa]|rooms?|odai|odăi)/i);
    if (roomsMatch) {
      slots.rooms = parseInt(roomsMatch[1]);
    }

    // Surface extraction
    const surfaceMatch = message.match(/(\d+)\s*(?:mp|m²|metri)/i);
    if (surfaceMatch) {
      const surface = parseInt(surfaceMatch[1]);
      if (message.includes('minim') || message.includes('cel puțin')) {
        slots.surfaceMin = surface;
      } else if (message.includes('maxim') || message.includes('până')) {
        slots.surfaceMax = surface;
      } else {
        slots.surfaceMin = surface;
      }
    }

    // Transaction type
    if (/\b(chirie|închiri|inchiri|rent)\b/i.test(message)) {
      slots.transactionType = 'RENT';
    } else if (/\b(cumpăr|cumpar|vânzare|vanzare|buy|sale)\b/i.test(message)) {
      slots.transactionType = 'SALE';
    }

    this.extractPropertyType(message, slots);

    // Explicit listing ID
    const listingIdMatch = message.match(/(?:id|proprietat(?:ea|e)?|anunț(?:ul)?|anunt(?:ul)?)\s*[:#]?\s*(\d{1,8})/i);
    if (listingIdMatch) {
      slots.listingId = parseInt(listingIdMatch[1], 10);
    }

    // Boolean features
    if (/nemobilat|nemobilată|unfurnished/i.test(message)) {
      slots.isFurnished = false;
    } else if (/mobilat|mobilată|furnished/i.test(message)) {
      slots.isFurnished = true;
    }

    if (/fără animale|fara animale|nu acceptă animale|nu accepta animale/i.test(message)) {
      slots.petFriendly = false;
    } else if (/animale|pets?|câini|pisici|pet-friendly|pet friendly/i.test(message)) {
      slots.petFriendly = true;
    }

    // Floor preferences
    const floorRangeMatch = message.match(/etaj(?:ele|ul)?\s*(\d+)\s*[-–]\s*(\d+)/i);
    if (floorRangeMatch) {
      slots.floorMin = parseInt(floorRangeMatch[1], 10);
      slots.floorMax = parseInt(floorRangeMatch[2], 10);
    } else {
      const floorExactMatch = message.match(/etaj(?:ul)?\s*(\d+)/i);
      if (floorExactMatch) {
        const floor = parseInt(floorExactMatch[1], 10);
        slots.floorMin = floor;
        slots.floorMax = floor;
      }
    }

    if (/fără parter|fara parter|nu la parter/i.test(message)) {
      slots.floorMin = Math.max(slots.floorMin || 0, 1);
      slots.dealbreakers = slots.dealbreakers || [];
      if (!slots.dealbreakers.includes('fara parter')) {
        slots.dealbreakers.push('fara parter');
      }
    }

    if (/fără ultim(?:ul)? etaj|fara ultim(?:ul)? etaj|nu la ultimul etaj/i.test(message)) {
      slots.dealbreakers = slots.dealbreakers || [];
      if (!slots.dealbreakers.includes('fara ultimul etaj')) {
        slots.dealbreakers.push('fara ultimul etaj');
      }
    }

    // Year built / block age
    const newerThanMatch = message.match(/după|dupa\s*(19\d{2}|20\d{2})/i);
    if (newerThanMatch) {
      slots.yearBuiltMin = parseInt(newerThanMatch[1], 10);
    }

    const olderThanMatch = message.match(/înainte de|inainte de|mai vechi de\s*(19\d{2}|20\d{2})/i);
    if (olderThanMatch) {
      slots.yearBuiltMax = parseInt(olderThanMatch[1], 10);
    }

    if (/bloc nou|constructie nouă|construcție nouă|constructie noua|construcție noua/i.test(message)) {
      slots.yearBuiltMin = slots.yearBuiltMin || 2010;
      slots.dealbreakers = slots.dealbreakers || [];
      if (!slots.dealbreakers.includes('bloc nou')) {
        slots.dealbreakers.push('bloc nou');
      }
    }

    // Amenities
    const amenityPatterns = [
      { pattern: /parcare|parking/i, value: 'parcare' },
      { pattern: /balcon/i, value: 'balcon' },
      { pattern: /terasă|terasa/i, value: 'terasă' },
      { pattern: /centrală|centrala|încălzire centrală/i, value: 'centrală termică' },
      { pattern: /autonomă|autonoma/i, value: 'încălzire autonomă' },
      { pattern: /lift|ascensor/i, value: 'lift' },
      { pattern: /garaj/i, value: 'garaj' },
      { pattern: /grădină|gradina/i, value: 'grădină' },
    ];

    for (const { pattern, value } of amenityPatterns) {
      if (pattern.test(message)) {
        slots.amenities = slots.amenities || [];
        if (!slots.amenities.includes(value)) {
          slots.amenities.push(value);
        }
      }
    }
  }

  private resolveListingReference(
    message: string,
    state: ConversationState | null,
  ): number | undefined {
    const candidates = state?.lastShownProperties?.length
      ? state.lastShownProperties.map(property => property.id)
      : state?.shownListingIds || [];

    if (!candidates.length) {
      return undefined;
    }

    if (/prima|primul|first/i.test(message)) {
      return candidates[0];
    }
    if (/a doua|al doilea|second/i.test(message)) {
      return candidates[1];
    }
    if (/a treia|al treilea|third/i.test(message)) {
      return candidates[2];
    }
    if (/ultima|ultimul|last/i.test(message)) {
      return candidates[candidates.length - 1];
    }

    return undefined;
  }

  private extractPropertyType(message: string, slots: ExtractedSlots): void {
    if (/garsonier[aă]|studio/i.test(message)) {
      slots.propertyType = 'STUDIO';
    } else if (/cas[aă]|vil[aă]|house/i.test(message)) {
      slots.propertyType = 'HOUSE';
    } else if (/apartament/i.test(message)) {
      slots.propertyType = 'APARTMENT';
    }
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  private makeResult(
    intent: IntentType,
    confidence: number,
    slots: ExtractedSlots,
    tier: 0 | 1 | 2,
    shouldEscalate = false,
    reason?: string,
  ): RouterResult {
    return {
      intent: {
        type: intent,
        confidence,
        slots,
        requiresLLM: tier === 2 || shouldEscalate,
        tier,
      },
      shouldEscalate,
      reason,
    };
  }
}
