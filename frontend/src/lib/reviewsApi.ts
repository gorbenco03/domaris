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

// Backend (ReviewService.formatReview) shape — names differ from the UI Review.
interface BackendReview {
  id: string;
  author?: { id: string; name: string; avatar?: string; isVerified?: boolean } | null;
  rating: number;
  title?: string;
  content?: string;
  date?: string;
  helpful?: number;
  response?: { content: string; date?: string };
}

/** Translate a backend review into the shape the UI components consume. */
function mapReview(r: BackendReview): Review {
  return {
    id: String(r.id),
    authorId: r.author?.id ? String(r.author.id) : '',
    authorName: r.author?.name || 'Utilizator',
    authorAvatar: r.author?.avatar,
    subjectId: '',
    rating: r.rating ?? 0,
    comment: r.content || r.title || '',
    response: r.response?.content,
    helpfulCount: r.helpful ?? 0,
    createdAt: r.date || new Date().toISOString(),
  };
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  // Backend returns { data: BackendReview[], meta }. Older shapes ({reviews} / array)
  // are tolerated for safety.
  const res = await api.fetch<
    { data?: BackendReview[]; reviews?: BackendReview[] } | BackendReview[]
  >(`/reviews/user/${userId}`);

  const rows = Array.isArray(res) ? res : res.data ?? res.reviews ?? [];
  return rows.map(mapReview);
}

export async function getUserReviewStats(userId: string): Promise<ReviewStats> {
  // Backend returns { average, total, distribution }. UI wants { averageRating, totalCount, distribution }.
  const res = await api.fetch<{
    average?: number;
    averageRating?: number;
    total?: number;
    totalCount?: number;
    distribution?: Record<1 | 2 | 3 | 4 | 5, number>;
  }>(`/reviews/user/${userId}/stats`);

  return {
    averageRating: res.averageRating ?? res.average ?? 0,
    totalCount: res.totalCount ?? res.total ?? 0,
    distribution: res.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
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
