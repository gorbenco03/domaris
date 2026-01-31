/**
 * RIVA - Favorites API
 * Favorites API client functions
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';

// ============================================================================
// TYPES
// ============================================================================

export interface IFavoriteProperty {
  id: number;
  title: string;
  price: number;
  address?: string;
  city?: string;
  area?: number;
  rooms?: number;
  surface?: number;
  image?: string | null;
  isFurnished?: boolean;
  status?: string;
  coordinates?: { lat: number; lng: number } | null;
}

export interface IFavoriteItem {
  id: number;
  propertyId: number;
  listId?: string | null;
  notes?: string | null;
  addedAt: string;
  property?: IFavoriteProperty | null;
}

export interface IFavoritesResponse {
  data: IFavoriteItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface IFavoriteListItem {
  id: string;
  name: string;
  count?: number;
  isDefault?: boolean;
  description?: string;
  color?: string;
  icon?: string;
}

export interface ICreateFavoriteListDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface IUpdateFavoriteListDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface IFavoriteStatus {
  isFavorite: boolean;
  listId: string | null;
  addedAt: string | null;
}

export interface IFavoriteCompareResponse {
  properties: Array<{
    id: number;
    title: string;
    image?: string | null;
    address?: string;
    city?: string;
  }>;
  matrix: Array<{
    label: string;
    values: Array<{
      propertyId: number;
      value: any;
      formatted: string;
    }>;
  }>;
}

// ============================================================================
// FAVORITES ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all favorites for current user
 */
export const getFavorites = async (params?: {
  listId?: string;
  page?: number;
  limit?: number;
}): Promise<IFavoritesResponse> => {
  const response = await apiClient.get<IFavoritesResponse>(
    API_ENDPOINTS.FAVORITES.LIST,
    { params }
  );
  return response.data;
};

/**
 * Add property to favorites
 */
export const addToFavorites = async (
  propertyId: number,
  options?: { listId?: string; notes?: string }
): Promise<IFavoriteItem> => {
  const response = await apiClient.post<IFavoriteItem>(
    API_ENDPOINTS.FAVORITES.ADD,
    { propertyId, ...options }
  );
  return response.data;
};

/**
 * Remove property from favorites
 */
export const removeFromFavorites = async (
  propertyId: number
): Promise<{ success: boolean; message?: string }> => {
  const response = await apiClient.delete<{ success: boolean; message?: string }>(
    API_ENDPOINTS.FAVORITES.REMOVE(String(propertyId))
  );
  return response.data;
};

/**
 * Check if property is favorited
 */
export const isFavorite = async (
  propertyId: number
): Promise<IFavoriteStatus> => {
  const response = await apiClient.get<IFavoriteStatus>(
    API_ENDPOINTS.FAVORITES.CHECK(String(propertyId))
  );
  return response.data;
};

/**
 * Get all favorite lists for current user
 */
export const getFavoriteLists = async (): Promise<IFavoriteListItem[]> => {
  const response = await apiClient.get<IFavoriteListItem[]>(
    API_ENDPOINTS.FAVORITES.LISTS
  );
  return response.data;
};

/**
 * Create a favorite list
 */
export const createFavoriteList = async (
  payload: ICreateFavoriteListDto
): Promise<IFavoriteListItem> => {
  const response = await apiClient.post<IFavoriteListItem>(
    API_ENDPOINTS.FAVORITES.LISTS,
    payload
  );
  return response.data;
};

/**
 * Update a favorite list
 */
export const updateFavoriteList = async (
  listId: string,
  payload: IUpdateFavoriteListDto
): Promise<IFavoriteListItem> => {
  const response = await apiClient.put<IFavoriteListItem>(
    `${API_ENDPOINTS.FAVORITES.LISTS}/${listId}`,
    payload
  );
  return response.data;
};

/**
 * Delete a favorite list
 */
export const deleteFavoriteList = async (
  listId: string
): Promise<{ success: boolean; message?: string }> => {
  const response = await apiClient.delete<{ success: boolean; message?: string }>(
    `${API_ENDPOINTS.FAVORITES.LISTS}/${listId}`
  );
  return response.data;
};

/**
 * Move favorite between lists
 */
export const moveFavorite = async (payload: {
  propertyId: number;
  toListId: string;
  fromListId?: string;
}): Promise<IFavoriteItem> => {
  const response = await apiClient.post<IFavoriteItem>(
    API_ENDPOINTS.FAVORITES.MOVE,
    payload
  );
  return response.data;
};

/**
 * Compare multiple properties
 */
export const compareFavorites = async (
  propertyIds: number[]
): Promise<IFavoriteCompareResponse> => {
  const response = await apiClient.post<IFavoriteCompareResponse>(
    API_ENDPOINTS.FAVORITES.COMPARE,
    { propertyIds }
  );
  return response.data;
};

/**
 * Toggle favorite status (convenience function)
 */
export const toggleFavorite = async (
  propertyId: number,
  currentlyFavorite: boolean
): Promise<IFavoriteItem | { success: boolean; message?: string }> => {
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
  getFavoriteLists,
  createFavoriteList,
  updateFavoriteList,
  deleteFavoriteList,
  moveFavorite,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  compareFavorites,
  toggleFavorite,
};

export default favoritesApi;
