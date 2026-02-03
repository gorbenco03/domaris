/**
 * AI Module Types - Core type definitions for the AI Gateway
 */

// ============================================================================
// CONVERSATION & MEMORY
// ============================================================================

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ConversationState {
  conversationId: string;
  userId?: number;
  messages: ConversationMessage[];
  preferences: UserPreferences;
  lastIntent: Intent | null;
  shownListingIds: number[];
  currentPlan: AgentPlan | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface UserPreferences {
  transactionType?: 'RENT' | 'SALE';
  cities?: string[];
  neighborhoods?: string[];
  priceMin?: number;
  priceMax?: number;
  roomsMin?: number;
  roomsMax?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  mustHave?: string[];
  dealbreakers?: string[];
  petFriendly?: boolean;
  isFurnished?: boolean;
  floorMin?: number;
  floorMax?: number;
  confidence: Record<string, number>; // confidence per field
  lastUpdated: Date;
}

export interface UserProfile {
  userId: number;
  preferences: UserPreferences;
  tasteEmbedding?: number[];
  favoriteListingIds: number[];
  viewedListingIds: number[];
  searchHistory: SearchHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchHistoryEntry {
  query: string;
  filters: Record<string, any>;
  resultCount: number;
  timestamp: Date;
}

// ============================================================================
// INTENT & ROUTING
// ============================================================================

export type IntentType = 
  | 'search'           // User wants to find properties
  | 'refine'           // User wants to adjust current search
  | 'details'          // User asks about specific property
  | 'compare'          // User wants to compare properties
  | 'schedule'         // User wants to schedule viewing
  | 'mortgage'         // User asks about financing
  | 'area_info'        // User asks about neighborhoods/areas
  | 'price_check'      // User asks if price is fair
  | 'greeting'         // Simple greeting
  | 'thanks'           // Thank you / closing
  | 'help'             // Asks how to use the system
  | 'unclear';         // Cannot determine intent

export interface Intent {
  type: IntentType;
  confidence: number;
  slots: ExtractedSlots;
  requiresLLM: boolean;
  tier: 0 | 1 | 2;
}

export interface ExtractedSlots {
  transactionType?: 'RENT' | 'SALE';
  city?: string;
  neighborhood?: string;
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  roomsMin?: number;
  roomsMax?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  amenities?: string[];
  propertyType?: string;
  listingId?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'relevance';
}

// ============================================================================
// AGENT & PLANNING
// ============================================================================

export interface AgentPlan {
  goal: string;
  steps: AgentStep[];
  currentStepIndex: number;
  isComplete: boolean;
}

export interface AgentStep {
  action: 'ask_question' | 'search' | 'show_results' | 'explain' | 'tool_call';
  description: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
  completed: boolean;
  result?: any;
}

// ============================================================================
// TOOLS
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
  requiresAuth: boolean;
  rateLimit?: number; // calls per minute
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: any;
  error?: string;
  durationMs: number;
}

// ============================================================================
// RESPONSES
// ============================================================================

export interface AgentResponse {
  conversationId: string;
  message: string;
  properties?: any[];
  intent: Intent;
  toolsUsed: string[];
  suggestedActions?: SuggestedAction[];
  debug?: {
    tier: number;
    tokensUsed?: number;
    latencyMs: number;
    cached: boolean;
  };
}

export interface SuggestedAction {
  type: 'refine' | 'save_search' | 'schedule' | 'compare' | 'contact';
  label: string;
  payload?: Record<string, any>;
}

// ============================================================================
// AVM / PRICE ENGINE
// ============================================================================

export interface AVMInput {
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
  photoUrls?: string[];
}

export interface AVMResult {
  recommendedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  currency: string;
  liquidityScore: number; // 0-100, how fast it may sell/rent
  dealAttractivenessScore: number; // 0-100, buyer value
  confidence: number; // 0-1
  confidenceBreakdown: {
    compCount: number;
    featureCoverage: number;
    areaVolatility: number;
    photoQuality?: number;
  };
  comparables: {
    count: number;
    avgPrice: number;
    avgPricePerSqm: number;
    medianPrice: number;
  };
  factors: AVMFactor[];
  computedAt: Date;
  cacheKey: string;
}

export interface AVMFactor {
  name: string;
  impact: number; // positive = increases price, negative = decreases
  description: string;
}

export interface AVMExplanation {
  summary: string;
  priceJustification: string;
  marketContext: string;
  recommendations: string[];
  sellerTips?: string[];
}

// ============================================================================
// TELEMETRY
// ============================================================================

export interface AIDecisionLog {
  requestId: string;
  userId?: number;
  conversationId: string;
  tierUsed: 0 | 1 | 2;
  intent: IntentType;
  toolsCalled: string[];
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  cached: boolean;
  error?: string;
  timestamp: Date;
}
