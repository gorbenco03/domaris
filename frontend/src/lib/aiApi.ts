/**
 * RIVA - AI API
 * AI Assistant API client functions for Frontend
 */

import { api } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface AIChatRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  context?: {
    propertyId?: number;
    searchParams?: Record<string, unknown>;
  };
}

export interface AIChatResponse {
  message: string;
  properties?: PropertySuggestion[];
  intent?: {
    type: string;
    confidence: number;
  };
  extractedParams?: Record<string, unknown>;
}

export interface PropertySuggestion {
  id: number;
  title: string;
  city: string;
  neighborhood?: string;
  priceEur: number;
  transactionType: string;
  propertyType?: string;
  rooms: number;
  surfaceSqm: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  isFurnished?: boolean;
  petFriendly?: boolean;
  amenities?: string[];
  imageUrl?: string;
  matchScore?: number;
  matchReasons?: string[];
}

export interface AIClientProfile {
  classificationComplete: boolean;
  classificationScore: number;
  conversationPhase?: string;
  transactionType?: string;
  propertyType?: string;
  purpose?: string;
  urgency?: string;
  budget?: { min?: number; max?: number; currency?: string };
  preferences?: {
    rooms?: number;
    roomsMin?: number;
    roomsMax?: number;
    surfaceMin?: number;
    surfaceMax?: number;
    cities?: string[];
    neighborhoods?: string[];
    amenities?: string[];
    isFurnished?: boolean;
    petFriendly?: boolean;
    floorMin?: number;
    floorMax?: number;
    yearBuiltMin?: number;
    yearBuiltMax?: number;
  };
  dealbreakers?: string[];
  answeredQuestions?: string[];
  lastShownListingIds?: number[];
  lastSearchFilters?: Record<string, unknown>;
}

