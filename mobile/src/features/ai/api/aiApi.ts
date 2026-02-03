/**
 * RIVA - AI API
 * AI Assistant API client functions
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';
import type {
  IAIChatRequest,
  IAIChatResponse,
  IAIGenerateDescriptionRequest,
  IAIGenerateDescriptionResponse,
  IAIPropertyAnalysis,
  IAIPropertySummary,
  IAIPriceEstimateRequest,
  IAIPriceEstimateResponse,
} from '@/core/api/types';

// ============================================================================
// AI CHAT - Natural Language Search (WOW FACTOR!)
// ============================================================================

/**
 * Chat with AI Assistant in natural language
 * Example: "Vreau apartament cu 2 camere în Cluj sub 400€"
 *
 * @param request - Chat request with message, history, and context
 * @returns AI response with properties, intent, and extracted params
 */
export const chatWithAI = async (
  request: IAIChatRequest
): Promise<IAIChatResponse> => {
  const response = await apiClient.post<IAIChatResponse>(
    API_ENDPOINTS.AI.CHAT,
    request
  );
  return response.data;
};

/**
 * Send a simple message to AI (convenience function)
 * @param message - Natural language message
 * @returns AI response
 */
export const sendMessage = async (
  message: string
): Promise<IAIChatResponse> => {
  return chatWithAI({ message });
};

/**
 * Send message with conversation history
 * @param message - Current message
 * @param history - Previous messages (max 10 recommended)
 * @returns AI response
 */
export const sendMessageWithHistory = async (
  message: string,
  history: IAIChatRequest['conversationHistory']
): Promise<IAIChatResponse> => {
  return chatWithAI({ message, conversationHistory: history });
};

// ============================================================================
// AI DESCRIPTION GENERATION (Level 2+ required)
// ============================================================================

/**
 * Generate property description using AI
 * Requires Level 2+ verification
 *
 * @param request - Property details
 * @returns Generated title, description, SEO keywords, and highlights
 */
export const generatePropertyDescription = async (
  request: IAIGenerateDescriptionRequest
): Promise<IAIGenerateDescriptionResponse> => {
  const response = await apiClient.post<IAIGenerateDescriptionResponse>(
    API_ENDPOINTS.AI.GENERATE_DESCRIPTION,
    request
  );
  return response.data;
};

// ============================================================================
// AI PROPERTY ANALYSIS (Level 2+ required)
// ============================================================================

/**
 * Analyze property listing quality with AI
 * Requires Level 2+ verification
 *
 * @param propertyId - Property ID to analyze
 * @returns Analysis with scores, price check, and recommendations
 */
export const analyzeProperty = async (
  propertyId: number
): Promise<IAIPropertyAnalysis> => {
  const response = await apiClient.post<IAIPropertyAnalysis>(
    API_ENDPOINTS.AI.ANALYZE_LISTING,
    { propertyId }
  );
  return response.data;
};

export const analyzeListingDraft = async (payload: {
  title?: string;
  description?: string;
  priceEur?: number;
  city?: string;
  rooms?: number;
  surfaceSqm?: number;
  photosCount?: number;
}): Promise<IAIPropertyAnalysis> => {
  const response = await apiClient.post<IAIPropertyAnalysis>(
    API_ENDPOINTS.AI.ANALYZE_LISTING,
    payload
  );
  return response.data;
};

export const getPropertySummary = async (
  propertyId: number
): Promise<IAIPropertySummary> => {
  const response = await apiClient.get<IAIPropertySummary>(
    API_ENDPOINTS.AI.PROPERTY_SUMMARY(String(propertyId))
  );
  return response.data;
};

// ============================================================================
// AI PRICE ESTIMATION (PUBLIC)
// ============================================================================

/**
 * Estimate property price based on market comparables
 * PUBLIC endpoint - no authentication required
 *
 * @param request - Property characteristics
 * @returns Estimated price, range, confidence, and comparables
 */
export const estimatePrice = async (
  request: IAIPriceEstimateRequest
): Promise<IAIPriceEstimateResponse> => {
  const response = await apiClient.post<IAIPriceEstimateResponse>(
    API_ENDPOINTS.AI.SUGGEST_PRICE,
    request
  );
  return response.data;
};

// ============================================================================
// 🤖 CONVERSATIONAL AGENT (NEW - Multi-tier AI)
// ============================================================================

