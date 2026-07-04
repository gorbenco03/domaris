/**
 * RIVA - Rental Contract Hooks
 * React Query hooks for rental contracts
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '../api/contractsApi';
import type { ProposeContractPayload } from '../types';

const QUERY_KEY = 'contracts';

// ============================================================================
// GET MY CONTRACTS
// ============================================================================

export const useMyContracts = () => {
  return useQuery({
    queryKey: [QUERY_KEY, 'mine'],
    queryFn: contractsApi.getMyContracts,
  });
};

// ============================================================================
// GET SINGLE CONTRACT
// ============================================================================

export const useContract = (contractId: number | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEY, contractId],
    queryFn: () => contractsApi.getContract(contractId!),
    enabled: !!contractId,
  });
};

// ============================================================================
// PROPOSE CONTRACT
// ============================================================================

export const useProposeContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      viewingId,
      payload,
    }: {
      viewingId: number;
      payload: ProposeContractPayload;
    }) => contractsApi.proposeContract(viewingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

// ============================================================================
// ACCEPT CONTRACT
// ============================================================================

export const useAcceptContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractId: number) => contractsApi.acceptContract(contractId),
    onSuccess: (_, contractId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, contractId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'mine'] });
    },
  });
};

// ============================================================================
// SIGN CONTRACT
// ============================================================================

export const useSignContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractId: number) => contractsApi.signContract(contractId),
    onSuccess: (_, contractId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, contractId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'mine'] });
    },
  });
};
