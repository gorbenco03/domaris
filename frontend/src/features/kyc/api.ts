import { apiClient } from '@/lib/client';

// KYC Status response
export interface IKycStatus {
  verificationLevel: number;
  identityStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  propertyStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

// Document types
export type IdentityDocType = 'ID_CARD' | 'PASSPORT' | 'DRIVING_LICENSE';
export type PropertyDocType = 'PROPERTY_DEED' | 'UTILITY_BILL' | 'OTHER';

export const kycApi = {
  // Get current KYC status
  getStatus: async (): Promise<IKycStatus> => {
    const response = await apiClient.get<IKycStatus>('/kyc/status');
    return response.data;
  },

  // Submit identity verification (Level 2)
  verifyIdentity: async (
    docType: IdentityDocType,
    docFront: File,
    selfie: File,
    docBack?: File
  ): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    formData.append('docType', docType);
    formData.append('docFront', docFront);
    formData.append('selfie', selfie);
    if (docBack) {
      formData.append('docBack', docBack);
    }

    const response = await apiClient.post('/kyc/verify-id', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Submit property document (Level 3)
  uploadPropertyDoc: async (
    docType: PropertyDocType,
    file: File,
    propertyId?: number
  ): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    formData.append('docType', docType);
    formData.append('file', file);
    if (propertyId) {
      formData.append('propertyId', propertyId.toString());
    }

    const response = await apiClient.post('/kyc/property-doc', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
