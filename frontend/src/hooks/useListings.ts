import { useState, useEffect } from 'react';
import { listingsService, type Listing, type ListingsResponse, type ListingsFilters } from '@/lib/api';

interface UseListingsReturn {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  pagination: ListingsResponse['pagination'] | null;
  refetch: () => Promise<void>;
}

export function useListings(filters?: ListingsFilters): UseListingsReturn {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ListingsResponse['pagination'] | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await listingsService.getAll(filters);
      setListings(data.listings);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching listings';
      setError(errorMessage);
      setListings([]);
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [
    filters?.city,
    filters?.neighborhood,
    filters?.minPrice,
    filters?.maxPrice,
    filters?.minRooms,
    filters?.maxRooms,
    filters?.minSurface,
    filters?.maxSurface,
    filters?.isFurnished,
    filters?.hasCentralHeating,
    filters?.isAgency,
    filters?.status,
    filters?.limit,
    filters?.offset,
    filters?.sortBy,
    filters?.sortOrder,
  ]);

  return {
    listings,
    loading,
    error,
    pagination,
    refetch: fetchListings,
  };
}

