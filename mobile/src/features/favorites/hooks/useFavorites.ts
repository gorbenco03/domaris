/**
 * RIVA - Favorites Hooks
 * React Query hooks for favorites
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { favoritesApi } from '../api/favoritesApi';

export const useFavorites = (
  params?: {
  listId?: string;
  page?: number;
  limit?: number;
  },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.FAVORITES, 'list', params],
    queryFn: () => favoritesApi.getFavorites(params),
    enabled: options?.enabled ?? true,
  });
};

export const useFavoriteLists = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.FAVORITES, 'lists'],
    queryFn: favoritesApi.getFavoriteLists,
  });
};

export const useCreateFavoriteList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favoritesApi.createFavoriteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAVORITES, 'lists'] });
    },
  });
};

export const useUpdateFavoriteList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { listId: string; payload: { name?: string; description?: string; color?: string; icon?: string } }) =>
      favoritesApi.updateFavoriteList(data.listId, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAVORITES, 'lists'] });
    },
  });
};

export const useDeleteFavoriteList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => favoritesApi.deleteFavoriteList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAVORITES, 'lists'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAVORITES, 'list'] });
    },
  });
};

export const useMoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { propertyId: number; toListId: string; fromListId?: string }) =>
      favoritesApi.moveFavorite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAVORITES, 'list'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAVORITES, 'lists'] });
    },
  });
};

export const useFavoriteStatus = (
  propertyId?: number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.FAVORITES, 'status', propertyId],
    queryFn: () => favoritesApi.isFavorite(propertyId!),
    enabled: !!propertyId && (options?.enabled ?? true),
  });
};

export const useCompareFavorites = (propertyIds: number[]) => {
  return useQuery({
    queryKey: [QUERY_KEYS.FAVORITES, 'compare', propertyIds],
    queryFn: () => favoritesApi.compareFavorites(propertyIds),
    enabled: propertyIds.length >= 2,
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { propertyId: number; listId?: string; notes?: string }) =>
      favoritesApi.addToFavorites(data.propertyId, {
        listId: data.listId,
        notes: data.notes,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAVORITES] });
      queryClient.setQueryData(
        [QUERY_KEYS.FAVORITES, 'status', variables.propertyId],
        { isFavorite: true, listId: null, addedAt: new Date().toISOString() }
      );
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: number) => favoritesApi.removeFromFavorites(propertyId),
    onSuccess: (_, propertyId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAVORITES] });
      queryClient.setQueryData(
        [QUERY_KEYS.FAVORITES, 'status', propertyId],
        { isFavorite: false, listId: null, addedAt: null }
      );
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { propertyId: number; currentlyFavorite: boolean }) =>
      favoritesApi.toggleFavorite(data.propertyId, data.currentlyFavorite),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAVORITES] });
      queryClient.setQueryData(
        [QUERY_KEYS.FAVORITES, 'status', variables.propertyId],
        { isFavorite: !variables.currentlyFavorite, listId: null, addedAt: new Date().toISOString() }
      );
    },
  });
};
