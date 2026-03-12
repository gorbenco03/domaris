/**
 * RIVA - Reviews API
 */

import { api } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface Review {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  subjectId: string;
  rating: number; // 1-5
  comment: string;
  response?: string;
  helpfulCount: number;
  isHelpful?: boolean; // current user voted
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface CreateReviewDto {
  subjectId: string;
  viewingId?: string;
  rating: number;
  comment: string;
}

// ============================================================================
// ENDPOINTS
// ============================================================================

export async function getUserReviews(userId: string): Promise<Review[]> {
  const res = await api.fetch<Review[] | { reviews: Review[] }>(
    `/reviews/user/${userId}`
  );
  return Array.isArray(res) ? res : res.reviews ?? [];
}

export async function getUserReviewStats(userId: string): Promise<ReviewStats> {
  return api.fetch<ReviewStats>(`/reviews/user/${userId}/stats`);
}

export async function createReview(payload: CreateReviewDto): Promise<Review> {
  return api.fetch<Review>('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function respondToReview(reviewId: string, response: string): Promise<Review> {
  return api.fetch<Review>(`/reviews/${reviewId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ response }),
  });
}

export async function toggleHelpful(reviewId: string): Promise<{ helpfulCount: number; isHelpful: boolean }> {
  return api.fetch(`/reviews/${reviewId}/helpful`, {
    method: 'POST',
  });
}

export async function reportReview(reviewId: string, reason: string): Promise<{ success: boolean }> {
  return api.fetch(`/reviews/${reviewId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ============================================================================
// EXPORT
// ============================================================================

export const reviewsApi = {
  getUserReviews,
  getUserReviewStats,
  createReview,
  respondToReview,
  toggleHelpful,
  reportReview,
};

export default reviewsApi;
