/**
 * RIVA - Map Properties Hook
 * React Query hook for fetching properties in map bounds
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/core/api/client';
import { QUERY_KEYS } from '@/config/constants';

interface MapSearchParams {
  neLat: number;
  neLng: number;
  swLat: number;
  swLng: number;
  transactionType?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
}

export interface MapProperty {
  id: number;
  title: string;
  priceEur: number;
  currency: string;
  surfaceSqm: number;
  rooms: number;
  lat: number;
  lng: number;
  city: string;
  neighborhood: string;
  transactionType: string;
  propertyType: string;
  status?: string;
  publicFrom?: string;
  images?: Array<{ id: number; url: string; isPrimary: boolean }>;
}

type RawMapProperty = Omit<MapProperty, 'lat' | 'lng'> & {
  lat: number | string;
  lng: number | string;
};

const fetchMapProperties = async (params: MapSearchParams): Promise<MapProperty[]> => {
  const response = await apiClient.get<RawMapProperty[]>('/properties/map-search', {
    params: {
      neLat: params.neLat,
      neLng: params.neLng,
      swLat: params.swLat,
      swLng: params.swLng,
      transactionType: params.transactionType,
      propertyType: params.propertyType,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      minRooms: params.minRooms,
      maxRooms: params.maxRooms,
      limit: 100,
    },
  });

  return response.data
    .map((property) => ({
      ...property,
      lat: Number(property.lat),
      lng: Number(property.lng),
    }))
    .filter((property) => Number.isFinite(property.lat) && Number.isFinite(property.lng));
};

export const useMapProperties = (params: MapSearchParams | null) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, 'map', params],
    queryFn: () => fetchMapProperties(params!),
    enabled: !!params, // Only fetch when params are provided
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
