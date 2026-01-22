/**
 * IMOBI - Saved Searches API
 * Saved searches with alerts API client functions
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';
import type { IPropertyListing } from '@/core/api/types';

// ============================================================================
// TYPES
// ============================================================================

export type AlertFrequency = 'INSTANT' | 'DAILY' | 'WEEKLY';

export interface ISavedSearchParams {
  // Full-text search
  query?: string;

  // Location
  city?: string;
  neighborhood?: string;

  // Price
  priceMin?: number;
  priceMax?: number;

  // Rooms
  rooms?: number;
  roomsMin?: number;
  roomsMax?: number;

  // Surface
  surfaceMin?: number;
  surfaceMax?: number;

  // Amenities
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  petFriendly?: boolean;

  // Filters
  excludeAgencies?: boolean;

  // Sorting
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'relevance';

  // Any other params
  [key: string]: any;
}

export interface ISavedSearch {
  id: number;
  name: string;
  params: ISavedSearchParams;
  alertsEnabled: boolean;
  alertFrequency?: AlertFrequency;
  newMatchesCount: number; // Badge roșu!
  totalMatchesCount: number;
  lastViewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateSavedSearchRequest {
  name: string;
  params: ISavedSearchParams;
  alertsEnabled?: boolean;
  alertFrequency?: AlertFrequency;
}

export interface IUpdateSavedSearchRequest {
  name?: string;
  params?: ISavedSearchParams;
  alertsEnabled?: boolean;
  alertFrequency?: AlertFrequency;
}

export interface IToggleAlertsRequest {
  enabled: boolean;
  frequency?: AlertFrequency;
}

export interface IExecuteSavedSearchResponse {
  data: IPropertyListing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// SAVED SEARCHES ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all saved searches for current user
 */
export const getAllSavedSearches = async (): Promise<ISavedSearch[]> => {
  const response = await apiClient.get<ISavedSearch[]>(
    API_ENDPOINTS.SAVED_SEARCHES.LIST
  );
  return response.data;
};

/**
 * Get saved search by ID
 */
export const getSavedSearchById = async (
  id: number
): Promise<ISavedSearch> => {
  const response = await apiClient.get<ISavedSearch>(
    API_ENDPOINTS.SAVED_SEARCHES.DETAIL(String(id))
  );
  return response.data;
};

/**
 * Create new saved search
 */
export const createSavedSearch = async (
  data: ICreateSavedSearchRequest
): Promise<ISavedSearch> => {
  const response = await apiClient.post<ISavedSearch>(
    API_ENDPOINTS.SAVED_SEARCHES.CREATE,
    data
  );
  return response.data;
};

/**
 * Update saved search
 */
export const updateSavedSearch = async (
  id: number,
  data: IUpdateSavedSearchRequest
): Promise<ISavedSearch> => {
  const response = await apiClient.put<ISavedSearch>(
    API_ENDPOINTS.SAVED_SEARCHES.DETAIL(String(id)),
    data
  );
  return response.data;
};

/**
 * Delete saved search
 */
export const deleteSavedSearch = async (
  id: number
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    API_ENDPOINTS.SAVED_SEARCHES.DELETE(String(id))
  );
  return response.data;
};

/**
 * Execute saved search and get results
 * This also marks the search as "viewed" and resets newMatchesCount to 0
 */
export const executeSavedSearch = async (
  id: number,
  page: number = 1,
  limit: number = 20
): Promise<IExecuteSavedSearchResponse> => {
  const response = await apiClient.get<IExecuteSavedSearchResponse>(
    API_ENDPOINTS.SAVED_SEARCHES.RUN(String(id)),
    {
      params: { page, limit },
    }
  );
  return response.data;
};

/**
 * Toggle alerts for saved search
 * @param id - Saved search ID
 * @param enabled - Enable or disable alerts
 * @param frequency - Alert frequency (INSTANT, DAILY, WEEKLY)
 */
export const toggleSavedSearchAlerts = async (
  id: number,
  data: IToggleAlertsRequest
): Promise<ISavedSearch> => {
  const response = await apiClient.patch<ISavedSearch>(
    API_ENDPOINTS.SAVED_SEARCHES.TOGGLE_ALERTS(String(id)),
    data
  );
  return response.data;
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Enable alerts for saved search
 */
export const enableSavedSearchAlerts = async (
  id: number,
  frequency: AlertFrequency = 'DAILY'
): Promise<ISavedSearch> => {
  return toggleSavedSearchAlerts(id, { enabled: true, frequency });
};

/**
 * Disable alerts for saved search
 */
export const disableSavedSearchAlerts = async (
  id: number
): Promise<ISavedSearch> => {
  return toggleSavedSearchAlerts(id, { enabled: false });
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const savedSearchesApi = {
  getAllSavedSearches,
  getSavedSearchById,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  executeSavedSearch,
  toggleSavedSearchAlerts,
  enableSavedSearchAlerts,
  disableSavedSearchAlerts,
};

export default savedSearchesApi;
