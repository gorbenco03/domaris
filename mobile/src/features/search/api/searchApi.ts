/**
 * RIVA - Search API
 * Advanced search API client functions
 */

import { apiClient } from '@/core/api/client';
import type { IPropertyListing } from '@/core/api/types';

// ============================================================================
// TYPES
// ============================================================================

export interface IAdvancedSearchFilters {
  // Full-text search
  query?: string;

  // Location
  city?: string;
  neighborhood?: string;

  // Transaction & property type
  transactionType?: string;
  propertyType?: string;

  // Price
  priceMin?: number;
  priceMax?: number;

  // Rooms
  rooms?: number; // Exact
  roomsMin?: number;
  roomsMax?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  bathroomsMax?: number;
  floorMin?: number;
  floorMax?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;

  // Surface (mp)
  surfaceMin?: number;
  surfaceMax?: number;

  // Amenities
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  petFriendly?: boolean;
  amenities?: string[];

  // Filters
  excludeAgencies?: boolean;

  // Rent type
  rentType?: string;

  // Bounding box
  bounds?: IMapBounds;

  // Sorting
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'relevance';

  // Pagination
  page?: number;
  limit?: number;
}

export interface ISearchResponse {
  data: IPropertyListing[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ISearchSuggestion {
  type: 'city' | 'neighborhood' | 'property' | 'keyword';
  text: string;
  count?: number;
}

export interface IMapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface IMapDataFilters {
  city?: string;
  neighborhood?: string;
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  bounds?: IMapBounds;
}

export interface IMapPropertyFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: number;
    price: number;
    rooms: number;
    surface: number;
    title: string;
    photo?: string;
  };
}

export interface IMapDataResponse {
  type: 'FeatureCollection';
  features: IMapPropertyFeature[];
}

export interface ISearchFacets {
  cities: Array<{ name: string; count: number }>;
  priceRanges: Array<{
    min: number;
    max: number;
    count: number;
    label: string;
  }>;
  roomCounts: Array<{ rooms: number; count: number }>;
  propertyTypes: Array<{ type: string; count: number }>;
}

// ============================================================================
// SEARCH ENDPOINTS (PUBLIC)
// ============================================================================

/**
 * Advanced search with full-text and filters
 */
export const advancedSearch = async (
  filters: IAdvancedSearchFilters
): Promise<ISearchResponse> => {
  const response = await apiClient.get<ISearchResponse>('/search', {
    params: filters,
  });
  return response.data;
};

/**
 * Search autocomplete suggestions
 * Minimum 2 characters required
 */
export const getSearchSuggestions = async (
  query: string
): Promise<ISearchSuggestion[]> => {
  if (query.length < 2) {
    return [];
  }

  const response = await apiClient.get<ISearchSuggestion[]>(
    '/search/suggestions',
    {
      params: { q: query },
    }
  );
  return response.data;
};

/**
 * Get map data (GeoJSON) for displaying properties on map
 */
export const getMapData = async (
  filters: IMapDataFilters
): Promise<IMapDataResponse> => {
  const params: any = {
    city: filters.city,
    neighborhood: filters.neighborhood,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    rooms: filters.rooms,
  };

  // Add bounding box if provided
  if (filters.bounds) {
    params.north = filters.bounds.north;
    params.south = filters.bounds.south;
    params.east = filters.bounds.east;
    params.west = filters.bounds.west;
  }

  const response = await apiClient.get<IMapDataResponse>('/search/map', {
    params,
  });
  return response.data;
};

/**
 * Get search facets/aggregations for filter UI
 * Returns cities, price ranges, room counts, etc.
 */
export const getSearchFacets = async (): Promise<ISearchFacets> => {
  const response = await apiClient.get<ISearchFacets>('/search/facets');
  return response.data;
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const searchApi = {
  advancedSearch,
  getSearchSuggestions,
  getMapData,
  getSearchFacets,
};

export default searchApi;
