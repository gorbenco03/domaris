/**
 * 🤖 AI SERVICE - Asistent Inteligent pentru IMOBI
 * 
 * Funcționalități:
 * - Căutare în limbaj natural
 * - Generare descriere proprietăți
 * - Estimare preț bazată pe date piață
 * - Analiză calitate anunț
 * - Recomandări de optimizare
 * 
 * Provider: OpenAI (GPT-4o) cu fallback la GPT-3.5-turbo
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SearchService, SearchFilters } from '../search/search.service.js';
import { Listing } from '../../db/entities/listing.entity.js';
import { ListingImage } from '../../db/entities/listingImage.entity.js';
import OpenAI from 'openai';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SearchIntentResult {
  intent: 'search' | 'info' | 'comparison' | 'general';
  params?: SearchFilters;
  response?: string;
}

/**
 * Opțiuni pentru personalizarea comportamentului AI
 */
export interface AIContextOptions {
  /**
   * Instrucțiuni personalizate pentru AI (system prompt adițional)
   * Ex: "Răspunde doar în engleză", "Concentrează-te pe proprietăți de lux"
   */
  customInstructions?: string;

  /**
   * Preferințele implicite ale utilizatorului
   * AI le va folosi dacă utilizatorul nu specifică altceva
   */
  userPreferences?: {
    preferredCities?: string[];
    budgetMin?: number;
    budgetMax?: number;
    preferredRooms?: number;
    mustHave?: string[];  // ['balcon', 'parcare', 'centrală']
    dealBreakers?: string[]; // ['parter', 'agenție']
  };

  /**
   * Tonul răspunsurilor
   */
  tone?: 'professional' | 'friendly' | 'concise';

  /**
   * Limba răspunsurilor
   */
  language?: 'ro' | 'en';

  /**
   * Limitare rezultate
   */
  maxResults?: number;
}

export interface PropertyAnalysis {
  overallScore: number; // 0-100
  priceAnalysis: {
    isReasonable: boolean;
    suggestion?: string;
    marketComparison?: string;
    percentDiff?: number | null;
  };
  descriptionAnalysis: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  photosAnalysis: {
    count: number;
    suggestions: string[];
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
  }[];
}

export interface PropertySummary {
  summary: string;
  highlights: string[];
  amenities: string[];
  location: string;
  suitableFor: string[];
  cautions: string[];
  matchScore: number;
  priceComparison: {
    averagePrice: number;
    percentDiff: number | null;
    note: string;
  };
}

export interface GeneratedDescription {
  title: string;
  description: string;
  seoKeywords: string[];
  highlights: string[];
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI | null = null;
  private readonly model = 'gpt-4o-mini'; // Cost-effective, good for real estate

