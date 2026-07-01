/**
 * RIVA - Properties API
 * Properties/Listings API client functions
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';
import type { IPropertyListItemExtended as IPropertyListItem } from '@/core/api/types';

// ============================================================================
// TYPES
// ============================================================================

export interface IPropertySearchParams {
  limit?: number;
  offset?: number;
  page?: number;
  city?: string;
  neighborhood?: string;
  transactionType?: 'sale' | 'rent';
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
  minSurface?: number;
  maxSurface?: number;
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  isAgency?: boolean;
  sortBy?: 'price' | 'createdAt' | 'postedAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ICreatePropertyRequest {
  title: string;
  description: string;
  price: number;
  currency?: string;
  city?: string;
  area?: string;
  rooms?: number;
  surface?: number;
  photos?: string[];
  isFurnished?: boolean;
}

export interface IUpdatePropertyRequest {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  city?: string;
  area?: string;
  rooms?: number;
  surface?: number;
  photos?: string[];
  isFurnished?: boolean;
}

export interface IPropertyListResponse {
  data: IPropertyListItem[];
  total: number;
  page?: number;
  limit?: number;
}

export interface IUploadPhotosResponse {
  uploaded: Array<{
    id: number;
    url: string;
    isPrimary: boolean;
  }>;
  total: number;
  message: string;
}

export type PropertyStatus = 'DRAFT' | 'ACTIVE' | 'RENTED' | 'SOLD' | 'HIDDEN';

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/**
 * Search/list properties (PUBLIC - no auth required)
 */
export const searchProperties = async (
  params?: IPropertySearchParams
): Promise<IPropertyListResponse> => {
  const response = await apiClient.get<any>(
    API_ENDPOINTS.PROPERTIES.LIST,
    { params }
  );
  const payload = response.data || {};
  if (Array.isArray(payload.data)) {
    return payload as IPropertyListResponse;
  }
  if (Array.isArray(payload.items)) {
    return {
      data: payload.items,
      total: payload.total ?? payload.items.length,
    };
  }
  return { data: [], total: 0 };
};

/**
 * Get property details (PUBLIC - no auth required)
 */
export const getPropertyDetail = async (
  id: string | number
): Promise<IPropertyListItem> => {
  const response = await apiClient.get<IPropertyListItem>(
    API_ENDPOINTS.PROPERTIES.DETAIL(String(id))
  );
  return response.data;
};

/**
 * Track property view (PUBLIC - no auth required)
 */
export const trackPropertyView = async (
  id: string | number
): Promise<{ success: boolean }> => {
  const response = await apiClient.post<{ success: boolean }>(
    API_ENDPOINTS.PROPERTIES.VIEW(String(id))
  );
  return response.data;
};

// ============================================================================
// AUTHENTICATED ENDPOINTS (Level 2+ required)
// ============================================================================

/**
 * Get my properties (requires Level 2+)
 */
export const getMyProperties = async (): Promise<IPropertyListItem[]> => {
  const response = await apiClient.get<IPropertyListItem[]>(
    API_ENDPOINTS.PROPERTIES.MY_PROPERTIES
  );
  return response.data;
};

/**
 * Create new property (requires Level 2+)
 */
export const createProperty = async (
  data: ICreatePropertyRequest
): Promise<IPropertyListItem> => {
  const response = await apiClient.post<IPropertyListItem>(
    API_ENDPOINTS.PROPERTIES.CREATE,
    data
  );
  return response.data;
};

/**
 * Update property (requires Level 2+ and ownership)
 */
export const updateProperty = async (
  id: string | number,
  data: IUpdatePropertyRequest
): Promise<IPropertyListItem> => {
  const response = await apiClient.patch<IPropertyListItem>(
    API_ENDPOINTS.PROPERTIES.UPDATE(String(id)),
    data
  );
  return response.data;
};

/**
 * Delete property (requires Level 2+ and ownership)
 */
export const deleteProperty = async (
  id: string | number
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    API_ENDPOINTS.PROPERTIES.DELETE(String(id))
  );
  return response.data;
};

/**
 * Upload property photos (requires Level 2+ and ownership)
 * Uses multipart/form-data with FormData
 *
 * @example
 * const formData = new FormData();
 * images.forEach((image) => {
 *   formData.append('photos', {
 *     uri: image.uri,
 *     type: 'image/jpeg',
 *     name: `photo_${Date.now()}.jpg`,
 *   } as any);
 * });
 * const result = await uploadPropertyPhotos(propertyId, formData);
 */
export const uploadPropertyPhotos = async (
  propertyId: string | number,
  formData: FormData
): Promise<IUploadPhotosResponse> => {
  const response = await apiClient.post<IUploadPhotosResponse>(
    API_ENDPOINTS.PROPERTIES.UPLOAD_PHOTOS(String(propertyId)),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Optional: Track upload progress
      // onUploadProgress: (progressEvent) => {
      //   const percentCompleted = Math.round(
      //     (progressEvent.loaded * 100) / progressEvent.total!
      //   );
      //   console.log(percentCompleted);
      // },
    }
  );
  return response.data;
};

/**
 * Update property status (requires Level 2+ and ownership)
 */
export const updatePropertyStatus = async (
  id: string | number,
  status: PropertyStatus
): Promise<IPropertyListItem> => {
  const response = await apiClient.patch<IPropertyListItem>(
    `${API_ENDPOINTS.PROPERTIES.UPDATE(String(id))}/status`,
    { status }
  );
  return response.data;
};

/**
 * Get property analytics (requires Level 2+ and ownership)
 */
export const getPropertyAnalytics = async (
  id: string | number,
  period: '7d' | '30d' | 'all' = '30d'
): Promise<any> => {
  const response = await apiClient.get(
    `${API_ENDPOINTS.PROPERTIES.DETAIL(String(id))}/analytics`,
    { params: { period } }
  );
  return response.data;
};

/**
 * Upload ownership proof document for a listing
 * Uses multipart/form-data with FormData
 */
export const uploadOwnershipDoc = async (
  propertyId: string | number,
  formData: FormData
): Promise<{ success: boolean; ownershipStatus: string; message: string }> => {
  const response = await apiClient.post(
    `${API_ENDPOINTS.PROPERTIES.DETAIL(String(propertyId))}/ownership-doc`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const propertiesApi = {
  // Public
  searchProperties,
  getPropertyDetail,
  trackPropertyView,

  // Authenticated
  getMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyPhotos,
  updatePropertyStatus,
  getPropertyAnalytics,
  uploadOwnershipDoc,
};

export default propertiesApi;
