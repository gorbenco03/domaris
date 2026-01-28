/**
 * IMOBI - User API
 * User profile API client functions
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';

// ============================================================================
// TYPES
// ============================================================================

export interface IPublicUserProfile {
  id: number;
  firstName: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  verificationLevel: number;
  rating: number;
  reviewsCount: number;
  memberSince: string | Date;
  isVerified: boolean;
  badges: string[];
  activeListingsCount: number;
}

export interface IUserListing {
  id: number;
  title: string;
  transactionType: string;
  propertyType: string;
  priceEur: number;
  city: string;
  neighborhood: string;
  rooms: number;
  bedrooms?: number;
  bathrooms?: number;
  surfaceSqm: number;
  images?: Array<{
    id: number;
    url: string;
    isPrimary: boolean;
  }>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ============================================================================
// PUBLIC PROFILE
// ============================================================================

/**
 * Get public user profile
 */
export const getPublicProfile = async (
  userId: string
): Promise<IPublicUserProfile> => {
  const response = await apiClient.get<IPublicUserProfile>(
    API_ENDPOINTS.USERS.PUBLIC_PROFILE(userId)
  );
  return response.data;
};

/**
 * Get public listings for a user
 */
export const getUserListings = async (
  userId: string
): Promise<IUserListing[]> => {
  const response = await apiClient.get<IUserListing[]>(
    API_ENDPOINTS.USERS.USER_LISTINGS(userId)
  );
  return response.data;
};
