// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 10000,
};

// Helper function to normalize image URLs
// Handles both absolute URLs and relative paths from backend
export function normalizeImageUrl(url: string | undefined): string {
  if (!url) {
    return '/placeholder.svg';
  }

  const cleanUrl = url.trim();

  // If it's already an absolute URL (http/https), return as is
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  // If it's a relative path starting with /uploads/, prepend API base URL
  if (cleanUrl.startsWith('/uploads/')) {
    return `${API_CONFIG.baseURL}${cleanUrl}`;
  }

  // If it's a relative path without leading slash, add it
  if (cleanUrl.startsWith('uploads/')) {
    return `${API_CONFIG.baseURL}/${cleanUrl}`;
  }

  // If it's just a filename or invalid, return placeholder
  console.warn('Invalid image URL format:', cleanUrl);
  return '/placeholder.svg';
}

// Types for API responses
export interface ListingImage {
  id: number;
  listingId: number;
  url: string;
  alt: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIMetadata {
  isAgency: boolean;
  confidence: number;
  indicators: {
    agencySignals: string[];
    ownerSignals: string[];
  };
  reasoning: string;
  imageAnalysis?: {
    hasAgencyBranding: boolean;
    confidence: number;
    foundElements: string[];
    reasoning: string;
  };
  analyzedAt: string;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  city: string;
  neighborhood: string;
  priceEur: number;
  currency: string;
  rooms: number;
  surfaceSqm: number;
  isFurnished: boolean;
  hasCentralHeating: boolean;
  isAgency: boolean;
  addressText: string;
  lat: number | null;
  lng: number | null;
  postedAt: string;
  scrapedAt?: string;
  status: 'new' | 'early_access' | 'public' | 'rented' | 'hidden' | 'expired';
  sourceUrl: string;
  sourceType?: 'facebook' | 'manual' | 'other';
  images: ListingImage[];
  aiMetadata?: AIMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ListingsResponse {
  listings: Listing[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ListingsFilters {
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
  minSurface?: number;
  maxSurface?: number;
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  isAgency?: boolean;
  status?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'price' | 'createdAt' | 'postedAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface StatsSummary {
  total: number;
  byCity: Array<{
    city: string;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
  priceStats: {
    minPrice: number;
    maxPrice: number;
    avgPrice: string;
  };
}

// Helper function to build query string
function buildQueryString(filters?: ListingsFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return params.toString();
}

// API Service class
export class ListingsService {
  private baseURL = API_CONFIG.baseURL;

  async getAll(filters?: ListingsFilters): Promise<ListingsResponse> {
    const queryString = buildQueryString(filters);
    const url = `${this.baseURL}/listing${queryString ? `?${queryString}` : ''}`; // Endpoint is /listing (singular) in backend controller

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Listings not found');
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return response.json();
  }

  async getById(id: number): Promise<Listing> {
    const response = await fetch(`${this.baseURL}/listings/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Listing not found');
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return response.json();
  }

  async getStats(): Promise<StatsSummary> {
    const response = await fetch(`${this.baseURL}/listings/stats/summary`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
  async create(data: Partial<Listing>): Promise<Listing> {
    const response = await fetch(`${this.baseURL}/listing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const listingsService = new ListingsService();

