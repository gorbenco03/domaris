/**
 * RIVA - Saved Searches API
 * Saved searches with alerts API client functions for Frontend
 */

import { api } from './api';

// ============================================================================
// TYPES
// ============================================================================

export type AlertFrequency = 'INSTANT' | 'DAILY' | 'WEEKLY';

export interface SavedSearchParams {
  query?: string;
  city?: string;
  neighborhood?: string;
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  roomsMin?: number;
  roomsMax?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  isFurnished?: boolean;
  transactionType?: 'RENT' | 'SALE';
  propertyType?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'relevance';
  [key: string]: unknown;
}

export interface SavedSearch {
  id: number;
  name: string;
  params: SavedSearchParams;
  alertsEnabled: boolean;
  alertFrequency?: AlertFrequency;
  newMatchesCount: number;
  totalMatchesCount: number;
  lastViewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedSearchDto {
  name: string;
  params: SavedSearchParams;
  alertsEnabled?: boolean;
  alertFrequency?: AlertFrequency;
}

export interface UpdateSavedSearchDto {
  name?: string;
  params?: SavedSearchParams;
  alertsEnabled?: boolean;
  alertFrequency?: AlertFrequency;
}

// ============================================================================
// SAVED SEARCHES ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all saved searches for current user
 */
export async function getSavedSearches(): Promise<SavedSearch[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await api.fetch<any>('/saved-searches');
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  return [];
}

/**
 * Get saved search by ID
 */
export async function getSavedSearchById(id: number): Promise<SavedSearch> {
  return api.fetch<SavedSearch>(`/saved-searches/${id}`);
}

/**
 * Create new saved search
 */
export async function createSavedSearch(data: CreateSavedSearchDto): Promise<SavedSearch> {
  return api.fetch<SavedSearch>('/saved-searches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update saved search
 */
export async function updateSavedSearch(
  id: number,
  data: UpdateSavedSearchDto
): Promise<SavedSearch> {
  return api.fetch<SavedSearch>(`/saved-searches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete saved search
 */
export async function deleteSavedSearch(id: number): Promise<{ success: boolean; message: string }> {
  return api.fetch<{ success: boolean; message: string }>(`/saved-searches/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Execute saved search and get results
 */
export async function executeSavedSearch(
  id: number,
  page: number = 1,
  limit: number = 20
): Promise<{
  data: Array<{
    id: number;
    title: string;
    priceEur: number;
    city: string;
    rooms: number;
    surfaceSqm: number;
    image?: string;
  }>;
  total: number;
  hasMore: boolean;
}> {
  return api.fetch(`/saved-searches/${id}/run?page=${page}&limit=${limit}`);
}

/**
 * Toggle alerts for saved search
 */
export async function toggleSavedSearchAlerts(
  id: number,
  enabled: boolean,
  frequency?: AlertFrequency
): Promise<SavedSearch> {
  return api.fetch<SavedSearch>(`/saved-searches/${id}/alerts`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled, frequency }),
  });
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const savedSearchesApi = {
  getSavedSearches,
  getSavedSearchById,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  executeSavedSearch,
  toggleSavedSearchAlerts,
};

export default savedSearchesApi;
