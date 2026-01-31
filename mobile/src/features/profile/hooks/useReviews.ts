/**
 * RIVA - useReviews Hook
 * React Query hooks for reviews functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserReviews,
  getUserReviewStats,
  getReview,
  createReview,
  respondToReview,
  toggleReviewHelpful,
  reportReview,
  ICreateReviewDto,
  IReviewsResponse,
  IReviewStats,
  IReview,
} from '../api/reviewsApi';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const reviewsKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewsKeys.all, 'list'] as const,
  list: (userId: string, filters?: object) =>
    [...reviewsKeys.lists(), userId, filters] as const,
  stats: (userId: string) => [...reviewsKeys.all, 'stats', userId] as const,
  detail: (id: string) => [...reviewsKeys.all, 'detail', id] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to get reviews for a user
 */
export const useUserReviews = (
  userId: string | undefined,
  params?: {
    page?: number;
    limit?: number;
    minRating?: number;
    maxRating?: number;
  }
) => {
  return useQuery<IReviewsResponse, Error>({
    queryKey: reviewsKeys.list(userId || '', params),
    queryFn: () => getUserReviews(userId!, params),
    enabled: !!userId,
  });
};

/**
 * Hook to get review statistics for a user
 */
export const useUserReviewStats = (userId: string | undefined) => {
  return useQuery<IReviewStats, Error>({
    queryKey: reviewsKeys.stats(userId || ''),
    queryFn: () => getUserReviewStats(userId!),
    enabled: !!userId,
  });
};

/**
 * Hook to get a single review
 */
export const useReview = (reviewId: string | undefined) => {
  return useQuery<IReview, Error>({
    queryKey: reviewsKeys.detail(reviewId || ''),
    queryFn: () => getReview(reviewId!),
    enabled: !!reviewId,
  });
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new review
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateReviewDto) => createReview(data),
    onSuccess: (_, variables) => {
      // Invalidate reviews lists
      queryClient.invalidateQueries({ queryKey: reviewsKeys.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: reviewsKeys.all });
    },
  });
};

/**
 * Hook to respond to a review
 */
export const useRespondToReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, response }: { reviewId: string; response: string }) =>
      respondToReview(reviewId, response),
    onSuccess: (data, { reviewId }) => {
      // Update the review in cache
      queryClient.setQueryData<IReview>(reviewsKeys.detail(reviewId), data);
      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: reviewsKeys.lists() });
    },
  });
};

/**
 * Hook to toggle helpful vote
 */
export const useToggleReviewHelpful = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => toggleReviewHelpful(reviewId),
    onSuccess: (data, reviewId) => {
      // Update the review in any cached lists
      queryClient.invalidateQueries({ queryKey: reviewsKeys.lists() });
    },
  });
};

/**
 * Hook to report a review
 */
export const useReportReview = () => {
  return useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: string; reason: string }) =>
      reportReview(reviewId, reason),
  });
};
