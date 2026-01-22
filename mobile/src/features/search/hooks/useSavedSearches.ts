/**
 * IMOBI - Saved Searches Hooks
 * React Query hooks for saved searches
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import {
  savedSearchesApi,
  type ISavedSearch,
  type ICreateSavedSearchRequest,
  type IUpdateSavedSearchRequest,
} from '../api/savedSearchesApi';

/**
 * Get all saved searches
 */
export const useSavedSearches = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_FILTERS, 'saved'],
    queryFn: savedSearchesApi.getAllSavedSearches,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get saved search by ID
 */
export const useSavedSearch = (id: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_FILTERS, 'saved', id],
    queryFn: () => savedSearchesApi.getSavedSearchById(id),
    enabled: !!id,
  });
};

/**
 * Execute saved search and get results
 */
export const useExecuteSavedSearch = (id: number, page: number = 1) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_RESULTS, 'saved', id, page],
    queryFn: () => savedSearchesApi.executeSavedSearch(id, page),
    enabled: !!id,
  });
};

/**
 * Create saved search mutation
 */
export const useCreateSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateSavedSearchRequest) =>
      savedSearchesApi.createSavedSearch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SEARCH_FILTERS, 'saved'],
      });
    },
  });
};

/**
 * Update saved search mutation
 */
export const useUpdateSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: IUpdateSavedSearchRequest;
    }) => savedSearchesApi.updateSavedSearch(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SEARCH_FILTERS, 'saved'],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SEARCH_FILTERS, 'saved', variables.id],
      });
    },
  });
};

/**
 * Delete saved search mutation
 */
export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => savedSearchesApi.deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SEARCH_FILTERS, 'saved'],
      });
    },
  });
};

/**
 * Toggle alerts mutation
 */
export const useToggleSavedSearchAlerts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      enabled,
      frequency,
    }: {
      id: number;
      enabled: boolean;
      frequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
    }) => savedSearchesApi.toggleSavedSearchAlerts(id, { enabled, frequency }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SEARCH_FILTERS, 'saved'],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SEARCH_FILTERS, 'saved', variables.id],
      });
    },
  });
};
