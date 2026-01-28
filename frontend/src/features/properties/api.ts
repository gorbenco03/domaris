
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
    // Backend search might be /listings or /listings/search
    // ListingController findAll is @Get().
    const response = await apiClient.get<IPropertySearchResult>('/listings', { params });
    return response.data;
  },

  getDetail: async (id: string): Promise<IProperty> => {
    const response = await apiClient.get<IProperty>(`/listings/${id}`);
    return response.data;
  },

  // Authenticated
  getMyProperties: async (): Promise<IPropertyListItem[]> => {
    const response = await apiClient.get<IPropertyListItem[]>('/listings/my');
    return response.data;
  },

  create: async (data: ICreatePropertyDto): Promise<IProperty> => {
    const response = await apiClient.post<IProperty>('/listings', data);
    return response.data;
  },

  update: async (id: string, data: IUpdatePropertyDto): Promise<IProperty> => {
    const response = await apiClient.put<IProperty>(`/listings/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/listings/${id}`);
  },

  uploadPhotos: async (id: string, formData: FormData) => {
    const response = await apiClient.post(`/listings/${id}/photos`, formData);
    return response.data;
  }
};
