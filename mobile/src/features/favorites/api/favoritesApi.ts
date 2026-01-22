/**
 * IMOBI - Favorites API
 * Favorites API client functions
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';
import type { IPropertyListing } from '@/core/api/types';

// ============================================================================
// TYPES
// ============================================================================

export interface IFavorite {
  id: number;
  userId: number;
  propertyId: number;
  property?: IPropertyListing;
  createdAt: string;
}

// ============================================================================
// FAVORITES ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all favorites for current user
 */
export const getFavorites = async (): Promise<IFavorite[]> => {
  const response = await apiClient.get<IFavorite[]>(
    API_ENDPOINTS.FAVORITES.LIST
  );
  return response.data;
};

/**
 * Add property to favorites
 */
export const addToFavorites = async (
  propertyId: number
): Promise<IFavorite> => {
  const response = await apiClient.post<IFavorite>(
    API_ENDPOINTS.FAVORITES.ADD,
    { propertyId }
  );
  return response.data;
};

/**
 * Remove property from favorites
 */
export const removeFromFavorites = async (
  propertyId: number
): Promise<{ success: boolean }> => {
  const response = await apiClient.delete<{ success: boolean }>(
    API_ENDPOINTS.FAVORITES.REMOVE(String(propertyId))
  );
  return response.data;
};

/**
 * Check if property is favorited
 */
export const isFavorite = async (
  propertyId: number
): Promise<{ isFavorite: boolean }> => {
  const response = await apiClient.get<{ isFavorite: boolean }>(
    API_ENDPOINTS.FAVORITES.CHECK(String(propertyId))
  );
  return response.data;
};

/**
 * Toggle favorite status (convenience function)
 */
export const toggleFavorite = async (
  propertyId: number,
  currentlyFavorite: boolean
): Promise<IFavorite | { success: boolean }> => {
  if (currentlyFavorite) {
    return removeFromFavorites(propertyId);
  } else {
    return addToFavorites(propertyId);
  }
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const favoritesApi = {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  toggleFavorite,
};

export default favoritesApi;
