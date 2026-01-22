/**
 * IMOBI - Viewings API
 * Property viewings/bookings API client functions
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';

// Import types from shared package
export type {
  IViewing,
  IViewingListItem,
  IViewingTimeSlot,
  IViewingFeedback,
  ICreateViewingDto,
  IConfirmViewingDto,
  ICancelViewingDto,
  IRescheduleViewingDto,
  ISubmitViewingFeedbackDto,
} from '@domaris/types';

import type { IViewing, IViewingListItem } from '@domaris/types';

// ============================================================================
// VIEWINGS ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all viewings for current user
 */
export const getViewings = async (params?: {
  role?: 'seeker' | 'owner';
  status?: string;
  page?: number;
  limit?: number;
}): Promise<IViewingListItem[]> => {
  const response = await apiClient.get<IViewingListItem[]>(
    API_ENDPOINTS.VIEWINGS.LIST,
    { params }
  );
  return response.data;
};

/**
 * Get upcoming viewings
 */
export const getUpcomingViewings = async (): Promise<IViewingListItem[]> => {
  const response = await apiClient.get<IViewingListItem[]>(
    `${API_ENDPOINTS.VIEWINGS.LIST}/upcoming`
  );
  return response.data;
};

/**
 * Get viewing by ID (detailed)
 */
export const getViewingById = async (id: string): Promise<IViewing> => {
  const response = await apiClient.get<IViewing>(
    API_ENDPOINTS.VIEWINGS.DETAIL(id)
  );
  return response.data;
};

/**
 * Create new viewing request
 */
export const requestViewing = async (data: {
  propertyId: number;
  slot: string;
  notes?: string;
}): Promise<IViewing> => {
  const response = await apiClient.post<IViewing>(
    API_ENDPOINTS.VIEWINGS.CREATE,
    data
  );
  return response.data;
};

/**
 * Update viewing status (confirm/reject/cancel)
 */
export const updateViewingStatus = async (
  id: string,
  status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED',
  reason?: string
): Promise<IViewing> => {
  const response = await apiClient.patch<IViewing>(
    `${API_ENDPOINTS.VIEWINGS.DETAIL(id)}/status`,
    { status, reason }
  );
  return response.data;
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const viewingsApi = {
  getViewings,
  getUpcomingViewings,
  getViewingById,
  requestViewing,
  updateViewingStatus,
};

export default viewingsApi;
