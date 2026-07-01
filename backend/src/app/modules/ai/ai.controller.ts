/**
 * 🤖 AI CONTROLLER - Asistent Inteligent API
 * 
 * Endpoints:
 * - POST /ai/chat              - Conversație în limbaj natural (legacy)
 * - POST /ai/agent/chat        - Conversational Agent (NEW - multi-tier)
 * - POST /ai/agent/valuation   - AVM Price Recommendation (NEW)
 * - GET  /ai/agent/valuation/:listingId - AVM for existing listing
 * - POST /ai/generate-description - Generare descriere proprietate
 * - GET  /ai/analyze/:propertyId  - Analiză calitate anunț
 * - POST /ai/estimate-price    - Estimare preț bazată pe piață (legacy)
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AIService } from './ai.service.js';
import { AIGatewayService } from './gateway/ai-gateway.service.js';
import { AiConversationService } from './conversation/ai-conversation.service.js';
import { Public, MinVerificationLevel, CurrentUser } from '../../core/decorators.js';
import { Throttle } from '@nestjs/throttler';
import { AVMInput } from './types/index.js';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsObject,
  IsOptional,
  IsIn,
} from 'class-validator';

// ============================================================================
// DTOs
// ============================================================================

class UserPreferencesDto {
  preferredCities?: string[];
  budgetMin?: number;
  budgetMax?: number;
  preferredRooms?: number;
  mustHave?: string[];
  dealBreakers?: string[];
}

class ChatContextOptionsDto {
  customInstructions?: string;
  userPreferences?: UserPreferencesDto;
  tone?: 'professional' | 'friendly' | 'concise';
  language?: 'ro' | 'en';
  maxResults?: number;
}

class ChatRequestBody {
  @IsString()
  message!: string;
  @IsOptional()
  @IsArray()
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  /**
   * Opțiuni pentru personalizarea comportamentului AI
   */
  @IsOptional()
  @IsObject()
  context?: ChatContextOptionsDto;
}

class GenerateDescriptionBody {
  @IsString()
  propertyType!: string;
  @IsString()
  transactionType!: string;
  @IsOptional()
  @IsNumber()
  rooms?: number;
  @IsOptional()
  @IsNumber()
  surface?: number;
  @IsString()
  city!: string;
  @IsOptional()
  @IsString()
  neighborhood?: string;
  @IsOptional()
  @IsNumber()
  floor?: number;
  @IsOptional()
  @IsNumber()
  totalFloors?: number;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
  @IsOptional()
  @IsNumber()
  yearBuilt?: number;
  @IsOptional()
  @IsIn(['professional', 'friendly', 'luxurious'])
  style?: 'professional' | 'friendly' | 'luxurious';
}

class EstimatePriceBody {
  @IsString()
  city!: string;
  @IsOptional()
  @IsString()
  neighborhood?: string;
  @IsString()
  propertyType!: string;
  @IsNumber()
  rooms!: number;
  @IsNumber()
  surface!: number;
  @IsOptional()
  @IsNumber()
  floor?: number;
  @IsOptional()
  @IsNumber()
  yearBuilt?: number;
}

class PropertySummaryResponse {
  summary!: string;
  highlights!: string[];
  amenities!: string[];
  location!: string;
  suitableFor!: string[];
  cautions!: string[];
  matchScore!: number;
  priceComparison!: {
    averagePrice: number;
    percentDiff: number | null;
    note: string;
  };
}

class AnalyzeListingBody {
  @IsOptional()
  @IsNumber()
  propertyId?: number;
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsNumber()
  priceEur?: number;
  @IsOptional()
  @IsString()
  city?: string;
  @IsOptional()
  @IsNumber()
  rooms?: number;
  @IsOptional()
  @IsNumber()
  surfaceSqm?: number;
  @IsOptional()
  @IsNumber()
  photosCount?: number;
}

class AgentChatBody {
  @IsString()
  message!: string;
  @IsOptional()
  @IsString()
  conversationId?: string;
  @IsOptional()
  @IsObject()
  context?: {
    tone?: 'professional' | 'friendly' | 'concise';
    language?: 'ro' | 'en';
    maxResults?: number;
    userPreferences?: Partial<UserPreferencesDto>;
  };
}

