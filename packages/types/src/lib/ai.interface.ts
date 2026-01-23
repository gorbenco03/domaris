/**
 * 🤖 AI INTERFACES
 * 
 * Tipuri pentru modulul AI Assistant
 */

// ============================================================================
// AI MESSAGES
// ============================================================================

/**
 * Mesaj în conversație AI
 */
export interface IAIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date | string;
}

/**
 * Preferințe utilizator pentru context AI
 */
export interface IAIUserPreferences {
  preferredCities?: string[];
  budgetMin?: number;
  budgetMax?: number;
  preferredRooms?: number;
  mustHave?: string[];
  dealBreakers?: string[];
}

/**
 * Opțiuni de context pentru chat AI
 */
export interface IAIContextOptions {
  customInstructions?: string;
  userPreferences?: IAIUserPreferences;
  tone?: 'professional' | 'friendly' | 'concise';
  language?: 'ro' | 'en';
  maxResults?: number;
}

// ============================================================================
// AI CHAT
// ============================================================================

/**
 * Request pentru chat AI
 */
export interface IAIChatRequest {
  message: string;
  conversationHistory?: IAIMessage[];
  context?: IAIContextOptions;
}

/**
 * Response de la chat AI
 */
export interface IAIChatResponse {
  response: string;
  properties?: any[]; // IPropertyListing[]
  intent: 'search' | 'info' | 'comparison' | 'general';
  searchParams?: any; // IPropertySearchParams
}

// ============================================================================
// AI DESCRIPTION GENERATION
// ============================================================================

/**
 * Request pentru generare descriere
 */
export interface IAIGenerateDescriptionRequest {
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
  style?: 'professional' | 'friendly' | 'luxurious';
}

/**
 * Response descriere generată
 */
export interface IAIGenerateDescriptionResponse {
  title: string;
  description: string;
  seoKeywords: string[];
  highlights: string[];
}

// ============================================================================
// AI PROPERTY ANALYSIS
// ============================================================================

/**
 * Analiză completă a unei proprietăți
 */
export interface IAIPropertyAnalysis {
  overallScore: number; // 0-100
  
  priceAnalysis: {
    isReasonable: boolean;
    marketComparison: string;
    suggestion?: string;
    percentDiff?: number;
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
  
  recommendations: IAIRecommendation[];
}

/**
 * Rezumat proprietate pentru vizitatori
 */
export interface IAIPropertySummary {
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

/**
 * Recomandare AI
 */
export interface IAIRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}

// ============================================================================
// AI PRICE ESTIMATION
// ============================================================================

/**
 * Request pentru estimare preț
 */
export interface IAIPriceEstimateRequest {
  city: string;
  neighborhood?: string;
  propertyType: string;
  rooms: number;
  surface: number;
  floor?: number;
  yearBuilt?: number;
}

/**
 * Response estimare preț
 */
export interface IAIPriceEstimateResponse {
  estimatedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number; // 0-1
  comparables: {
    avgPrice: number;
    avgPricePerSqm: number;
    count: number;
  };
}
