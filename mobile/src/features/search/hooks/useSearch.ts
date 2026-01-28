/**
 * RIVA - Search Hooks
 * React Query hooks for search
 */

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import {
  searchApi,
  type IAdvancedSearchFilters,
  type IMapDataFilters,
} from '../api/searchApi';

/**
 * Advanced search with filters (PUBLIC)
 */
export const useSearch = (filters: IAdvancedSearchFilters) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_RESULTS, filters],
    queryFn: () => searchApi.advancedSearch(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: true,
  });
};

/**
 * Search suggestions/autocomplete (PUBLIC)
 */
export const useSearchSuggestions = (query: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_RESULTS, 'suggestions', query],
    queryFn: () => searchApi.getSearchSuggestions(query),
    enabled: query.length >= 2, // Only fetch if query is at least 2 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get map data (GeoJSON) for properties (PUBLIC)
 */
export const useMapData = (filters: IMapDataFilters) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_RESULTS, 'map', filters],
    queryFn: () => searchApi.getMapData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!filters.city || !!filters.bounds, // Only fetch if city or bounds are provided
  });
};

/**
 * Get search facets/aggregations (PUBLIC)
 */
export const useSearchFacets = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_FILTERS, 'facets'],
    queryFn: searchApi.getSearchFacets,
    staleTime: 30 * 60 * 1000, // 30 minutes - facets don't change often
  });
};
