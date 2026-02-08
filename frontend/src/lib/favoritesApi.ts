/**
 * RIVA - Favorites API
 * Favorites API client functions for Frontend
 */

import { api } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface FavoriteProperty {
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
}

export interface FavoriteItem {
  id: number;
  propertyId: number;
  listId?: string | null;
  notes?: string | null;
  addedAt: string;
  property?: FavoriteProperty | null;
}

export interface FavoritesResponse {
  data: FavoriteItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface FavoriteList {
  id: string;
  name: string;
  count?: number;
  isDefault?: boolean;
  description?: string;
  color?: string;
  icon?: string;
}

export interface CreateFavoriteListDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateFavoriteListDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface FavoriteStatus {
  isFavorite: boolean;
  listId: string | null;
  addedAt: string | null;
}

// ============================================================================
// FAVORITES ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all favorites for current user
 */
export async function getFavorites(params?: {
  listId?: string;
  page?: number;
  limit?: number;
}): Promise<FavoritesResponse> {
  const queryParams = new URLSearchParams();
  if (params?.listId) queryParams.append('listId', params.listId);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  
  const query = queryParams.toString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await api.fetch<any>(`/favorites${query ? `?${query}` : ''}`);
  
  // Handle different response formats
  if (response && 'data' in response && 'meta' in response) {
    return response as FavoritesResponse;
  }
  if (Array.isArray(response)) {
    return {
      data: response as FavoriteItem[],
      meta: { page: 1, limit: 20, total: response.length, hasMore: false }
    };
  }
  return { data: [], meta: { page: 1, limit: 20, total: 0, hasMore: false } };
}

/**
 * Add property to favorites
 */
export async function addToFavorites(
  propertyId: number,
  options?: { listId?: string; notes?: string }
): Promise<FavoriteItem> {
  return api.fetch<FavoriteItem>('/favorites', {
    method: 'POST',
    body: JSON.stringify({ propertyId, ...options }),
  });
}

/**
 * Remove property from favorites
 */
export async function removeFromFavorites(
  propertyId: number
): Promise<{ success: boolean; message?: string }> {
  return api.fetch<{ success: boolean; message?: string }>(`/favorites/${propertyId}`, {
    method: 'DELETE',
  });
}

/**
 * Check if property is favorited
 */
export async function checkIsFavorite(propertyId: number): Promise<FavoriteStatus> {
  return api.fetch<FavoriteStatus>(`/favorites/check/${propertyId}`);
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  propertyId: number,
  currentlyFavorite: boolean
): Promise<FavoriteItem | { success: boolean; message?: string }> {
  if (currentlyFavorite) {
    return removeFromFavorites(propertyId);
  } else {
    return addToFavorites(propertyId);
  }
}

// ============================================================================
// FAVORITE LISTS
// ============================================================================

/**
 * Get all favorite lists for current user
 */
export async function getFavoriteLists(): Promise<FavoriteList[]> {
  return api.fetch<FavoriteList[]>('/favorites/lists');
}

/**
 * Create a favorite list
 */
export async function createFavoriteList(
  payload: CreateFavoriteListDto
): Promise<FavoriteList> {
  return api.fetch<FavoriteList>('/favorites/lists', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update a favorite list
 */
export async function updateFavoriteList(
  listId: string,
  payload: UpdateFavoriteListDto
): Promise<FavoriteList> {
  return api.fetch<FavoriteList>(`/favorites/lists/${listId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a favorite list
 */
export async function deleteFavoriteList(
  listId: string
): Promise<{ success: boolean; message?: string }> {
  return api.fetch<{ success: boolean; message?: string }>(`/favorites/lists/${listId}`, {
    method: 'DELETE',
  });
}

/**
 * Move favorite between lists
 */
export async function moveFavorite(payload: {
  propertyId: number;
  toListId: string;
  fromListId?: string;
}): Promise<FavoriteItem> {
  return api.fetch<FavoriteItem>('/favorites/move', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const favoritesApi = {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkIsFavorite,
  toggleFavorite,
  getFavoriteLists,
  createFavoriteList,
  updateFavoriteList,
  deleteFavoriteList,
  moveFavorite,
};

export default favoritesApi;
