/**
 * IMOBI - Viewings API
 * Property viewings/bookings API client functions
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';
import type { IPropertyListing } from '@/core/api/types';

// ============================================================================
// TYPES
// ============================================================================

export type ViewingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export interface IViewing {
  id: number;
  propertyId: number;
  property?: IPropertyListing;
  userId: number;
  ownerId: number;
  scheduledAt: string; // ISO date string
  status: ViewingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateViewingRequest {
  propertyId: number;
  scheduledAt: string; // ISO date string
  notes?: string;
}

export interface IUpdateViewingStatusRequest {
  status: ViewingStatus;
}

export interface IRescheduleViewingRequest {
  scheduledAt: string; // ISO date string
}

// ============================================================================
// VIEWINGS ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all viewings for current user
 */
export const getViewings = async (): Promise<IViewing[]> => {
  const response = await apiClient.get<IViewing[]>(
    API_ENDPOINTS.VIEWINGS.LIST
  );
  return response.data;
};

/**
 * Get viewing by ID
 */
export const getViewingById = async (id: number): Promise<IViewing> => {
  const response = await apiClient.get<IViewing>(
    API_ENDPOINTS.VIEWINGS.DETAIL(String(id))
  );
  return response.data;
};

/**
 * Create new viewing request
 */
export const createViewing = async (
  data: ICreateViewingRequest
): Promise<IViewing> => {
  const response = await apiClient.post<IViewing>(
    API_ENDPOINTS.VIEWINGS.CREATE,
    data
  );
  return response.data;
};

/**
 * Confirm viewing (owner action)
 */
export const confirmViewing = async (id: number): Promise<IViewing> => {
  const response = await apiClient.patch<IViewing>(
    API_ENDPOINTS.VIEWINGS.CONFIRM(String(id))
  );
  return response.data;
};

/**
 * Cancel viewing
 */
export const cancelViewing = async (id: number): Promise<IViewing> => {
  const response = await apiClient.patch<IViewing>(
    API_ENDPOINTS.VIEWINGS.CANCEL(String(id))
  );
  return response.data;
};

/**
 * Reschedule viewing
 */
export const rescheduleViewing = async (
  id: number,
  data: IRescheduleViewingRequest
): Promise<IViewing> => {
  const response = await apiClient.patch<IViewing>(
    API_ENDPOINTS.VIEWINGS.RESCHEDULE(String(id)),
    data
  );
  return response.data;
};

/**
 * Update viewing status
 */
export const updateViewingStatus = async (
  id: number,
  status: ViewingStatus
): Promise<IViewing> => {
  const response = await apiClient.patch<IViewing>(
    `${API_ENDPOINTS.VIEWINGS.DETAIL(String(id))}/status`,
    { status }
  );
  return response.data;
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get upcoming viewings
 */
export const getUpcomingViewings = async (): Promise<IViewing[]> => {
  const viewings = await getViewings();
  const now = new Date();
  return viewings
    .filter(
      (v) =>
        new Date(v.scheduledAt) > now &&
        (v.status === 'PENDING' || v.status === 'CONFIRMED')
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
};

/**
 * Get past viewings
 */
export const getPastViewings = async (): Promise<IViewing[]> => {
  const viewings = await getViewings();
  const now = new Date();
  return viewings
    .filter((v) => new Date(v.scheduledAt) <= now)
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const viewingsApi = {
  getViewings,
  getViewingById,
  createViewing,
  confirmViewing,
  cancelViewing,
  rescheduleViewing,
  updateViewingStatus,
  getUpcomingViewings,
  getPastViewings,
};

export default viewingsApi;
