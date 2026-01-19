import { useState, useEffect } from 'react';
import { listingsService, type Listing } from '@/lib/api';

interface UseListingReturn {
  listing: Listing | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useListing(id: number | string): UseListingReturn {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const listingId = typeof id === 'string' ? parseInt(id, 10) : id;
      const data = await listingsService.getById(listingId);
      setListing(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching listing';
      setError(errorMessage);
      setListing(null);
      console.error('Error fetching listing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  return {
    listing,
    loading,
    error,
    refetch: fetchListing,
  };
}

