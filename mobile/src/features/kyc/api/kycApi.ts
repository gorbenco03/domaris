/**
 * IMOBI - KYC API
 * Identity verification API client functions
 */

import { apiClient } from '@/core/api/client';

// Import types from shared package
export type {
  IUserKycStatus,
  IKycDocument,
} from '@domaris/types';

import type { IUserKycStatus } from '@domaris/types';

// ============================================================================
// KYC ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get KYC status
 */
export const getKycStatus = async (): Promise<IUserKycStatus> => {
  const response = await apiClient.get<IUserKycStatus>('/kyc/status');
  return response.data;
};

/**
 * Start identity verification
 */
export const startIdVerification = async (data: {
  docType: 'ID_CARD' | 'PASSPORT' | 'DRIVING_LICENSE';
  docFront: File | { uri: string; name: string; type: string };
  docBack?: File | { uri: string; name: string; type: string };
  selfie: File | { uri: string; name: string; type: string };
}): Promise<IUserKycStatus> => {
  const formData = new FormData();
  formData.append('docType', data.docType);
  formData.append('docFront', data.docFront as any);
  if (data.docBack) {
    formData.append('docBack', data.docBack as any);
  }
  formData.append('selfie', data.selfie as any);

  const response = await apiClient.post<IUserKycStatus>(
    '/kyc/verify-id',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Upload property ownership document
 */
export const uploadPropertyDocument = async (data: {
  propertyId: number;
  docType: 'PROPERTY_DEED' | 'UTILITY_BILL' | 'OTHER';
  file: File | { uri: string; name: string; type: string };
}): Promise<IUserKycStatus> => {
  const formData = new FormData();
  formData.append('propertyId', String(data.propertyId));
  formData.append('docType', data.docType);
  formData.append('file', data.file as any);

  const response = await apiClient.post<IUserKycStatus>(
    '/kyc/property-doc',
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

export const kycApi = {
  getKycStatus,
  startIdVerification,
  uploadPropertyDocument,
};

export default kycApi;
