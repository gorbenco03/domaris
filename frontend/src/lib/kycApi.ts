/**
 * RIVA - KYC / Identity Verification API
 *
 * Client for the backend KYC contract (kyc.controller.ts):
 *   POST /kyc/verify-id     multipart { docType, docFront, docBack?, selfie }
 *   GET  /kyc/status        -> KycStatus
 *   POST /kyc/property-doc  multipart { docType, propertyId?, file }
 *
 * Multipart requests use fetch directly with an Authorization header and let the
 * browser set the multipart boundary (same pattern as userApi.uploadAvatar /
 * propertiesApi.uploadPropertyPhotos). JSON/GET requests go through the shared client.
 */

import { api, ApiError } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ============================================================================
// TYPES
// ============================================================================

export type IdDocType = 'ID_CARD' | 'PASSPORT' | 'DRIVING_LICENSE';
export type PropertyDocType = 'PROPERTY_DEED' | 'UTILITY_BILL' | 'OTHER';

export interface KycPermissions {
  canBrowse: boolean;
  canSearch: boolean;
  canAddFavorites: boolean;
  canContact: boolean;
  canRequestViewing: boolean;
  canPostListing: boolean;
  canBoostListing: boolean;
}

/** Shape returned by GET /kyc/status (kyc.service.ts getStatus). */
export interface KycStatus {
  verificationLevel: number;
  permissions: KycPermissions;
  nextSteps?: unknown;
  // buildStatusResponse spreads additional fields (e.g. pending verification info);
  // kept open so we don't drop server-emitted data.
  [key: string]: unknown;
}

export interface VerifyIdInput {
  docType: IdDocType;
  docFront: File;
  docBack?: File;
  selfie: File;
}

export interface SubmitPropertyDocInput {
  docType: PropertyDocType;
  file: File;
  propertyId?: number;
}

// ============================================================================
// HELPERS
// ============================================================================

async function postMultipart<T>(endpoint: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      // Do NOT set Content-Type — the browser adds the multipart boundary.
      Authorization: `Bearer ${localStorage.getItem('riva_access_token') || ''}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Verification failed' }));
    throw { code: 'KYC_ERROR', message: error.message || 'Verification failed' } as ApiError;
  }

  return response.json();
}

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * Start identity verification (level 2).
 * Fields: docType (text) + docFront/docBack/selfie (files). docBack is optional.
 */
export async function verifyId(input: VerifyIdInput): Promise<KycStatus> {
  const formData = new FormData();
  formData.append('docType', input.docType);
  formData.append('docFront', input.docFront);
  if (input.docBack) formData.append('docBack', input.docBack);
  formData.append('selfie', input.selfie);
  return postMultipart<KycStatus>('/kyc/verify-id', formData);
}

/**
 * Get current KYC status (verification level, permissions, next steps).
 */
export async function getStatus(): Promise<KycStatus> {
  return api.fetch<KycStatus>('/kyc/status');
}

/**
 * Upload property ownership document (level 3).
 * Fields: docType (text), file, optional propertyId.
 */
export async function submitPropertyDoc(input: SubmitPropertyDocInput): Promise<KycStatus> {
  const formData = new FormData();
  formData.append('docType', input.docType);
  formData.append('file', input.file);
  if (input.propertyId != null) formData.append('propertyId', String(input.propertyId));
  return postMultipart<KycStatus>('/kyc/property-doc', formData);
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const kycApi = {
  verifyId,
  getStatus,
  submitPropertyDoc,
};

export default kycApi;
