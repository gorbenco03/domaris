/**
 * IMOBI - Viewings Hooks
 * React Query hooks for viewings/bookings
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { viewingsApi } from '../api/viewingsApi';

/**
 * Get all viewings
 */
export const useViewings = (params?: {
  role?: 'seeker' | 'owner';
  status?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.VIEWINGS, params],
    queryFn: () => viewingsApi.getViewings(params),
  });
};

/**
 * Get upcoming viewings
 */
export const useUpcomingViewings = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.VIEWINGS, 'upcoming'],
    queryFn: viewingsApi.getUpcomingViewings,
  });
};

/**
 * Get viewing details by ID
 */
export const useViewing = (id: string | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEYS.VIEWINGS, id],
    queryFn: () => viewingsApi.getViewingById(id!),
    enabled: !!id,
  });
};

/**
 * Request viewing mutation
 */
export const useRequestViewing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { propertyId: number; slot: string; notes?: string }) =>
      viewingsApi.requestViewing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWINGS] });
    },
  });
};

/**
 * Confirm viewing mutation (owner)
 */
export const useConfirmViewing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      viewingsApi.updateViewingStatus(id, 'CONFIRMED', reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWINGS, variables.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWINGS] });
    },
  });
};

/**
 * Reject viewing mutation (owner)
 */
export const useRejectViewing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      viewingsApi.updateViewingStatus(id, 'REJECTED', reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWINGS, variables.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWINGS] });
    },
  });
};

/**
 * Cancel viewing mutation (seeker)
 */
export const useCancelViewing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      viewingsApi.updateViewingStatus(id, 'CANCELLED', reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWINGS, variables.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWINGS] });
    },
  });
};
