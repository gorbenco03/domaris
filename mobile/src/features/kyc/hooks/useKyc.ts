/**
 * IMOBI - KYC Hooks
 * React Query hooks for identity verification
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { kycApi } from '../api/kycApi';
import { useAuth } from '@/app/providers/AuthProvider';

/**
 * Get KYC status
 */
export const useKycStatus = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.USER_PROFILE, 'kyc-status'],
    queryFn: kycApi.getKycStatus,
    enabled: !!user?.id,
  });
};

/**
 * Start ID verification mutation
 */
export const useStartIdVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      docType: 'ID_CARD' | 'PASSPORT' | 'DRIVING_LICENSE';
      docFront: { uri: string; name: string; type: string };
      docBack?: { uri: string; name: string; type: string };
      selfie: { uri: string; name: string; type: string };
    }) => kycApi.startIdVerification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.USER_PROFILE, 'kyc-status'],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
    },
  });
};

/**
 * Upload property document mutation
 */
export const useUploadPropertyDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      propertyId: number;
      docType: 'PROPERTY_DEED' | 'UTILITY_BILL' | 'OTHER';
      file: { uri: string; name: string; type: string };
    }) => kycApi.uploadPropertyDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.USER_PROFILE, 'kyc-status'],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
    },
  });
};
