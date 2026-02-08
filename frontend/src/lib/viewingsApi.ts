/**
 * RIVA - Viewings API
 * Property viewings/bookings API client functions for Frontend
 */

import { api } from './api';

// ============================================================================
// TYPES
// ============================================================================

export type ViewingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface ViewingProperty {
  id: number;
  title: string;
  address?: string;
  city?: string;
  image?: string;
}

export interface ViewingParticipant {
  id: number;
  name: string;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface Viewing {
  id: string;
  property: ViewingProperty;
  requester: ViewingParticipant;
  owner: ViewingParticipant;
  scheduledAt: string;
  duration: number; // minutes
  status: ViewingStatus;
  notes?: string;
  feedback?: {
    rating: number;
    comment?: string;
    interested?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ViewingTimeSlot {
  startTime: string;
  endTime: string;
}

export interface ViewingAvailability {
  propertyId: number;
  availableDates: string[];
  availability: Record<string, ViewingTimeSlot[]>;
  defaultDuration: number;
}

// ============================================================================
// VIEWINGS ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all viewings for current user
 */
export async function getViewings(params?: {
  status?: ViewingStatus;
  page?: number;
  limit?: number;
}): Promise<Viewing[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  
  const query = queryParams.toString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await api.fetch<any>(`/viewings${query ? `?${query}` : ''}`);
  
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  return [];
}

/**
 * Get upcoming viewings
 */
export async function getUpcomingViewings(): Promise<Viewing[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await api.fetch<any>('/viewings/upcoming');
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  return [];
}

/**
 * Get viewing by ID
 */
export async function getViewingById(id: string): Promise<Viewing> {
  return api.fetch<Viewing>(`/viewings/${id}`);
}

/**
 * Request a viewing for a property
 */
export async function requestViewing(data: {
  propertyId: number;
  slot: string; // ISO datetime
  notes?: string;
}): Promise<Viewing> {
  return api.fetch<Viewing>('/viewings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update viewing status (confirm/reject/cancel)
 */
export async function updateViewingStatus(
  id: string,
  status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED',
  reason?: string
): Promise<Viewing> {
  return api.fetch<Viewing>(`/viewings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  });
}

/**
 * Reschedule viewing
 */
export async function rescheduleViewing(
  id: string,
  newSlot: string,
  reason?: string
): Promise<Viewing> {
  return api.fetch<Viewing>(`/viewings/${id}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify({ newSlot, reason }),
  });
}

/**
 * Submit feedback after viewing
 */
export async function submitViewingFeedback(
  id: string,
  rating: number,
  comment?: string,
  interested?: boolean
): Promise<{ success: boolean; message: string }> {
  return api.fetch<{ success: boolean; message: string }>(`/viewings/${id}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment, interested }),
  });
}

/**
 * Get available viewing slots for a property
 */
export async function getViewingAvailability(
  propertyId: string | number,
  startDate?: string,
  endDate?: string
): Promise<ViewingAvailability> {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  
  const query = queryParams.toString();
  return api.fetch<ViewingAvailability>(
    `/viewings/availability/${propertyId}${query ? `?${query}` : ''}`
  );
}

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