class AVMRequestBody {
  @IsString()
  city!: string;
  @IsOptional()
  @IsString()
  neighborhood?: string;
  @IsString()
  propertyType!: string;
  @IsIn(['RENT', 'SALE'])
  transactionType!: 'RENT' | 'SALE';
  @IsNumber()
  rooms!: number;
  @IsNumber()
  surfaceSqm!: number;
  @IsOptional()
  @IsNumber()
  floor?: number;
  @IsOptional()
  @IsNumber()
  totalFloors?: number;
  @IsOptional()
  @IsNumber()
  yearBuilt?: number;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
  @IsOptional()
  @IsIn(['new', 'renovated', 'good', 'needs_work'])
  condition?: 'new' | 'renovated' | 'good' | 'needs_work';
  @IsOptional()
  @IsBoolean()
  isFurnished?: boolean;
}

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
// AI endpoints hit OpenAI — tighter rate limit to control cost
@Throttle({ global: { limit: 20, ttl: 60000 } })
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly aiGateway: AIGatewayService,
    private readonly aiConversationService: AiConversationService,
  ) {}

  // ========================================================================
  // 💬 CHAT - Natural Language Search
  // ========================================================================

  @Post('chat')
  @ApiOperation({
    summary: 'Chat with AI Assistant',
    description: `Send a natural language message to search for properties or get assistance.
    
**Context Options:**
- \`customInstructions\`: Instrucțiuni speciale pentru AI (ex: "Concentrează-te pe apartamente de lux")
- \`userPreferences\`: Preferințe implicite (orașe, buget, camere, must-have, deal-breakers)
- \`tone\`: Tonul răspunsului (professional, friendly, concise)
- \`language\`: Limba răspunsului (ro, en)
- \`maxResults\`: Numărul maxim de proprietăți returnate`,
  })
  @ApiBody({ type: ChatRequestBody })
  @ApiResponse({
    status: 200,
    description: 'AI response with optional property results',
    schema: {
      example: {
        response:
          'Am găsit 5 apartamente cu 2 camere în Cluj-Napoca sub 400€/lună.',
        properties: [],
        intent: 'search',
        searchParams: { city: 'Cluj-Napoca', rooms: 2, priceMax: 400 },
      },
    },
  })
  async chat(@Body() body: ChatRequestBody) {
    return this.aiService.chat(
      body.message,
      body.conversationHistory,
      body.context
    );
  }

  // ========================================================================
  // 📝 GENERATE DESCRIPTION
  // ========================================================================

  @Post('generate-description')
  @MinVerificationLevel(1)
  @ApiOperation({
    summary: 'Generate property description using AI',
    description:
      'Uses AI to generate an attractive property description based on characteristics.',
  })
  @ApiBody({ type: GenerateDescriptionBody })
  @ApiResponse({
    status: 200,
    description: 'Generated description with title, body, and SEO keywords',
    schema: {
      example: {
        title: 'Apartament modern 2 camere în Mărăști',
        description: 'Oferim spre închiriere un apartament...',
        seoKeywords: ['apartament', 'cluj-napoca', '2 camere'],
        highlights: ['Renovat recent', 'Parcare inclusă'],
      },
    },
  })
  async generateDescription(@Body() body: GenerateDescriptionBody) {
    const { style, ...propertyData } = body;
    return this.aiService.generateDescription(propertyData, style);
  }

  // ========================================================================
  // 📊 ANALYZE PROPERTY
  // ========================================================================

  @Get('analyze/:propertyId')
  @MinVerificationLevel(2)
  @ApiOperation({
    summary: 'Analyze property listing quality',
    description:
      'Provides AI-powered analysis of listing quality with improvement suggestions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Property analysis with scores and recommendations',
    schema: {
      example: {
        overallScore: 65,
        priceAnalysis: {
          isReasonable: true,
          marketComparison: 'Prețul este cu 5% sub media zonei.',
        },
        descriptionAnalysis: {
          score: 60,
          issues: [],
          suggestions: ['Adaugă detalii despre renovări'],
        },
        recommendations: [
          {
            priority: 'high',
            title: 'Adaugă fotografii',
            description: 'Proprietățile cu 10+ fotografii...',
            impact: 'Crește vizualizările cu 200%',
          },
        ],
      },
    },
  })
  async analyzeProperty(@Param('propertyId', ParseIntPipe) propertyId: number) {
    return this.aiService.analyzeProperty(propertyId);
  }

  @Post('analyze-listing')
  @MinVerificationLevel(1)
  @ApiOperation({
    summary: 'Analyze a listing (draft or existing)',
    description:
      'Analyze a listing by propertyId or raw listing data for draft flows.',
  })
  @ApiBody({ type: AnalyzeListingBody })
  async analyzeListing(@Body() body: AnalyzeListingBody) {
    if (body.propertyId) {
      return this.aiService.analyzeProperty(body.propertyId);
    }

    return this.aiService.analyzeListingDraft({
      title: body.title,
      description: body.description,
      priceEur: body.priceEur,
      city: body.city,
      rooms: body.rooms,
      surfaceSqm: body.surfaceSqm,
      photosCount: body.photosCount,
    });
  }

  @Get('property-summary/:propertyId')
  @Public()
  @ApiOperation({
    summary: 'Summarize property for seekers',
    description: 'Returns a concise AI summary about a property for viewers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Property summary with highlights and cautions',
    type: PropertySummaryResponse,
  })
  async summarizeProperty(@Param('propertyId', ParseIntPipe) propertyId: number) {
    return this.aiService.summarizeProperty(propertyId);
  }

  // ========================================================================
  // 💰 ESTIMATE PRICE
  // ========================================================================

  @Post('estimate-price')
  @Public()
  @ApiOperation({
    summary: 'Estimate property price based on market data',
    description:
      'Uses comparable properties to estimate a fair price for a property.',
  })
  @ApiBody({ type: EstimatePriceBody })
  @ApiResponse({
    status: 200,
    description: 'Price estimation with confidence score',
    schema: {
      example: {
        estimatedPrice: 450,
        priceRange: { min: 400, max: 500 },
        confidence: 0.85,
        comparables: { avgPrice: 445, avgPricePerSqm: 9, count: 15 },
      },
    },
  })
  async estimatePrice(@Body() body: EstimatePriceBody) {
    return this.aiService.estimatePrice(body);
  }

  // ========================================================================
  // 💬 PERSISTENT AI CONVERSATIONS
  // ========================================================================

  @Get('conversations')
  @Public()
  @ApiOperation({
    summary: 'List AI conversations',
    description: 'Returns user AI conversations with last message preview.',
  })
  async getConversations(
    @CurrentUser() user?: { id: number },
  ) {
    if (!user?.id) {
      return { data: [], meta: { page: 1, limit: 20, total: 0, hasMore: false } };
    }
    return this.aiConversationService.getConversations(user.id);
  }

  @Get('conversations/active')
  @Public()
  @ApiOperation({
    summary: 'Get or create active conversation',
    description: 'Returns the most recent active conversation or creates a new one.',
  })
  async getActiveConversation(
    @CurrentUser() user?: { id: number },
    @Query('anonymousId') anonymousId?: string,
  ) {
    return this.aiConversationService.getOrCreateActive(user?.id, anonymousId);
  }

  @Get('conversations/:id')
  @Public()
  @ApiOperation({
    summary: 'Get AI conversation with messages',
    description: 'Returns full conversation with message history.',
  })
  async getConversation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: { id: number },
  ) {
    return this.aiConversationService.getConversation(id, user?.id || 0);
  }

  @Post('conversations')
  @Public()
  @ApiOperation({
    summary: 'Create new AI conversation',
    description: 'Creates a new conversation with a welcome message.',
  })
  async createConversation(
    @CurrentUser() user?: { id: number },
    @Body() body?: { anonymousId?: string },
  ) {
    return this.aiConversationService.createConversation(user?.id, body?.anonymousId);
  }

  @Post('conversations/:id/messages')
  @Public()
  @ApiOperation({
    summary: 'Send message in AI conversation',
    description: 'Sends a message, gets AI response with client classification.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'User message' },
      },
      required: ['message'],
    },
  })
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { message: string },
    @CurrentUser() user?: { id: number },
  ) {
    return this.aiConversationService.sendMessage(id, body.message, user?.id);
  }

  @Post('conversations/:id/archive')
  @Public()
  @ApiOperation({
    summary: 'Archive AI conversation',
  })
  async archiveConversation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: { id: number },
  ) {
    if (!user?.id) return { error: 'Not authenticated' };
    return this.aiConversationService.archiveConversation(id, user.id);
  }

  // ========================================================================
  // 🤖 AGENT - Conversational Real Estate Agent (NEW)
  // ========================================================================

  @Post('agent/chat')
  @Public()
  @ApiOperation({
    summary: 'Chat with Conversational Agent',
    description: `Multi-tier AI agent for property search with:
- Tier 0: Deterministic responses (free)
- Tier 1: Cheap model for intent/slots (low cost)
- Tier 2: Strong LLM for complex reasoning (when needed)

Features:
- Structured preference memory
- Smart tool invocation (search, mortgage calc, scheduling)
- Context-aware recommendations`,
  })
  @ApiBody({ type: AgentChatBody })
  @ApiResponse({
    status: 200,
    description: 'Agent response with properties and suggested actions',
    schema: {
      example: {
        conversationId: 'uuid',
        message: 'Am găsit 5 apartamente în Botanica...',
        properties: [],
        intent: { type: 'search', confidence: 0.9, tier: 1 },
        toolsUsed: ['search_properties'],
        suggestedActions: [
          { type: 'save_search', label: 'Salvează căutarea' },
        ],
        debug: { tier: 1, latencyMs: 450, cached: false },
      },
    },
  })
  async agentChat(
    @Body() body: AgentChatBody,
    @CurrentUser() user?: { id: number },
  ) {
    return this.aiGateway.chat({
      message: body.message,
      conversationId: body.conversationId,
      userId: user?.id,
      contextOptions: body.context,
    });
  }

  @Get('agent/stats')
  @Public()
  @ApiOperation({
    summary: 'Get AI decision statistics',
    description: 'Returns tier usage distribution and average latency.',
  })
  async getAgentStats() {
    return this.aiGateway.getDecisionStats();
  }

  // ========================================================================
  // 💰 AVM - Automated Valuation Model (NEW)
  // ========================================================================

  @Post('agent/valuation')
  @Public()
  @ApiOperation({
    summary: 'Get AI price recommendation (AVM)',
    description: `Automated Valuation Model that provides:
- Recommended price based on comparables
- Price range with confidence
- Liquidity score (how fast it may sell/rent)
- Deal attractiveness score
- Detailed explanation`,
  })
  @ApiBody({ type: AVMRequestBody })
  @ApiResponse({
    status: 200,
    description: 'Valuation result with explanation',
    schema: {
      example: {
        valuation: {
          recommendedPrice: 450,
          priceRange: { min: 400, max: 500 },
          liquidityScore: 75,
          dealAttractivenessScore: 60,
          confidence: 0.82,
          comparables: { count: 15, avgPrice: 445, avgPricePerSqm: 9 },
        },
        explanation: {
          summary: 'Prețul recomandat este 450€/lună...',
          priceJustification: 'Bazat pe 15 proprietăți similare...',
          recommendations: ['Fotografii profesionale...'],
        },
      },
    },
  })
  async getValuation(@Body() body: AVMRequestBody) {
    const input: AVMInput = {
      city: body.city,
      neighborhood: body.neighborhood,
      propertyType: body.propertyType,
      transactionType: body.transactionType,
      rooms: body.rooms,
      surfaceSqm: body.surfaceSqm,
      floor: body.floor,
      totalFloors: body.totalFloors,
      yearBuilt: body.yearBuilt,
      amenities: body.amenities,
      condition: body.condition,
      isFurnished: body.isFurnished,
    };

    return this.aiGateway.getValuation(input);
  }

  @Get('agent/valuation/:listingId')
  @Public()
  @ApiOperation({
    summary: 'Get AI price recommendation for existing listing',
    description: 'Runs AVM on an existing listing by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Valuation result with explanation',
  })
  async getListingValuation(@Param('listingId', ParseIntPipe) listingId: number) {
    const result = await this.aiGateway.getValuationForListing(listingId);
    if (!result) {
      return { error: 'Listing not found' };
    }
    return result;
  }
}
