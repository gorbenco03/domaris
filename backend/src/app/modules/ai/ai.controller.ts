/**
 * 🤖 AI CONTROLLER - Asistent Inteligent API
 * 
 * Endpoints:
 * - POST /ai/chat              - Conversație în limbaj natural
 * - POST /ai/generate-description - Generare descriere proprietate
 * - GET  /ai/analyze/:propertyId  - Analiză calitate anunț
 * - POST /ai/estimate-price    - Estimare preț bazată pe piață
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
import { Public, MinVerificationLevel } from '../../core/decorators.js';

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

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

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
}
