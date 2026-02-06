/**
 * RIVA - Valuation Hook
 * React Query hook for AI price recommendations (AVM)
 */

import { useQuery } from '@tanstack/react-query';
import { getValuation, type IAVMRequest, type IAVMResponse } from '@/features/ai/api/aiApi';

interface UseValuationParams {
  city?: string;
  neighborhood?: string;
  propertyType: string | null;
  transactionType: 'SALE' | 'RENT' | null;
  rooms?: number;
  surfaceSqm?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  amenities?: string[];
}

export const useValuation = (params: UseValuationParams) => {
  const canFetch = !!(
    params.city &&
    params.propertyType &&
    params.transactionType &&
    params.rooms &&
    params.surfaceSqm &&
    params.surfaceSqm > 0
  );

  return useQuery<IAVMResponse>({
    queryKey: ['avm-valuation', params],
    queryFn: () =>
      getValuation({
        city: params.city!,
        neighborhood: params.neighborhood,
        propertyType: params.propertyType!,
        transactionType: params.transactionType as 'SALE' | 'RENT',
        rooms: params.rooms!,
        surfaceSqm: params.surfaceSqm!,
        floor: params.floor,
        totalFloors: params.totalFloors,
        yearBuilt: params.yearBuilt,
        amenities: params.amenities,
      }),
    enabled: canFetch,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
};
