/**
 * IMOBI - Viewings API
 * Property viewings/bookings API client functions
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';
import { mapViewingFromBackend, mapViewingsFromBackend, type BackendViewing } from '../services/viewingMapper';
import type { Viewing } from '../types';

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

// ============================================================================
// VIEWINGS ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all viewings for current user
 * Unified account model - returns all viewings where user is involved (as property owner or as requester)
 */
export const getViewings = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<Viewing[]> => {
  const response = await apiClient.get<{ data: BackendViewing[] }>(
    API_ENDPOINTS.VIEWINGS.LIST,
    { params }
  );
  return mapViewingsFromBackend(response.data.data || []);
};

/**
 * Get upcoming viewings
 */
/**
 * Get upcoming viewings
 * Unified account model - returns all upcoming viewings where user is involved
 */
export const getUpcomingViewings = async (): Promise<Viewing[]> => {
  const response = await apiClient.get<BackendViewing[]>(
    `${API_ENDPOINTS.VIEWINGS.LIST}/upcoming`
  );
  return mapViewingsFromBackend(response.data || []);
};

/**
 * Get viewing by ID (detailed)
 */
export const getViewingById = async (id: string): Promise<Viewing> => {
  const response = await apiClient.get<BackendViewing>(
    API_ENDPOINTS.VIEWINGS.DETAIL(id)
  );
  return mapViewingFromBackend(response.data);
};

/**
 * Create new viewing request
 */
export const requestViewing = async (data: {
  propertyId: number;
  slot: string;
  notes?: string;
}): Promise<Viewing> => {
  const response = await apiClient.post<BackendViewing>(
    API_ENDPOINTS.VIEWINGS.CREATE,
    data
  );
  return mapViewingFromBackend(response.data);
};

/**
 * Update viewing status (confirm/reject/cancel)
 */
export const updateViewingStatus = async (
  id: string,
  status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED',
  reason?: string
): Promise<Viewing> => {
  const response = await apiClient.patch<BackendViewing>(
    `${API_ENDPOINTS.VIEWINGS.DETAIL(id)}/status`,
    { status, reason }
  );
  return mapViewingFromBackend(response.data);
};

/**
 * Reschedule viewing
 */
export const rescheduleViewing = async (
  id: string,
  newSlot: string,
  reason?: string
): Promise<Viewing> => {
  const response = await apiClient.patch<BackendViewing>(
    `${API_ENDPOINTS.VIEWINGS.DETAIL(id)}/reschedule`,
    { newSlot, reason }
  );
  return mapViewingFromBackend(response.data);
};

/**
 * Submit feedback after viewing
 */
export const submitViewingFeedback = async (
  id: string,
  rating: number,
  comment?: string,
  interested?: boolean
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    `${API_ENDPOINTS.VIEWINGS.DETAIL(id)}/feedback`,
    { rating, comment, interested }
  );
  return response.data;
};

/**
 * Get available viewing slots for a property
 */
export const getViewingAvailability = async (
  propertyId: string | number,
  startDate?: string,
  endDate?: string
): Promise<{
  propertyId: number;
  availableDates: string[];
  availability: Record<string, Array<{ startTime: string; endTime: string }>>;
  defaultDuration: number;
}> => {
  const response = await apiClient.get<{
    propertyId: number;
    availableDates: string[];
    availability: Record<string, Array<{ startTime: string; endTime: string }>>;
    defaultDuration: number;
  }>(API_ENDPOINTS.VIEWINGS.AVAILABILITY(String(propertyId)), {
    params: { startDate, endDate },
  });
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
  rescheduleViewing,
  submitViewingFeedback,
  getViewingAvailability,
};

export default viewingsApi;
