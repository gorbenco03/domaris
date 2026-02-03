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
import { Public, MinVerificationLevel, CurrentUser } from '../../core/decorators.js';
import { AVMInput } from './types/index.js';

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
  message!: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  /**
   * Opțiuni pentru personalizarea comportamentului AI
   */
  context?: ChatContextOptionsDto;
}

class GenerateDescriptionBody {
  propertyType!: string;
  transactionType!: string;
  rooms?: number;
  surface?: number;
  city!: string;
  neighborhood?: string;
  floor?: number;
  totalFloors?: number;
  amenities?: string[];
  yearBuilt?: number;
  style?: 'professional' | 'friendly' | 'luxurious';
}

class EstimatePriceBody {
  city!: string;
  neighborhood?: string;
  propertyType!: string;
  rooms!: number;
  surface!: number;
  floor?: number;
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
  propertyId?: number;
  title?: string;
  description?: string;
  priceEur?: number;
  city?: string;
  rooms?: number;
  surfaceSqm?: number;
  photosCount?: number;
}

class AgentChatBody {
  message!: string;
  conversationId?: string;
  context?: {
    tone?: 'professional' | 'friendly' | 'concise';
    language?: 'ro' | 'en';
    maxResults?: number;
    userPreferences?: Partial<UserPreferencesDto>;
  };
}

class AVMRequestBody {
  city!: string;
  neighborhood?: string;
  propertyType!: string;
  transactionType!: 'RENT' | 'SALE';
  rooms!: number;
  surfaceSqm!: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  amenities?: string[];
  condition?: 'new' | 'renovated' | 'good' | 'needs_work';
  isFurnished?: boolean;
}

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly aiGateway: AIGatewayService,
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
  @MinVerificationLevel(2)
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
  @MinVerificationLevel(2)
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
