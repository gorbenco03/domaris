import { apiClient } from '@/lib/client';

export interface FavoriteProperty {
  id: number;
  propertyId: number;
  title: string;
  location: string;
  price: number;
  imageUrl?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  notes?: string;
  savedAt: Date;
  listId?: string;
}

export interface FavoriteList {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  count: number;
  isDefault: boolean;
}

export const favoritesApi = {
  getFavorites: async (params?: {
    listId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: FavoriteProperty[]; total: number }> => {
    const response = await apiClient.get('/favorites', { params });
    return response.data;
  },

  addFavorite: async (propertyId: number, listId?: string, notes?: string): Promise<FavoriteProperty> => {
    const response = await apiClient.post('/favorites', { propertyId, listId, notes });
    return response.data;
  },

  removeFavorite: async (propertyId: number): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/favorites/${propertyId}`);
    return response.data;
  },

  checkFavorite: async (propertyId: number): Promise<{ isFavorited: boolean; favoriteId?: number }> => {
    const response = await apiClient.get(`/favorites/check/${propertyId}`);
    return response.data;
  },

  // Lists
  getLists: async (): Promise<FavoriteList[]> => {
    const response = await apiClient.get('/favorites/lists');
    return response.data;
  },

  createList: async (name: string, description?: string, color?: string, icon?: string): Promise<FavoriteList> => {
    const response = await apiClient.post('/favorites/lists', { name, description, color, icon });
    return response.data;
  },

  updateList: async (listId: string, updates: Partial<FavoriteList>): Promise<FavoriteList> => {
    const response = await apiClient.put(`/favorites/lists/${listId}`, updates);
    return response.data;
  },

  deleteList: async (listId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/favorites/lists/${listId}`);
    return response.data;
  },

  moveFavorite: async (propertyId: number, toListId: string, fromListId?: string): Promise<FavoriteProperty> => {
    const response = await apiClient.post('/favorites/move', { propertyId, toListId, fromListId });
    return response.data;
  },

  compareProperties: async (propertyIds: number[]): Promise<any> => {
    const response = await apiClient.post('/favorites/compare', { propertyIds });
    return response.data;
  },
};
