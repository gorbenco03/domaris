
import { apiClient } from '@/lib/client';
import type { 
  IPropertySearchParams,
  IPropertySearchResult
} from '@domaris/types';

// Define explicit types if not in shared package yet
interface ISearchSuggestion {
    type: 'city' | 'neighborhood' | 'property' | 'keyword';
    value: string;
    label: string;
    count?: number;
}

interface ISearchFacets {
    cities: Array<{ city: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number; label: string }>;
    roomCounts: Array<{ rooms: number; count: number }>;
    propertyTypes: Array<{ type: string; count: number }>;
}

export const searchApi = {
  advancedSearch: async (filters: IPropertySearchParams): Promise<IPropertySearchResult> => {
    const response = await apiClient.get<IPropertySearchResult>('/search', { params: filters });
    return response.data;
  },

  getSuggestions: async (query: string): Promise<ISearchSuggestion[]> => {
    if (query.length < 2) return [];
    const response = await apiClient.get<ISearchSuggestion[]>('/search/suggestions', { params: { q: query } });
    return response.data;
  },

  getFacets: async (): Promise<ISearchFacets> => {
    const response = await apiClient.get<ISearchFacets>('/search/facets');
    return response.data;
  },
  
  // Map data endpoint if needed
  getMapData: async (filters: any) => {
      const response = await apiClient.get('/search/map', { params: filters });
      return response.data;
  }
};
