/**
 * RIVA - Search API
 * Advanced search API client functions for Frontend
 */

import { api } from './api';
import { PropertyListing, PropertySearchParams, PropertyListResponse } from './propertiesApi';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchSuggestion {
  type: 'city' | 'neighborhood' | 'property_type';
  value: string;
  label: string;
  count?: number;
}

export interface MapProperty {
  id: number;
  lat: number;
  lng: number;
  priceEur: number;
  transactionType: 'RENT' | 'SALE';
  propertyType: string;
  rooms: number;
}

export interface MapCluster {
  lat: number;
  lng: number;
  count: number;
  properties: MapProperty[];
}

export interface SearchFacets {
  cities: Array<{ value: string; count: number }>;
  neighborhoods: Array<{ value: string; city: string; count: number }>;
  propertyTypes: Array<{ value: string; count: number }>;
  priceRange: { min: number; max: number };
  roomsRange: { min: number; max: number };
}

// ============================================================================
// SEARCH ENDPOINTS
// ============================================================================

/**
 * Advanced property search with all filters
 */
export async function advancedSearch(
  params: PropertySearchParams
): Promise<PropertyListResponse> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  
  const query = queryParams.toString();
  const response = await api.fetch<PropertyListResponse | { items: PropertyListing[]; total: number }>(
    `/search/properties${query ? `?${query}` : ''}`
  );
  
  // Handle different response formats
  if ('data' in response) {
    return response;
  }
  if ('items' in response) {
    return {
      data: response.items,
      total: response.total,
    };
  }
  return { data: [], total: 0 };
}

/**
 * Get search suggestions for autocomplete
 */
export async function getSearchSuggestions(
  query: string,
  limit = 10
): Promise<SearchSuggestion[]> {
  if (!query || query.length < 2) {
    return [];
  }
  
  return api.fetch<SearchSuggestion[]>(
    `/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
  );
}

/**
 * Get properties for map view with clustering
 */
export async function getMapData(
  params: Omit<PropertySearchParams, 'limit' | 'offset' | 'page'>
): Promise<MapProperty[]> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  
  const query = queryParams.toString();
  return api.fetch<MapProperty[]>(`/search/map${query ? `?${query}` : ''}`);
}

/**
 * Get search facets for filter counts
 */
export async function getSearchFacets(
  params?: Partial<PropertySearchParams>
): Promise<SearchFacets> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const query = queryParams.toString();
  return api.fetch<SearchFacets>(`/search/facets${query ? `?${query}` : ''}`);
}

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
