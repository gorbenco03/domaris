/**
 * IMOBI - AI API
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
  const response = await apiClient.get<IAIPropertyAnalysis>(
    API_ENDPOINTS.AI.ANALYZE_LISTING.replace(':propertyId', String(propertyId))
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
// EXPORT ALL
// ============================================================================

export const aiApi = {
  // Chat
  chatWithAI,
  sendMessage,
  sendMessageWithHistory,

  // Description Generation (Level 2+)
  generatePropertyDescription,

  // Property Analysis (Level 2+)
  analyzeProperty,

  // Price Estimation (PUBLIC)
  estimatePrice,
};

export default aiApi;