  constructor(private readonly searchService: SearchService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized successfully');
    } else {
      this.logger.warn('OPENAI_API_KEY not set - AI features will be disabled');
    }
  }

  // ========================================================================
  // 🗣️ CHAT - Natural Language Search
  // ========================================================================

  /**
   * Process a natural language query and return relevant properties
   * 
   * @param message - Mesajul utilizatorului
   * @param conversationHistory - Istoricul conversației pentru context
   * @param contextOptions - Opțiuni pentru personalizarea comportamentului AI
   */
  async chat(
    message: string,
    conversationHistory: AIMessage[] = [],
    contextOptions?: AIContextOptions
  ): Promise<{
    response: string;
    properties?: any[];
    intent: string;
    searchParams?: SearchFilters;
  }> {
    if (!this.openai) {
      return this.mockChatResponse(message);
    }

    try {
      // 1. Parse user intent with user preferences context
      const intent = await this.parseSearchIntent(message, contextOptions?.userPreferences);

      // Heuristic fallback for "show all listings"
      const wantsAllListings = /toate|toți|toate anunțurile|toate proprietățile|baza de date|tot ce aveți/i.test(
        message
      );
      if (wantsAllListings && intent.intent !== 'search') {
        intent.intent = 'search';
        intent.params = {};
      }
      if (intent.intent === 'search' && !intent.params) {
        intent.params = {};
      }
      // Heuristic: if we have search params (city, price, rooms, etc.) but intent is general, treat as search
      if (intent.intent === 'general' && intent.params && 
          (intent.params.city || intent.params.neighborhood || intent.params.priceMin || 
           intent.params.priceMax || intent.params.rooms || intent.params.roomsMin || 
           intent.params.roomsMax || intent.params.surfaceMin || intent.params.surfaceMax)) {
        intent.intent = 'search';
      }

      this.logger.log(
        `AI Chat intent=${intent.intent} params=${JSON.stringify(intent.params || {})}`
      );

      // 2. If it's a search intent, execute the search
      let properties: any[] = [];
      if (intent.intent === 'search' && intent.params) {
        // Apply user preferences as defaults if not specified
        let searchParams = this.mergeWithPreferences(intent.params, contextOptions?.userPreferences);
        searchParams = this.applyLocalHeuristics(message, searchParams);
        this.logger.log(`AI Chat search params=${JSON.stringify(searchParams)}`);

        const searchResult = await this.searchService.search({
          ...searchParams,
          limit: contextOptions?.maxResults ?? 5,
        });
        properties = searchResult.data;
        this.logger.log(
          `AI Chat search results=${properties.length} total=${searchResult.meta.total}`
        );

        if (properties.length === 0 && searchParams.propertyType) {
          const relaxedParams = { ...searchParams, propertyType: undefined };
          this.logger.log(
            `AI Chat retry without propertyType params=${JSON.stringify(relaxedParams)}`
          );
          const relaxedResult = await this.searchService.search({
            ...relaxedParams,
            limit: contextOptions?.maxResults ?? 5,
          });
          properties = relaxedResult.data;
          this.logger.log(
            `AI Chat relaxed results=${properties.length} total=${relaxedResult.meta.total}`
          );
        }
      }

      // 3. Generate conversational response with context
      const response = await this.generateConversationalResponse(
        message,
        intent,
        properties,
        conversationHistory,
        contextOptions
      );

      return {
        response,
        properties: properties.length > 0 ? properties : undefined,
        intent: intent.intent,
        searchParams: intent.params,
      };
    } catch (error: any) {
      this.logger.error(`AI Chat error: ${error.message}`);
      return this.mockChatResponse(message);
    }
  }

  /**
   * Combină parametrii căutării cu preferințele utilizatorului
   */
  private mergeWithPreferences(
    params: SearchFilters,
    preferences?: AIContextOptions['userPreferences']
  ): SearchFilters {
    if (!preferences) return params;

    return {
      ...params,
      // Aplică orașul preferat dacă nu e specificat
      city: params.city || preferences.preferredCities?.[0],
      // Aplică bugetul preferat dacă nu e specificat
      priceMin: params.priceMin ?? preferences.budgetMin,
      priceMax: params.priceMax ?? preferences.budgetMax,
      // Camer exclus - folosim doar ce a zis utilizatorul explicit
      rooms: params.rooms ?? preferences.preferredRooms,
    };
  }

  private applyLocalHeuristics(message: string, params: SearchFilters): SearchFilters {
    const next = { ...params };
    const normalizedMessage = message.toLowerCase();

    // Chișinău neighborhoods
    const chisinauNeighborhoods = ['botanica', 'buiucani', 'ciocana', 'riscani', 'rîșcani', 'centru'];
    for (const neighborhood of chisinauNeighborhoods) {
      if (normalizedMessage.includes(neighborhood)) {
        if (!next.city) next.city = 'Chișinău';
        if (!next.neighborhood) {
          // Capitalize first letter
          next.neighborhood = neighborhood.charAt(0).toUpperCase() + neighborhood.slice(1);
          // Fix Rîșcani spelling
          if (next.neighborhood.toLowerCase() === 'riscani') {
            next.neighborhood = 'Rîșcani';
          }
        }
        break;
      }
    }

    // Bălți neighborhoods
    const baltiNeighborhoods = ['dacia', 'slobozia', 'pamanteni', 'pământeni'];
    for (const neighborhood of baltiNeighborhoods) {
      if (normalizedMessage.includes(neighborhood)) {
        if (!next.city) next.city = 'Bălți';
        if (!next.neighborhood) {
          next.neighborhood = neighborhood.charAt(0).toUpperCase() + neighborhood.slice(1);
          if (next.neighborhood.toLowerCase() === 'pamanteni') {
            next.neighborhood = 'Pământeni';
          }
        }
        break;
      }
    }

    // Main cities detection
    if (normalizedMessage.includes('chisinau') || normalizedMessage.includes('chișinău')) {
      if (!next.city) next.city = 'Chișinău';
    }
    if (normalizedMessage.includes('balti') || normalizedMessage.includes('bălți')) {
      if (!next.city) next.city = 'Bălți';
    }

    return next;
  }

  /**
   * Parse natural language to search parameters
   */
  private async parseSearchIntent(
    message: string,
    userPreferences?: AIContextOptions['userPreferences']
  ): Promise<SearchIntentResult> {
    if (!this.openai) {
      return { intent: 'general' };
    }

    // Include user preferences in the parsing context
    const preferencesContext = userPreferences
      ? `\n\nPreferințele utilizatorului (folosește-le ca default dacă nu specifică altceva):
- Orașe preferate: ${userPreferences.preferredCities?.join(', ') || 'nespecificate'}
- Buget: ${userPreferences.budgetMin || '?'} - ${userPreferences.budgetMax || '?'} EUR
- Camere preferate: ${userPreferences.preferredRooms || 'nespecificate'}
- Must have: ${userPreferences.mustHave?.join(', ') || 'nespecificate'}
- Deal breakers: ${userPreferences.dealBreakers?.join(', ') || 'nespecificate'}`
      : '';

    const systemPrompt = `Ești un asistent imobiliar care parsează cereri de căutare în limba română pentru platforma IMOBI din Republica Moldova.
    
Extrage parametrii de căutare din mesajul utilizatorului și returnează un JSON cu structura:
{
  "intent": "search" | "info" | "comparison" | "general",
  "params": {
    "city": "numele orașului",
    "neighborhood": "cartierul (dacă e specificat)",
    "priceMin": număr (în EUR),
    "priceMax": număr (în EUR),
    "rooms": număr de camere,
    "roomsMin": minim camere,
    "roomsMax": maxim camere,
    "surfaceMin": suprafață minimă mp,
    "surfaceMax": suprafață maximă mp,
    "isFurnished": true/false,
    "petFriendly": true/false
  }
}

CONTEXT: Aplicația funcționează DOAR în Republica Moldova. Orașele principale sunt: Chișinău, Bălți, Cahul, Ungheni, Orhei, Soroca, Edineț, Comrat, etc.

REGULI PENTRU INTENT (FOARTE IMPORTANT):
- "search": ORICE mesaj care menționează un oraș, zonă, preț, camere, suprafață sau tip de proprietate
- "search": "apartament în Chișinău", "vreau ceva în Bălți", "caut în Botanica" = ÎNTOTDEAUNA search
- "search": Dacă utilizatorul menționează O LOCAȚIE din Moldova, este ÎNTOTDEAUNA "search"
- "info": Întrebări despre o proprietate specifică sau despre cum funcționează platforma
- "comparison": Când utilizatorul vrea să compare proprietăți
- "general": DOAR pentru salutări simple ("bună", "salut") sau întrebări complet nerelatate de imobiliare

Reguli pentru params:
- "apartament cu 2 camere" → rooms: 2
- "între 300 și 500 euro" → priceMin: 300, priceMax: 500
- "maxim 400 euro" → priceMax: 400
- "minim 50mp" → surfaceMin: 50
- "în Chișinău" sau "Chișinău" → city: "Chișinău"
- "Botanica" sau "în Botanica" → city: "Chișinău", neighborhood: "Botanica"
- "Buiucani", "Ciocana", "Rîșcani", "Centru" → city: "Chișinău", neighborhood: "<cartierul>"
- "în Bălți" sau "Bălți" → city: "Bălți"
- "Orhei", "Ungheni", "Cahul", etc. → city: "<numele orașului>"${preferencesContext}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result as SearchIntentResult;
    } catch (error: any) {
      this.logger.error(`Intent parsing error: ${error.message}`);
      return { intent: 'general' };
    }
  }

  /**
   * Generate a conversational response based on search results
   */
  private async generateConversationalResponse(
    userMessage: string,
    intent: SearchIntentResult,
    properties: any[],
    history: AIMessage[],
    contextOptions?: AIContextOptions
  ): Promise<string> {
    if (!this.openai) {
      return this.generateMockResponse(intent, properties);
    }

    // Build system prompt based on context options
    const toneGuide = {
      professional: 'Răspunde formal și profesional.',
      friendly: 'Răspunde într-un ton cald și prietenos.',
      concise: 'Răspunde foarte scurt și la obiect.',
    };

    const languageGuide = contextOptions?.language === 'en' 
      ? 'Respond in English.'
      : 'Răspunde în română.';

    const customInstructions = contextOptions?.customInstructions
      ? `\n\nInstrucțiuni speciale: ${contextOptions.customInstructions}`
      : '';

    const systemPrompt = `Ești IMOBI Assistant, un asistent imobiliar pentru platforma IMOBI din Republica Moldova.
    
Regulile tale:
1. ${languageGuide}
2. ${toneGuide[contextOptions?.tone || 'friendly']}
3. NU folosi markdown (fără **, *, _, #, \`, etc.) - răspunde cu text simplu
4. Dacă ai găsit proprietăți, menționează pe scurt ce ai găsit și oferă detalii relevante
5. Dacă utilizatorul vrea să discute despre o proprietate menționată anterior în conversație, oferă detalii despre ea bazându-te pe istoricul conversației
6. Sugerează cum poate rafina căutarea sau ce informații suplimentare poate cere
7. Nu inventa informații despre proprietăți - folosește doar datele disponibile
8. Dacă nu ai găsit nimic, sugerează alternative
9. Fii proactiv și oferă informații utile despre proprietățile discutate${customInstructions}`;

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        {
          role: 'user',
          content: `Mesajul utilizatorului: "${userMessage}"
          
Intent detectat: ${intent.intent}
Parametri căutare: ${JSON.stringify(intent.params || {})}
Proprietăți găsite în această căutare: ${properties.length}

${properties.length > 0 ? `DETALII PROPRIETĂȚI GĂSITE:
${properties.map((p, i) => `
${i + 1}. ${p.title}
   - Preț: ${p.priceEur}€${p.transactionType === 'RENT' ? '/lună' : ''}
   - Locație: ${[p.neighborhood, p.city].filter(Boolean).join(', ')}
   - Camere: ${p.rooms || 'N/A'}, Suprafață: ${p.surfaceSqm || 'N/A'} mp
   - Etaj: ${p.floor ?? 'N/A'}${p.totalFloors ? `/${p.totalFloors}` : ''}
   - Anul construcției: ${p.yearBuilt || 'N/A'}
   - Facilități: ${(p.amenities || []).slice(0, 5).join(', ') || 'N/A'}
   - Descriere: ${(p.description || '').substring(0, 200)}${(p.description || '').length > 200 ? '...' : ''}
`).join('')}` : 'Nu am găsit proprietăți noi în această căutare. Verifică istoricul conversației pentru proprietăți menționate anterior.'}

Generează un răspuns conversațional prietenos. Dacă utilizatorul vrea detalii despre o proprietate, oferă informațiile disponibile mai sus.`,
        },
      ];

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0].message.content || 'Îmi pare rău, am întâmpinat o eroare.';
    } catch (error: any) {
      this.logger.error(`Response generation error: ${error.message}`);
      return this.generateMockResponse(intent, properties);
    }
  }

  // ========================================================================
  // 📝 GENERATE DESCRIPTION
  // ========================================================================

  /**
   * Generate property description from characteristics
   */
  async generateDescription(
    propertyData: {
      propertyType: string;
      transactionType: string;
      rooms?: number;
      surface?: number;
      city: string;
      neighborhood?: string;
      floor?: number;
      totalFloors?: number;
      amenities?: string[];
      yearBuilt?: number;
    },
    style: 'professional' | 'friendly' | 'luxurious' = 'professional'
  ): Promise<GeneratedDescription> {
    if (!this.openai) {
      return this.mockGenerateDescription(propertyData);
    }

    const styleGuides = {
      professional: 'Ton formal, factual, pentru profesioniști',
      friendly: 'Ton cald, accesibil, pentru familii',
      luxurious: 'Ton elegant, sofisticat, pentru proprietăți de lux',
    };

    const prompt = `Generează o descriere atractivă pentru următoarea proprietate imobiliară din România.

Caracteristici:
- Tip: ${propertyData.propertyType}
- Tranzacție: ${propertyData.transactionType}
- Camere: ${propertyData.rooms || 'nespecificat'}
- Suprafață: ${propertyData.surface || 'nespecificată'} mp
- Locație: ${propertyData.city}${propertyData.neighborhood ? `, ${propertyData.neighborhood}` : ''}
- Etaj: ${propertyData.floor ?? 'nespecificat'}${propertyData.totalFloors ? ` din ${propertyData.totalFloors}` : ''}
- An construcție: ${propertyData.yearBuilt || 'nespecificat'}
- Dotări: ${propertyData.amenities?.join(', ') || 'nespecificate'}

Stil: ${styleGuides[style]}

Returnează un JSON cu:
{
  "title": "Titlu atractiv max 100 caractere",
  "description": "Descriere detaliată 200-400 cuvinte",
  "seoKeywords": ["keyword1", "keyword2", ...],
  "highlights": ["Punct forte 1", "Punct forte 2", ...]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error: any) {
      this.logger.error(`Description generation error: ${error.message}`);
      return this.mockGenerateDescription(propertyData);
    }
  }

  // ========================================================================
  // 📊 ANALYZE PROPERTY
  // ========================================================================

  /**
   * Analyze a property listing and provide improvement suggestions
   */
  async analyzeProperty(propertyId: number): Promise<PropertyAnalysis> {
    const property = await Listing.findByPk(propertyId);

    if (!property) {
      throw new BadRequestException('Property not found');
    }

    // Get comparable properties for price analysis
    const comparables = await this.searchService.search({
      city: property.city,
      rooms: property.rooms,
      priceMin: property.priceEur * 0.7,
      priceMax: property.priceEur * 1.3,
      limit: 10,
    });

    const avgPrice =
      comparables.data.length > 0
        ? comparables.data.reduce((sum: number, p: any) => sum + (p.priceEur || 0), 0) /
          comparables.data.length
        : property.priceEur;
    const percentDiff =
      avgPrice && property.priceEur ? ((property.priceEur - avgPrice) / avgPrice) * 100 : undefined;

    if (!this.openai) {
      const mock = this.mockAnalyzeProperty(property, comparables.data);
      return { ...mock, priceAnalysis: { ...mock.priceAnalysis, percentDiff } };
    }

    const prompt = `Analizează acest anunț imobiliar și oferă sugestii de îmbunătățire.

Anunț:
- Titlu: ${property.title}
- Descriere: ${property.description || 'Lipsește'}
- Preț: ${property.priceEur} EUR
- Oraș: ${property.city}
- Camere: ${property.rooms}
- Suprafață: ${property.surfaceSqm} mp
- Poze: ${property.images?.length ?? 0} imagini

Proprietăți similare în zonă (${comparables.meta.total} găsite):
${comparables.data.slice(0, 5).map((p: any) => `- ${p.title}: ${p.priceEur} EUR`).join('\n')}

Returnează un JSON cu structura PropertyAnalysis (vezi tipul).
overallScore: 0-100
priceAnalysis: { isReasonable: bool, suggestion?, marketComparison? }
descriptionAnalysis: { score: 0-100, issues: [], suggestions: [] }
photosAnalysis: { count: number, suggestions: [] }
recommendations: [{ priority: high/medium/low, title, description, impact }]`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        ...parsed,
        priceAnalysis: {
          ...parsed.priceAnalysis,
          percentDiff: parsed.priceAnalysis?.percentDiff ?? percentDiff,
        },
      };
    } catch (error: any) {
      this.logger.error(`Property analysis error: ${error.message}`);
      const mock = this.mockAnalyzeProperty(property, comparables.data);
      return { ...mock, priceAnalysis: { ...mock.priceAnalysis, percentDiff } };
    }
  }

  /**
   * Analyze a draft listing (no propertyId yet)
   */
  async analyzeListingDraft(input: {
    title?: string;
    description?: string;
    priceEur?: number;
    city?: string;
    rooms?: number;
    surfaceSqm?: number;
    photosCount?: number;
  }): Promise<PropertyAnalysis> {
    if (!input.city || !input.priceEur || !input.rooms || !input.surfaceSqm) {
      throw new BadRequestException('Date insuficiente pentru analiză');
    }

    const comparables = await this.searchService.search({
      city: input.city,
      rooms: input.rooms,
      priceMin: input.priceEur * 0.7,
      priceMax: input.priceEur * 1.3,
      limit: 10,
    });

    const avgPrice =
      comparables.data.length > 0
        ? comparables.data.reduce((sum: number, p: any) => sum + (p.priceEur || 0), 0) /
          comparables.data.length
        : input.priceEur;
    const percentDiff =
      avgPrice && input.priceEur ? ((input.priceEur - avgPrice) / avgPrice) * 100 : undefined;

    if (!this.openai) {
      const mock = this.mockAnalyzeProperty(
        {
          title: input.title,
          description: input.description,
          priceEur: input.priceEur,
          city: input.city,
          rooms: input.rooms,
          surfaceSqm: input.surfaceSqm,
          images: Array(input.photosCount || 0),
        },
        comparables.data
      );
      return { ...mock, priceAnalysis: { ...mock.priceAnalysis, percentDiff } };
    }

    const prompt = `Analizează acest anunț imobiliar și oferă sugestii de îmbunătățire.

Anunț:
- Titlu: ${input.title || 'Lipsește'}
- Descriere: ${input.description || 'Lipsește'}
- Preț: ${input.priceEur} EUR
- Oraș: ${input.city}
- Camere: ${input.rooms}
- Suprafață: ${input.surfaceSqm} mp
- Poze: ${input.photosCount ?? 0} imagini

Proprietăți similare în zonă (${comparables.meta.total} găsite):
${comparables.data.slice(0, 5).map((p: any) => `- ${p.title}: ${p.priceEur} EUR`).join('\n')}

Returnează un JSON cu structura PropertyAnalysis (vezi tipul).
overallScore: 0-100
priceAnalysis: { isReasonable: bool, suggestion?, marketComparison? }
descriptionAnalysis: { score: 0-100, issues: [], suggestions: [] }
photosAnalysis: { count: number, suggestions: [] }
recommendations: [{ priority: high/medium/low, title, description, impact }]`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        ...parsed,
        priceAnalysis: {
          ...parsed.priceAnalysis,
          percentDiff: parsed.priceAnalysis?.percentDiff ?? percentDiff,
        },
      };
    } catch (error: any) {
      this.logger.error(`Draft analysis error: ${error.message}`);
      const mock = this.mockAnalyzeProperty(
        {
          title: input.title,
          description: input.description,
          priceEur: input.priceEur,
          city: input.city,
          rooms: input.rooms,
          surfaceSqm: input.surfaceSqm,
          images: Array(input.photosCount || 0),
        },
        comparables.data
      );
      return { ...mock, priceAnalysis: { ...mock.priceAnalysis, percentDiff } };
    }
  }

  /**
   * Summarize a property for seekers
   */
  async summarizeProperty(propertyId: number): Promise<PropertySummary> {
    const property = await Listing.findByPk(propertyId);

    if (!property) {
      throw new BadRequestException('Property not found');
    }

    const photosCount = await ListingImage.count({ where: { listingId: propertyId } });

    const comparables = await this.searchService.search({
      city: property.city,
      rooms: property.rooms,
      priceMin: property.priceEur * 0.7,
      priceMax: property.priceEur * 1.3,
      limit: 10,
    });

    const avgPrice =
      comparables.data.length > 0
        ? comparables.data.reduce((sum: number, p: any) => sum + (p.priceEur || 0), 0) /
          comparables.data.length
        : property.priceEur;
    const percentDiff =
      avgPrice && property.priceEur ? ((property.priceEur - avgPrice) / avgPrice) * 100 : null;
    const priceNote =
      percentDiff === null
        ? 'Nu există suficiente comparabile.'
        : percentDiff > 10
          ? `Prețul este cu ~${Math.abs(percentDiff).toFixed(0)}% peste media zonei.`
          : percentDiff < -10
            ? `Prețul este cu ~${Math.abs(percentDiff).toFixed(0)}% sub media zonei.`
            : 'Prețul este în linie cu media zonei.';

    if (!this.openai) {
      return this.mockSummarizeProperty(property, photosCount, {
        averagePrice: Math.round(avgPrice),
        percentDiff,
        note: priceNote,
      });
    }

    const prompt = `Rezuma această proprietate pentru un potențial cumpărător/chiriaș.

Detalii:
- Titlu: ${property.title}
- Descriere: ${property.description || 'Lipsește'}
- Preț: ${property.priceEur} EUR
- Tip tranzacție: ${property.transactionType}
- Tip proprietate: ${property.propertyType}
- Oraș: ${property.city}
- Cartier: ${property.neighborhood || 'N/A'}
- Camere: ${property.rooms}
- Suprafață: ${property.surfaceSqm} mp
- Etaj: ${property.floor ?? 'N/A'}
- Total etaje: ${property.totalFloors ?? 'N/A'}
- Facilități: ${(property.amenities || []).join(', ') || 'N/A'}
- Poze: ${photosCount} imagini

Returnează JSON cu structura:
{
  "summary": string,
  "highlights": string[],
  "amenities": string[],
  "location": string,
  "suitableFor": string[],
  "cautions": string[],
  "matchScore": number,
  "priceComparison": { "averagePrice": number, "percentDiff": number | null, "note": string }
}
Reguli:
- Răspunde în română
- Fără presupuneri neconfirmate
- Evidențiază ce este cu adevărat în date
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        ...parsed,
        matchScore: typeof parsed.matchScore === 'number' ? parsed.matchScore : 75,
        priceComparison: {
          averagePrice: parsed.priceComparison?.averagePrice ?? Math.round(avgPrice),
          percentDiff: parsed.priceComparison?.percentDiff ?? percentDiff,
          note: parsed.priceComparison?.note ?? priceNote,
        },
      };
    } catch (error: any) {
      this.logger.error(`Property summary error: ${error.message}`);
      return this.mockSummarizeProperty(property, photosCount, {
        averagePrice: Math.round(avgPrice),
        percentDiff,
        note: priceNote,
      });
    }
  }

  // ========================================================================
  // 💰 PRICE ESTIMATION
  // ========================================================================

  /**
   * Estimate property price based on market data
   */
  async estimatePrice(params: {
    city: string;
    neighborhood?: string;
    propertyType: string;
    rooms: number;
    surface: number;
    floor?: number;
    yearBuilt?: number;
  }): Promise<{
    estimatedPrice: number;
    priceRange: { min: number; max: number };
    confidence: number;
    comparables: { avgPrice: number; avgPricePerSqm: number; count: number };
  }> {
    // Get comparable properties
    const comparables = await this.searchService.search({
      city: params.city,
      neighborhood: params.neighborhood,
      rooms: params.rooms,
      surfaceMin: params.surface * 0.8,
      surfaceMax: params.surface * 1.2,
      limit: 20,
    });

    if (comparables.data.length === 0) {
      return {
        estimatedPrice: 0,
        priceRange: { min: 0, max: 0 },
        confidence: 0,
        comparables: { avgPrice: 0, avgPricePerSqm: 0, count: 0 },
      };
    }

    // Calculate statistics - use priceEur and surfaceSqm from Listing entity
    const prices = comparables.data.map((p: any) => p.priceEur as number);
    const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    const avgPricePerSqm =
      comparables.data.reduce(
        (sum: number, p: any) => sum + ((p.priceEur as number) / ((p.surfaceSqm as number) || 1)),
        0
      ) / comparables.data.length;

    const estimatedPrice = Math.round(avgPricePerSqm * params.surface);
    const stdDev = Math.sqrt(
      prices.reduce((sum: number, p: number) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length
    );

    // Confidence based on sample size and variance
    const confidence = Math.min(
      0.95,
      Math.max(0.3, 0.6 + 0.02 * comparables.data.length - (stdDev / avgPrice) * 0.5)
    );

    return {
      estimatedPrice,
      priceRange: {
        min: Math.round(estimatedPrice - stdDev * 0.5),
        max: Math.round(estimatedPrice + stdDev * 0.5),
      },
      confidence: Math.round(confidence * 100) / 100,
      comparables: {
        avgPrice: Math.round(avgPrice),
        avgPricePerSqm: Math.round(avgPricePerSqm),
        count: comparables.data.length,
      },
    };
  }

  // ========================================================================
  // 🧪 MOCK RESPONSES (when OpenAI is not configured)
  // ========================================================================

  private mockChatResponse(message: string) {
    return {
      response: `Îmi pare rău, asistentul AI nu este disponibil momentan. Am primit mesajul: "${message.substring(0, 50)}..."

Pentru a activa funcționalitățile AI, configurează variabila OPENAI_API_KEY.`,
      intent: 'disabled',
    };
  }

  private generateMockResponse(intent: SearchIntentResult, properties: any[]) {
    if (properties.length > 0) {
      return `Am găsit ${properties.length} proprietăți care corespund criteriilor tale. Verifică lista de mai jos!`;
    }
    return 'Nu am găsit proprietăți care să corespundă criteriilor. Încearcă să ajustezi filtrele.';
  }

  private mockGenerateDescription(propertyData: any): GeneratedDescription {
    return {
      title: `${propertyData.propertyType} ${propertyData.rooms || ''} camere în ${propertyData.city}`,
      description: `Oferim spre ${propertyData.transactionType === 'RENT' ? 'închiriere' : 'vânzare'} un ${propertyData.propertyType.toLowerCase()} cu ${propertyData.rooms || 'N/A'} camere în ${propertyData.city}. Suprafața utilă este de ${propertyData.surface || 'N/A'} mp. Proprietatea se află${propertyData.floor ? ` la etajul ${propertyData.floor}` : ''} într-o zonă liniștită, cu acces facil la transportul în comun și aproape de facilități urbane. Pentru mai multe detalii, vă rugăm să ne contactați.`,
      seoKeywords: [
        propertyData.propertyType.toLowerCase(),
        propertyData.city.toLowerCase(),
        `${propertyData.rooms} camere`,
        propertyData.transactionType === 'RENT' ? 'chirie' : 'vânzare',
      ],
      highlights: ['Locație convenabilă', 'Transport în apropiere', 'Zonă liniștită'],
    };
  }

  private mockAnalyzeProperty(property: any, comparables: any[]): PropertyAnalysis {
    const avgPrice =
      comparables.length > 0
        ? comparables.reduce((sum, p) => sum + (p.priceEur || 0), 0) / comparables.length
        : property.priceEur;

    const priceDeviation = ((property.priceEur - avgPrice) / avgPrice) * 100;

    return {
      overallScore: 65,
      priceAnalysis: {
        isReasonable: Math.abs(priceDeviation) < 15,
        suggestion:
          priceDeviation > 15
            ? 'Prețul pare să fie peste media pieței. Consideră reducerea cu 10-15%.'
            : priceDeviation < -15
              ? 'Prețul este sub media pieței. Ai potențial să crești prețul.'
              : undefined,
        marketComparison: `Prețul tău este ${priceDeviation > 0 ? 'cu' : 'sub'} ${Math.abs(priceDeviation).toFixed(0)}% ${priceDeviation > 0 ? 'peste' : 'sub'} media zonei.`,
      },
      descriptionAnalysis: {
        score: property.description ? 60 : 20,
        issues: property.description ? [] : ['Descrierea lipsește'],
        suggestions: [
          'Adaugă detalii despre renovări recente',
          'Menționează vecinătatea și facilitățile',
          'Include cuvinte cheie relevante pentru SEO',
        ],
      },
      photosAnalysis: {
        count: 0,
        suggestions: [
          'Adaugă minim 10 fotografii de calitate',
          'Include imagini cu fiecare cameră',
          'Adaugă fotografii cu vederea de la ferestre',
        ],
      },
      recommendations: [
        {
          priority: 'high',
          title: 'Adaugă fotografii profesionale',
          description:
            'Proprietățile cu 10+ fotografii primesc de 3x mai multe vizualizări.',
          impact: 'Crește vizualizările cu până la 200%',
        },
        {
          priority: 'medium',
          title: 'Îmbunătățește descrierea',
          description: 'Adaugă detalii despre dotări, renovări și beneficii ale locației.',
          impact: 'Crește rata de contact cu 40%',
        },
      ],
    };
  }

  private mockSummarizeProperty(
    property: any,
    photosCount: number,
    priceComparison: { averagePrice: number; percentDiff: number | null; note: string }
  ): PropertySummary {
    return {
      summary: `Proprietate ${property.propertyType || ''} în ${property.city} cu ${property.rooms || 'N/A'} camere și ${property.surfaceSqm || 'N/A'} mp. ${property.description ? 'Descriere disponibilă.' : 'Descrierea lipsește.'}`,
      highlights: [
        `${property.surfaceSqm || 'N/A'} mp`,
        `${property.rooms || 'N/A'} camere`,
        property.transactionType === 'RENT' ? 'Disponibilă la închiriere' : 'Disponibilă la vânzare',
        `${photosCount} fotografii`,
      ],
      amenities: property.amenities || [],
      location: [property.neighborhood, property.city].filter(Boolean).join(', ') || property.city,
      suitableFor: ['familie', 'cuplu', 'investiție'],
      cautions: property.description ? [] : ['Descrierea lipsește'],
      matchScore: 78,
      priceComparison,
    };
  }
}
