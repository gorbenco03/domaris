/**
 * RIVA - Contracts API
 * Rental Contract API client functions for Frontend
 */

import { api } from './api';
import { API_ENDPOINTS } from './endpoints';

// ============================================================================
// TYPES (aligned with rental-contract.service.ts formatContract output)
// ============================================================================

export type ContractStatus = 'proposed' | 'accepted' | 'signed' | 'cancelled';

export interface ContractParty {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface ContractListing {
  id: number;
  title?: string;
  addressText?: string;
  priceEur?: number;
  status?: string;
}

export interface RentalContract {
  id: number;
  listingId: number;
  ownerId: number;
  seekerId: number;
  status: ContractStatus;
  monthlyRent: number;
  deposit: number;
  currency: string;
  startDate: string;
  endDate: string;
  terms?: string | null;
  signedByOwnerAt: string | null;
  signedBySeekerAt: string | null;
  createdAt: string;
  updatedAt: string;
  listing: ContractListing | null;
  owner: ContractParty | null;
  seeker: ContractParty | null;
}

export interface ProposeContractData {
  monthlyRent: number;
  deposit: number;
  currency?: string;
  startDate: string;
  endDate: string;
  terms?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

export function getContractPartyName(party?: ContractParty | null): string {
  if (!party) return 'Utilizator';
  const parts = [party.firstName, party.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Utilizator';
}

export function getContractStatusLabel(status: ContractStatus): string {
  const labels: Record<ContractStatus, string> = {
    proposed: 'Propus',
    accepted: 'Acceptat',
    signed: 'Semnat',
    cancelled: 'Anulat',
  };
  return labels[status] ?? status;
}

export function getContractStatusColor(status: ContractStatus): string {
  const colors: Record<ContractStatus, string> = {
    proposed: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    accepted: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    signed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    cancelled: 'bg-muted text-muted-foreground',
  };
  return colors[status] ?? 'bg-muted text-muted-foreground';
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Owner proposes a contract after completing a viewing.
 * POST /viewings/:viewingId/propose-contract
 */
export async function proposeContract(
  viewingId: string | number,
  data: ProposeContractData,
): Promise<RentalContract> {
  return api.fetch<RentalContract>(API_ENDPOINTS.CONTRACTS.PROPOSE(viewingId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Seeker accepts a proposed contract.
 * POST /contracts/:id/accept
 */
export async function acceptContract(id: string | number): Promise<RentalContract> {
  return api.fetch<RentalContract>(API_ENDPOINTS.CONTRACTS.ACCEPT(id), {
    method: 'POST',
  });
}

/**
 * Owner or seeker signs a contract.
 * POST /contracts/:id/sign
 */
export async function signContract(id: string | number): Promise<RentalContract> {
  return api.fetch<RentalContract>(API_ENDPOINTS.CONTRACTS.SIGN(id), {
    method: 'POST',
  });
}

/**
 * Get contract details (owner or seeker).
 * GET /contracts/:id
 */
export async function getContract(id: string | number): Promise<RentalContract> {
  return api.fetch<RentalContract>(API_ENDPOINTS.CONTRACTS.DETAIL(id));
}

/**
 * Get all my contracts (as owner and as seeker).
 * GET /contracts/mine
 */
export async function getMyContracts(): Promise<RentalContract[]> {
  return api.fetch<RentalContract[]>(API_ENDPOINTS.CONTRACTS.MINE);
}

export const contractsApi = {
  proposeContract,
  acceptContract,
  signContract,
  getContract,
  getMyContracts,
};

export default contractsApi;
