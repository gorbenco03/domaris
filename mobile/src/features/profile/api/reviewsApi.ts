/**
 * RIVA - Reviews API
 * API client functions for user reviews
 */

import { apiClient } from '@/core/api/client';

// ============================================================================
// TYPES
// ============================================================================

export interface IReviewAuthor {
  id: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
}

export interface IReviewResponse {
  content: string;
  date: string;
}

export interface IReview {
  id: string;
  author: IReviewAuthor | null;
  rating: number;
  title?: string;
  content?: string;
  date: string;
  helpful: number;
  isHelpful?: boolean;
  transactionType?: 'buyer' | 'seller' | 'renter' | 'landlord';
  propertyTitle?: string;
  interested?: boolean;
  response?: IReviewResponse;
}

export interface IReviewStats {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  responseRate: number;
}

export interface ICreateReviewDto {
  viewingId: number;
  rating: number;
  title?: string;
  comment?: string;
  interested?: boolean;
  transactionType?: 'buyer' | 'seller' | 'renter' | 'landlord';
}

export interface IReviewsResponse {
  data: IReview[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get reviews for a user
 */
export const getUserReviews = async (
  userId: string,
  params?: {
    page?: number;
    limit?: number;
    minRating?: number;
    maxRating?: number;
  }
): Promise<IReviewsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.minRating) queryParams.append('minRating', String(params.minRating));
  if (params?.maxRating) queryParams.append('maxRating', String(params.maxRating));

  const queryString = queryParams.toString();
  const url = `/reviews/user/${userId}${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<IReviewsResponse>(url);
  return response.data;
};

/**
 * Get review statistics for a user
 */
export const getUserReviewStats = async (userId: string): Promise<IReviewStats> => {
  const response = await apiClient.get<IReviewStats>(`/reviews/user/${userId}/stats`);
  return response.data;
};

/**
 * Get a single review
 */
export const getReview = async (reviewId: string): Promise<IReview> => {
  const response = await apiClient.get<IReview>(`/reviews/${reviewId}`);
  return response.data;
};

/**
 * Create a new review
 */
export const createReview = async (data: ICreateReviewDto): Promise<IReview> => {
  const response = await apiClient.post<IReview>('/reviews', data);
  return response.data;
};

/**
 * Respond to a review (for review recipients)
 */
export const respondToReview = async (
  reviewId: string,
  responseText: string
): Promise<IReview> => {
  const response = await apiClient.post<IReview>(`/reviews/${reviewId}/respond`, {
    response: responseText,
  });
  return response.data;
};

/**
 * Toggle helpful vote on a review
 */
export const toggleReviewHelpful = async (
  reviewId: string
): Promise<{ helpful: number; isHelpful: boolean }> => {
  const response = await apiClient.post<{ helpful: number; isHelpful: boolean }>(
    `/reviews/${reviewId}/helpful`
  );
  return response.data;
};

/**
 * Report a review
 */
export const reportReview = async (
  reviewId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    `/reviews/${reviewId}/report`,
    { reason }
  );
  return response.data;
};
