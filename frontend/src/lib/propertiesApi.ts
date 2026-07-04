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
  // Canonical flat fields (backend = source of truth)
  priceEur: number;
  currency: string;
  city: string;
  neighborhood?: string;
  address?: string;
  addressText?: string;
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
  listingStatus?: string;
  publicFrom?: string;
  // Canonical: backend always emits an images array (may be empty).
  images?: PropertyImage[];
  // Owner: nested object, emitted on the detail endpoint only.
  ownerId: number;
  owner?: {
    id: number | string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    verificationLevel?: number;
    phone?: string;
    isVerified?: boolean;
  };
  viewsCount?: number;
  leadsCount?: number;
  isPromoted?: boolean;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id: number;
  url: string;
  // Canonical: backend emits `isPrimary` + `order`.
  isPrimary?: boolean;
  order?: number;
}

// ============================================================================
// HELPER FUNCTIONS — derive canonical fields from the API response
// ============================================================================

/** Property price (backend emits the flat `priceEur`). */
export function getPropertyPrice(p: PropertyListing): number {
  return p.priceEur ?? 0;
}

/** Property surface area (backend emits the flat `surfaceSqm`). */
export function getPropertySurface(p: PropertyListing): number {
  return p.surfaceSqm ?? 0;
}

/** Main image URL — derived from the canonical `images` array (primary first). */
export function getPropertyMainImage(p: PropertyListing): string {
  if (p.images && p.images.length > 0) {
    const primary = p.images.find(img => img.isPrimary);
    return primary?.url || p.images[0]?.url || '';
  }
  return '';
}

/** Owner display name (nested `owner`, present on the detail endpoint). */
export function getPropertyOwnerName(p: PropertyListing): string {
  if (p.owner) {
    const parts = [p.owner.firstName, p.owner.lastName].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  }
  return 'Proprietar';
}

/** Owner avatar (nested `owner`, present on the detail endpoint). */
export function getPropertyOwnerAvatar(p: PropertyListing): string | null {
  return p.owner?.avatar || null;
}

/** Neighborhood + city display. */
export function getPropertyLocation(p: PropertyListing): string {
  const parts = [p.neighborhood, p.city].filter(Boolean);
  return parts.join(', ');
}

// Backend listing.service.ts validStatuses = ['new','early_access','public','rented','hidden','expired'].
// Live listings (monetization OFF) are emitted with status='public'.
export type PropertyStatus = 'new' | 'early_access' | 'public' | 'rented' | 'hidden' | 'expired';

export interface PropertySearchParams {
  limit?: number;
  offset?: number;
  page?: number;
  city?: string;
  neighborhood?: string;
  // Backend matches this against stored listings verbatim ('SALE'/'RENT' uppercase).
  transactionType?: 'SALE' | 'RENT';
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSurface?: number;
  maxSurface?: number;
  minFloor?: number;
  maxFloor?: number;
  minYear?: number;
  maxYear?: number;
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;
  hasElevator?: boolean;
  hasAC?: boolean;
  hasStorage?: boolean;
  hasGarden?: boolean;
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
  /** Câmpuri booleene păstrate în DTO-ul backend (CreateListingDto). */
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  petFriendly?: boolean;
  /** ID-urile facilităților selectate (din AMENITIES @domaris/types). */
  amenities?: string[];
  lat?: number | null;
  lng?: number | null;
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
  /** Câmpuri booleene păstrate în DTO-ul backend (UpdateListingDto). */
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  petFriendly?: boolean;
  /** @deprecated Folosește `amenities` cu ID-ul 'BALCONY'. Menținut pentru compatibilitate. */
  hasBalcony?: boolean;
  /** @deprecated Folosește `amenities` cu ID-ul corespunzător. Menținut pentru compatibilitate. */
  hasParking?: boolean;
  /** ID-urile facilităților selectate (din AMENITIES @domaris/types). */
  amenities?: string[];
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
  // Map frontend field names to backend DTO field names:
  //   - address     -> addressText
  //   - priceEur    -> price
  //   - surfaceSqm  -> surface
  //   - neighborhood-> area
  //   - amenities   -> amenities (string[] cu ID-uri din AMENITIES @domaris/types)
  const {
    priceEur, surfaceSqm, neighborhood, lat, lng, currency,
    address, amenities,
    ...rest
  } = data as CreatePropertyRequest & { address?: string };

  const payload: Record<string, unknown> = {
    ...rest,
    price: priceEur,
    surface: surfaceSqm,
    area: neighborhood,
    // Default currency to EUR for Moldova market
    currency: currency ?? 'EUR',
  };
  if (address) payload.addressText = address;
  if (amenities && amenities.length > 0) payload.amenities = amenities;
  // Include coordinates if provided by the wizard's map picker
  if (lat != null) payload.lat = lat;
  if (lng != null) payload.lng = lng;
  return api.fetch<PropertyListing>('/properties', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update property (requires Level 2+ and ownership)
 */
export async function updateProperty(
  id: string | number,
  data: UpdatePropertyRequest
): Promise<PropertyListing> {
  // Map frontend field names to backend DTO field names (la fel ca la create)
  const {
    priceEur, surfaceSqm, neighborhood,
    address, amenities,
    // @deprecated — ignorăm câmpurile vechi la nivel de payload (nu sunt în DTO backend)
    hasParking, hasBalcony, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...rest
  } = data as UpdatePropertyRequest & { address?: string };
  const payload: Record<string, unknown> = { ...rest };
  if (priceEur !== undefined) payload.price = priceEur;
  if (surfaceSqm !== undefined) payload.surface = surfaceSqm;
  if (neighborhood !== undefined) payload.area = neighborhood;
  if (address !== undefined) payload.addressText = address;
  // Combinăm amenities cu câmpurile @deprecated (bridge pentru edit-property)
  const amenitiesList = [...(amenities ?? [])];
  if (hasParking && !amenitiesList.includes('UNDERGROUND_PARKING')) amenitiesList.push('UNDERGROUND_PARKING');
  if (hasBalcony && !amenitiesList.includes('BALCONY')) amenitiesList.push('BALCONY');
  if (amenitiesList.length > 0) payload.amenities = amenitiesList;
  return api.fetch<PropertyListing>(`/properties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
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
  // Backend route is PATCH /properties/:id/status
  return api.fetch<PropertyListing>(`/properties/${id}/status`, {
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
  // Backend route is /properties/:id/analytics and returns snake_case fields
  // (views_total, favorites_total, contacts, viewingsRequested). Remap to the UI shape.
  const res = await api.fetch<{
    views_total?: number;
    views_unique?: number;
    favorites_total?: number;
    contacts?: number;
    viewingsRequested?: number;
    dailyViews?: Array<{ date: string; count: number }>;
  }>(`/properties/${id}/analytics?period=${period}`);

  return {
    views: res.views_total ?? 0,
    favorites: res.favorites_total ?? 0,
    messages: res.contacts ?? 0,
    viewings: res.viewingsRequested ?? 0,
    dailyViews: res.dailyViews ?? [],
  };
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
