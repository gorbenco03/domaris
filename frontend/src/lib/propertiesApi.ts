/**
 * RIVA - Properties API
 * Properties/Listings API client functions for Frontend
 */

import { api, ApiError } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface PropertyListing {
  id: number;
  title: string;
  description: string;
  priceEur: number;
  currency: string;
  city: string;
  neighborhood?: string;
  address?: string;
  transactionType: 'RENT' | 'SALE';
  propertyType: string;
  rooms: number;
  bathrooms?: number;
  surfaceSqm: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;
  status: PropertyStatus;
  images: PropertyImage[];
  ownerId: number;
  ownerName?: string;
  ownerAvatar?: string;
  viewCount: number;
  favoriteCount: number;
  isPromoted?: boolean;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id: number;
  url: string;
  isPrimary: boolean;
}

export type PropertyStatus = 'DRAFT' | 'ACTIVE' | 'RENTED' | 'SOLD' | 'HIDDEN';

export interface PropertySearchParams {
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

export interface CreatePropertyRequest {
  title: string;
  description: string;
  priceEur: number;
  currency?: string;
  city: string;
  neighborhood?: string;
  address?: string;
  transactionType: 'RENT' | 'SALE';
  propertyType: string;
  rooms: number;
  bathrooms?: number;
  surfaceSqm: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;
}

export interface UpdatePropertyRequest {
  title?: string;
  description?: string;
  priceEur?: number;
  city?: string;
  neighborhood?: string;
  address?: string;
  rooms?: number;
  bathrooms?: number;
  surfaceSqm?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;
}

export interface PropertyListResponse {
  data: PropertyListing[];
  total: number;
  page?: number;
  limit?: number;
}

export interface UploadPhotosResponse {
  uploaded: PropertyImage[];
  total: number;
  message: string;
}

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/**
 * Search/list properties (PUBLIC - no auth required)
 */
export async function searchProperties(
  params?: PropertySearchParams
): Promise<PropertyListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const query = queryParams.toString();
  const endpoint = `/properties${query ? `?${query}` : ''}`;
  
  const response = await api.fetch<PropertyListResponse | { items: PropertyListing[]; total: number }>(endpoint);
  
  // Handle different response formats
  if ('data' in response) {
    return response;
  }
  if ('items' in response) {
    return {
      data: response.items,
      total: response.total,
    };
  }
  return { data: [], total: 0 };
}

/**
 * Get property details (PUBLIC - no auth required)
 */
export async function getPropertyDetail(id: string | number): Promise<PropertyListing> {
  return api.fetch<PropertyListing>(`/properties/${id}`);
}

/**
 * Track property view (PUBLIC - no auth required)
 */
export async function trackPropertyView(id: string | number): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>(`/properties/${id}/view`, {
    method: 'POST',
  });
}

// ============================================================================
// AUTHENTICATED ENDPOINTS (Level 2+ required)
// ============================================================================

/**
 * Get my properties (requires Level 2+)
 */
export async function getMyProperties(): Promise<PropertyListing[]> {
  return api.fetch<PropertyListing[]>('/properties/my');
}

/**
 * Create new property (requires Level 2+)
 */
export async function createProperty(data: CreatePropertyRequest): Promise<PropertyListing> {
  return api.fetch<PropertyListing>('/properties', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update property (requires Level 2+ and ownership)
 */
export async function updateProperty(
  id: string | number,
  data: UpdatePropertyRequest
): Promise<PropertyListing> {
  return api.fetch<PropertyListing>(`/properties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete property (requires Level 2+ and ownership)
 */
export async function deleteProperty(
  id: string | number
): Promise<{ success: boolean; message: string }> {
  return api.fetch<{ success: boolean; message: string }>(`/properties/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Upload property photos (requires Level 2+ and ownership)
 * Uses multipart/form-data with FormData
 */
export async function uploadPropertyPhotos(
  propertyId: string | number,
  files: FileList | File[]
): Promise<UploadPhotosResponse> {
  const formData = new FormData();
  
  Array.from(files).forEach((file) => {
    formData.append('photos', file);
  });
  
  // Use fetch directly for FormData (don't set Content-Type, browser will set boundary)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/properties/${propertyId}/photos`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('riva_access_token') || ''}`,
      },
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw { code: 'UPLOAD_ERROR', message: error.message || 'Upload failed' } as ApiError;
  }
  
  return response.json();
}

/**
 * Delete property image
 */
export async function deletePropertyImage(
  propertyId: string | number,
  imageId: string | number
): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>(`/properties/${propertyId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

/**
 * Update property status (requires Level 2+ and ownership)
 */
export async function updatePropertyStatus(
  id: string | number,
  status: PropertyStatus
): Promise<PropertyListing> {
  return api.fetch<PropertyListing>(`/properties/${id}/toggle-active`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Get property analytics (requires Level 2+ and ownership)
 */
export async function getPropertyAnalytics(
  id: string | number,
  period: '7d' | '30d' | 'all' = '30d'
): Promise<{
  views: number;
  favorites: number;
  messages: number;
  viewings: number;
  dailyViews: Array<{ date: string; count: number }>;
}> {
  return api.fetch(`/properties/${id}/stats?period=${period}`);
}

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
  deletePropertyImage,
  updatePropertyStatus,
  getPropertyAnalytics,
};

export default propertiesApi;
