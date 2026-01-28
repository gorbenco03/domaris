/**
 * RIVA - Viewings Hooks
 * React Query hooks for viewings/bookings
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { viewingsApi } from '../api/viewingsApi';

/**
 * Get all viewings
 * Unified account model - returns all viewings where user is involved (as property owner or as requester)
 */
export const useViewings = (params?: {
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

/**
 * Reschedule viewing mutation
 */
export const useRescheduleViewing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newSlot, reason }: { id: string; newSlot: string; reason?: string }) =>
      viewingsApi.rescheduleViewing(id, newSlot, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWINGS, variables.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWINGS] });
    },
  });
};

/**
 * Submit viewing feedback mutation
 */
export const useSubmitViewingFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      rating,
      comment,
      interested,
    }: {
      id: string;
      rating: number;
      comment?: string;
      interested?: boolean;
    }) => viewingsApi.submitViewingFeedback(id, rating, comment, interested),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWINGS, variables.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWINGS] });
    },
  });
};

/**
 * Get viewing availability for a property
 */
export const useViewingAvailability = (
  propertyId: string | number | undefined,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.VIEWINGS, 'availability', propertyId, startDate, endDate],
    queryFn: () => viewingsApi.getViewingAvailability(propertyId!, startDate, endDate),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
