/**
 * RIVA - Rental Contracts API
 * Client functions for the rental contract endpoints
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';
import type { RentalContract, ProposeContractPayload } from '../types';

// ============================================================================
// PROPOSE CONTRACT  POST /viewings/:id/propose-contract
// ============================================================================

export const proposeContract = async (
  viewingId: number,
  payload: ProposeContractPayload
): Promise<RentalContract> => {
  const response = await apiClient.post<RentalContract>(
    API_ENDPOINTS.CONTRACTS.PROPOSE(String(viewingId)),
    payload
  );
  return response.data;
};

// ============================================================================
// ACCEPT CONTRACT  POST /contracts/:id/accept
// ============================================================================

export const acceptContract = async (
  contractId: number
): Promise<RentalContract> => {
  const response = await apiClient.post<RentalContract>(
    API_ENDPOINTS.CONTRACTS.ACCEPT(String(contractId))
  );
  return response.data;
};

// ============================================================================
// SIGN CONTRACT  POST /contracts/:id/sign
// ============================================================================

export const signContract = async (
  contractId: number
): Promise<RentalContract> => {
  const response = await apiClient.post<RentalContract>(
    API_ENDPOINTS.CONTRACTS.SIGN(String(contractId))
  );
  return response.data;
};

// ============================================================================
// GET CONTRACT  GET /contracts/:id
// ============================================================================

export const getContract = async (
  contractId: number
): Promise<RentalContract> => {
  const response = await apiClient.get<RentalContract>(
    API_ENDPOINTS.CONTRACTS.DETAIL(String(contractId))
  );
  return response.data;
};

// ============================================================================
// GET MY CONTRACTS  GET /contracts/mine
// ============================================================================

export const getMyContracts = async (): Promise<RentalContract[]> => {
  const response = await apiClient.get<RentalContract[]>(
    API_ENDPOINTS.CONTRACTS.MINE
  );
  return response.data;
};

// ============================================================================
// EXPORT
// ============================================================================

export const contractsApi = {
  proposeContract,
  acceptContract,
  signContract,
  getContract,
  getMyContracts,
};

export default contractsApi;
