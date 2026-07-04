/**
 * RIVA - Rental Contract Types
 */

// ============================================
// CONTRACT STATUS
// ============================================

export type ContractStatus =
  | 'proposed'   // Propus de proprietar
  | 'accepted'   // Acceptat de chiriaș
  | 'signed'     // Semnat de ambele părți
  | 'rejected'   // Respins
  | 'cancelled'; // Anulat

// ============================================
// RENTAL CONTRACT
// ============================================

export interface RentalContract {
  id: number;
  viewingId: number;
  listingId: number;
  ownerId: number;
  seekerId: number;

  // Termeni financiari
  monthlyRent: number;
  deposit: number;
  currency: string;

  // Perioadă
  startDate: string;  // ISO date
  endDate: string;    // ISO date

  // Clauze suplimentare
  terms?: string;

  // Status
  status: ContractStatus;

  // Semnături
  signedByOwnerAt?: string;
  signedBySeekerAt?: string;

  // Rolul utilizatorului curent
  isOwner?: boolean;

  // Info proprietar / chiriaș (denormalizat)
  owner?: {
    id: number;
    name: string;
    avatar?: string;
  };
  seeker?: {
    id: number;
    name: string;
    avatar?: string;
  };

  // Info proprietate (denormalizat)
  listing?: {
    id: number;
    title: string;
    address?: string;
    imageUrl?: string;
  };

  createdAt: string;
  updatedAt: string;
}

// ============================================
// DTO
// ============================================

export interface ProposeContractPayload {
  monthlyRent: number;
  deposit: number;
  currency?: string;
  startDate: string;
  endDate: string;
  terms?: string;
}

// ============================================
// STATUS HELPERS
// ============================================

export const CONTRACT_STATUS_INFO: Record<
  ContractStatus,
  { label: string; color: string }
> = {
  proposed: { label: 'Propus', color: '#f59e0b' },
  accepted: { label: 'Acceptat', color: '#6366f1' },
  signed:   { label: 'Semnat',   color: '#10b981' },
  rejected: { label: 'Respins',  color: '#ef4444' },
  cancelled:{ label: 'Anulat',   color: '#94a3b8' },
};
