import { apiClient } from '@/lib/client';
import type { Viewing, TimeSlot, OwnerAvailability } from './types';

export const viewingsApi = {
  getViewings: async (params?: {
    status?: string;
    role?: 'seeker' | 'owner';
    page?: number;
    limit?: number;
  }): Promise<Viewing[]> => {
    const response = await apiClient.get<{ data: Viewing[] }>('/viewings', { params });
    return response.data.data;
  },

  getViewing: async (id: string): Promise<Viewing> => {
    const response = await apiClient.get<Viewing>(`/viewings/${id}`);
    return response.data;
  },

  createViewing: async (data: {
    propertyId: string;
    requestedSlots: TimeSlot[];
    notes?: string;
  }): Promise<Viewing> => {
    const response = await apiClient.post<Viewing>('/viewings', data);
    return response.data;
  },

  confirmViewing: async (id: string, confirmedSlot: TimeSlot): Promise<Viewing> => {
    const response = await apiClient.post<Viewing>(`/viewings/${id}/confirm`, { confirmedSlot });
    return response.data;
  },

  rescheduleViewing: async (id: string, newSlots: TimeSlot[]): Promise<Viewing> => {
    const response = await apiClient.post<Viewing>(`/viewings/${id}/reschedule`, { requestedSlots: newSlots });
    return response.data;
  },

  cancelViewing: async (id: string, reason?: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(`/viewings/${id}/cancel`, { reason });
    return response.data;
  },

  completeViewing: async (id: string): Promise<Viewing> => {
    const response = await apiClient.post<Viewing>(`/viewings/${id}/complete`);
    return response.data;
  },

  submitFeedback: async (id: string, feedback: {
    rating: 1 | 2 | 3 | 4 | 5;
    interested: boolean;
    comment?: string;
  }): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(`/viewings/${id}/feedback`, feedback);
    return response.data;
  },

  // Owner availability
  getAvailability: async (propertyId: string): Promise<OwnerAvailability> => {
    const response = await apiClient.get<OwnerAvailability>(`/properties/${propertyId}/availability`);
    return response.data;
  },

  updateAvailability: async (propertyId: string, availability: Partial<OwnerAvailability>): Promise<OwnerAvailability> => {
    const response = await apiClient.put<OwnerAvailability>(`/properties/${propertyId}/availability`, availability);
    return response.data;
  },
};