export interface IAgentChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    tone?: 'professional' | 'friendly' | 'concise';
    language?: 'ro' | 'en';
    maxResults?: number;
    userPreferences?: {
      preferredCities?: string[];
      budgetMin?: number;
      budgetMax?: number;
      preferredRooms?: number;
    };
  };
}

export interface IAgentChatResponse {
  conversationId: string;
  message: string;
  properties?: Array<{
    id: number;
    title: string;
    city: string;
    neighborhood?: string;
    priceEur: number;
    transactionType: string;
    rooms: number;
    surfaceSqm: number;
    imageUrl?: string;
  }>;
  intent: {
    type: string;
    confidence: number;
    tier: number;
  };
  toolsUsed: string[];
  suggestedActions?: Array<{
    type: string;
    label: string;
    payload?: Record<string, any>;
  }>;
  debug?: {
    tier: number;
    latencyMs: number;
    cached: boolean;
  };
}

/**
 * Chat with the Conversational Agent (NEW - uses multi-tier routing)
 * Tier 0: Deterministic (free)
 * Tier 1: Cheap model (low cost)
 * Tier 2: Strong LLM (when needed)
 */
export const agentChat = async (
  request: IAgentChatRequest
): Promise<IAgentChatResponse> => {
  const response = await apiClient.post<IAgentChatResponse>(
    API_ENDPOINTS.AI.AGENT_CHAT,
    request
  );
  return response.data;
};

/**
 * Get AI decision statistics (tier usage, latency)
 */
export const getAgentStats = async (): Promise<{
  tier0: number;
  tier1: number;
  tier2: number;
  avgLatency: number;
}> => {
  const response = await apiClient.get(API_ENDPOINTS.AI.AGENT_STATS);
  return response.data;
};

// ============================================================================
// 💰 AVM - AUTOMATED VALUATION MODEL (NEW)
// ============================================================================

export interface IAVMRequest {
  city: string;
  neighborhood?: string;
  propertyType: string;
  transactionType: 'RENT' | 'SALE';
  rooms: number;
  surfaceSqm: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  amenities?: string[];
  condition?: 'new' | 'renovated' | 'good' | 'needs_work';
  isFurnished?: boolean;
}

export interface IAVMResponse {
  valuation: {
    recommendedPrice: number;
    priceRange: { min: number; max: number };
    currency: string;
    liquidityScore: number;
    dealAttractivenessScore: number;
    confidence: number;
    confidenceBreakdown: {
      compCount: number;
      featureCoverage: number;
      areaVolatility: number;
    };
    comparables: {
      count: number;
      avgPrice: number;
      avgPricePerSqm: number;
      medianPrice: number;
    };
    factors: Array<{
      name: string;
      impact: number;
      description: string;
    }>;
  };
  explanation: {
    summary: string;
    priceJustification: string;
    marketContext: string;
    recommendations: string[];
    sellerTips?: string[];
  };
}

/**
 * Get AI price recommendation (AVM)
 * Returns recommended price, confidence, liquidity score, and explanation
 */
export const getValuation = async (
  request: IAVMRequest
): Promise<IAVMResponse> => {
  const response = await apiClient.post<IAVMResponse>(
    API_ENDPOINTS.AI.AGENT_VALUATION,
    request
  );
  return response.data;
};

/**
 * Get AI price recommendation for an existing listing
 */
export const getListingValuation = async (
  listingId: number
): Promise<IAVMResponse> => {
  const response = await apiClient.get<IAVMResponse>(
    API_ENDPOINTS.AI.AGENT_VALUATION_LISTING(String(listingId))
  );
  return response.data;
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const aiApi = {
  // Legacy Chat (backward compatible)
  chatWithAI,
  sendMessage,
  sendMessageWithHistory,

  // NEW: Conversational Agent (multi-tier)
  agentChat,
  getAgentStats,

  // NEW: AVM (Automated Valuation Model)
  getValuation,
  getListingValuation,

  // Description Generation (Level 2+)
  generatePropertyDescription,

  // Property Analysis (Level 2+)
  analyzeProperty,
  analyzeListingDraft,
  getPropertySummary,

  // Price Estimation (PUBLIC - legacy)
  estimatePrice,
};

export default aiApi;