export interface AgentChatRequest {
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

export interface AgentChatResponse {
  conversationId: string;
  message: string;
  properties?: PropertySuggestion[];
  intent: {
    type: string;
    confidence: number;
    tier: number;
  };
  toolsUsed: string[];
  suggestedActions?: Array<{
    type: string;
    label: string;
    payload?: Record<string, unknown>;
  }>;
}

export interface AVMRequest {
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

export interface AVMResponse {
  valuation: {
    recommendedPrice: number;
    priceRange: { min: number; max: number };
    currency: string;
    liquidityScore: number;
    dealAttractivenessScore: number;
    confidence: number;
    // true when the engine had < 3 comparables and could not produce a real estimate
    // (recommendedPrice / priceRange come back as -1 in that case).
    insufficientData?: boolean;
    comparables: {
      count: number;
      avgPrice: number;
      avgPricePerSqm: number;
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
  };
}

export interface GenerateDescriptionRequest {
  propertyType: string;
  transactionType: 'RENT' | 'SALE';
  rooms: number;
  surfaceSqm: number;
  city: string;
  neighborhood?: string;
  features?: string[];
  highlights?: string[];
}

export interface GenerateDescriptionResponse {
  title: string;
  description: string;
  seoKeywords: string[];
  highlights: string[];
}

export interface PropertyAnalysis {
  scores: {
    overall: number;
    title: number;
    description: number;
    photos: number;
    pricing: number;
  };
  priceCheck?: {
    status: 'low' | 'fair' | 'high';
    suggestedPrice: number;
    marketAverage: number;
  };
  recommendations: string[];
  improvements: Array<{
    field: string;
    current: string;
    suggested: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

// Raw shape returned by the backend (AiService.analyzeProperty / analyzeListingDraft).
interface BackendPropertyAnalysis {
  overallScore?: number;
  priceAnalysis?: { isReasonable?: boolean; suggestion?: string; marketComparison?: string; percentDiff?: number | null };
  descriptionAnalysis?: { score?: number; issues?: string[]; suggestions?: string[] };
  photosAnalysis?: { count?: number; suggestions?: string[] };
  recommendations?: Array<{ priority?: string; title?: string; description?: string; impact?: string }>;
}

/** Translate the backend analysis shape into the flat shape the UI renders. */
function mapAnalysis(b: BackendPropertyAnalysis): PropertyAnalysis {
  const recs = Array.isArray(b.recommendations) ? b.recommendations : [];
  return {
    scores: {
      overall: b.overallScore ?? 0,
      title: 70,
      description: b.descriptionAnalysis?.score ?? 0,
      photos: Math.min(100, (b.photosAnalysis?.count ?? 0) * 10),
      pricing: b.priceAnalysis?.isReasonable ? 80 : 50,
    },
    // Backend doesn't return absolute suggested/market numbers here — omit the
    // price-check block rather than render zeros.
    priceCheck: undefined,
    recommendations: recs.map((r) =>
      [r.title, r.description].filter(Boolean).join(' — ') || String(r),
    ),
    improvements: [
      ...(b.descriptionAnalysis?.suggestions ?? []).map((s) => ({
        field: 'Descriere', current: '', suggested: s, impact: 'medium' as const,
      })),
      ...(b.photosAnalysis?.suggestions ?? []).map((s) => ({
        field: 'Fotografii', current: '', suggested: s, impact: 'medium' as const,
      })),
    ],
  };
}

export interface AIConversationSummary {
  id: number;
  title: string;
  status: 'active' | 'archived' | 'closed';
  clientProfile: AIClientProfile;
  lastMessageAt: string;
  messageCount: number;
  lastMessage?: {
    content: string;
    role: string;
  } | null;
  createdAt: string;
}

export interface AIMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    intent?: string;
    tier?: number;
    toolsUsed?: string[];
    propertiesShown?: number[];
    propertyCards?: PropertySuggestion[];
    suggestedActions?: Array<{
      type: string;
      label: string;
      payload?: Record<string, unknown>;
    }>;
    clientProfileUpdate?: Record<string, unknown>;
    conversationPhase?: string;
    latencyMs?: number;
  };
  createdAt: string;
}

export interface AIConversationDetail {
  id: number;
  title: string;
  status: string;
  clientProfile: AIClientProfile;
  lastMessageAt: string;
  messageCount: number;
  messages: AIMessage[];
  createdAt: string;
}

export interface AISendConversationMessageResponse {
  userMessage: AIMessage;
  assistantMessage: AIMessage;
  properties?: PropertySuggestion[];
  clientProfile: AIClientProfile;
  suggestedActions?: Array<{
    type: string;
    label: string;
    payload?: Record<string, unknown>;
  }>;
  debug?: {
    tier: number;
    latencyMs: number;
    cached: boolean;
  };
}

// ============================================================================
// AI CHAT ENDPOINTS
// ============================================================================

/**
 * Chat with AI Assistant (public)
 */
export async function chatWithAI(request: AIChatRequest): Promise<AIChatResponse> {
  return api.fetch<AIChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Send simple message (convenience function)
 */
export async function sendAIMessage(message: string): Promise<AIChatResponse> {
  return chatWithAI({ message });
}

/**
 * Chat with multi-tier agent
 */
export async function agentChat(request: AgentChatRequest): Promise<AgentChatResponse> {
  return api.fetch<AgentChatResponse>('/ai/agent/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ============================================================================
// AVM - AUTOMATED VALUATION MODEL
// ============================================================================

/**
 * Get AI price valuation
 */
export async function getValuation(request: AVMRequest): Promise<AVMResponse> {
  return api.fetch<AVMResponse>('/ai/agent/valuation', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get valuation for existing listing
 */
export async function getListingValuation(listingId: number): Promise<AVMResponse> {
  return api.fetch<AVMResponse>(`/ai/agent/valuation/${listingId}`);
}

// ============================================================================
// AI DESCRIPTION & ANALYSIS (Level 2+ required)
// ============================================================================

/**
 * Generate property description using AI
 */
export async function generatePropertyDescription(
  request: GenerateDescriptionRequest
): Promise<GenerateDescriptionResponse> {
  return api.fetch<GenerateDescriptionResponse>('/ai/generate-description', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Analyze property listing quality
 */
export async function analyzeProperty(propertyId: number): Promise<PropertyAnalysis> {
  const raw = await api.fetch<BackendPropertyAnalysis>('/ai/analyze-listing', {
    method: 'POST',
    body: JSON.stringify({ propertyId }),
  });
  return mapAnalysis(raw);
}

/**
 * Analyze listing draft (before creating)
 */
export async function analyzeListingDraft(payload: {
  title?: string;
  description?: string;
  priceEur?: number;
  city?: string;
  rooms?: number;
  surfaceSqm?: number;
  photosCount?: number;
}): Promise<PropertyAnalysis> {
  const raw = await api.fetch<BackendPropertyAnalysis>('/ai/analyze-listing', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapAnalysis(raw);
}

/**
 * Get AI property summary
 */
export async function getPropertySummary(propertyId: number): Promise<{
  summary: string;
  highlights: string[];
  concerns: string[];
}> {
  // Backend returns { summary, highlights, cautions }. Normalize cautions -> concerns.
  const res = await api.fetch<{
    summary?: string;
    highlights?: string[];
    concerns?: string[];
    cautions?: string[];
  }>(`/ai/property-summary/${propertyId}`);
  return {
    summary: res.summary || '',
    highlights: res.highlights || [],
    concerns: res.concerns ?? res.cautions ?? [],
  };
}

/**
 * Estimate price (public)
 */
export async function estimatePrice(request: {
  city: string;
  propertyType: string;
  transactionType: 'RENT' | 'SALE';
  rooms: number;
  surfaceSqm: number;
  neighborhood?: string;
  floor?: number;
  yearBuilt?: number;
}): Promise<{
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number;
}> {
  // Backend route is /ai/estimate-price and expects { city, propertyType, transactionType, rooms, surface }
  // (note: `surface`, not `surfaceSqm`). neighborhood/floor/yearBuilt are optional
  // and whitelisted by EstimatePriceBody — forward them when present to improve
  // estimate precision.
  const payload: Record<string, unknown> = {
    city: request.city,
    propertyType: request.propertyType,
    transactionType: request.transactionType,
    rooms: request.rooms,
    surface: request.surfaceSqm,
  };
  if (request.neighborhood) payload.neighborhood = request.neighborhood;
  if (request.floor != null) payload.floor = request.floor;
  if (request.yearBuilt != null) payload.yearBuilt = request.yearBuilt;
  return api.fetch('/ai/estimate-price', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// PERSISTENT AI CONVERSATIONS
// ============================================================================

/**
 * Get AI conversation list
 */
export async function getAIConversations(): Promise<{
  data: AIConversationSummary[];
  meta: { page: number; limit: number; total: number; hasMore: boolean };
}> {
  return api.fetch('/ai/conversations');
}

/**
 * Get AI conversation detail
 */
export async function getAIConversation(id: number): Promise<AIConversationDetail> {
  return api.fetch(`/ai/conversations/${id}`);
}

/**
 * Create new AI conversation
 */
export async function createAIConversation(anonymousId?: string): Promise<AIConversationDetail> {
  return api.fetch('/ai/conversations', {
    method: 'POST',
    body: JSON.stringify(anonymousId ? { anonymousId } : {}),
  });
}

export async function getAIActiveConversation(anonymousId?: string): Promise<AIConversationDetail> {
  const query = anonymousId ? `?anonymousId=${encodeURIComponent(anonymousId)}` : '';
  return api.fetch(`/ai/conversations/active${query}`);
}

/**
 * Send message in AI conversation
 */
export async function sendAIConversationMessage(
  conversationId: number,
  message: string
): Promise<AISendConversationMessageResponse> {
  return api.fetch(`/ai/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/**
 * Archive AI conversation
 */
export async function archiveAIConversation(id: number): Promise<{ success: boolean }> {
  return api.fetch(`/ai/conversations/${id}/archive`, {
    method: 'POST',
  });
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const aiApi = {
  // Chat
  chatWithAI,
  sendAIMessage,
  agentChat,
  
  // AVM
  getValuation,
  getListingValuation,
  
  // Description & Analysis
  generatePropertyDescription,
  analyzeProperty,
  analyzeListingDraft,
  getPropertySummary,
  estimatePrice,
  
  // Persistent Conversations
  getAIConversations,
  getAIConversation,
  createAIConversation,
  getAIActiveConversation,
  sendAIConversationMessage,
  archiveAIConversation,
};

export default aiApi;
