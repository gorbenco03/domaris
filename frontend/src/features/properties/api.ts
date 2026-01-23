
import { apiClient } from '@/lib/client';
import type { 
  IProperty, 
  ICreatePropertyDto, 
  IUpdatePropertyDto, 
  IPropertySearchParams,
  IPropertySearchResult,
  IPropertyListItem
} from '@domaris/types';

export const propertiesApi = {
  // Public
  search: async (params?: IPropertySearchParams): Promise<IPropertySearchResult> => {
    const response = await apiClient.get<IPropertySearchResult>('/properties/search', { params });
    // If backend returns array directly or wrapped differently, adapt here. 
    // Types suggest IPropertySearchResult structure effectively.
    return response.data;
  },

  getDetail: async (id: string): Promise<IProperty> => {
    const response = await apiClient.get<IProperty>(`/properties/${id}`);
    return response.data;
  },

  // Authenticated
  getMyProperties: async (): Promise<IPropertyListItem[]> => {
    const response = await apiClient.get<IPropertyListItem[]>('/properties/my-properties');
    return response.data;
  },

  create: async (data: ICreatePropertyDto): Promise<IProperty> => {
    const response = await apiClient.post<IProperty>('/properties', data);
    return response.data;
  },

  update: async (id: string, data: IUpdatePropertyDto): Promise<IProperty> => {
    const response = await apiClient.patch<IProperty>(`/properties/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}`);
  },

  // Placeholder for photo upload - needs refinement based on frontend file handling
  uploadPhotos: async (id: string, formData: FormData) => {
    const response = await apiClient.post(`/properties/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
