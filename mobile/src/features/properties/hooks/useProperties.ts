/**
 * RIVA - Properties Hooks
 * React Query hooks for properties
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import {
  propertiesApi,
  type IPropertySearchParams,
  type ICreatePropertyRequest,
  type IUpdatePropertyRequest,
  type PropertyStatus,
} from '../api/propertiesApi';

/**
 * Search/list properties (PUBLIC)
 */
export const useProperties = (params?: IPropertySearchParams) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, params],
    queryFn: () => propertiesApi.searchProperties(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get property by ID (PUBLIC)
 */
export const usePropertyDetail = (id: string | number | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROPERTY_DETAIL, id],
    queryFn: () => propertiesApi.getPropertyDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get my properties (Level 3+ required)
 */
export const useMyProperties = (enabled: boolean = true) => {
  return useQuery({
    queryKey: [QUERY_KEYS.MY_PROPERTIES],
    queryFn: propertiesApi.getMyProperties,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create property mutation (Level 2+ required)
 */
export const useCreateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreatePropertyRequest) =>
      propertiesApi.createProperty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_PROPERTIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] });
    },
  });
};

/**
 * Update property mutation (Level 2+ required)
 */
export const useUpdateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: IUpdatePropertyRequest;
    }) => propertiesApi.updateProperty(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROPERTY_DETAIL, variables.id],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_PROPERTIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] });
    },
  });
};

/**
 * Delete property mutation (Level 2+ required)
 */
export const useDeleteProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => propertiesApi.deleteProperty(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROPERTY_DETAIL, id],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_PROPERTIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] });
    },
  });
};

/**
 * Upload property photos mutation (Level 2+ required)
 */
export const useUploadPropertyPhotos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      formData,
    }: {
      propertyId: string | number;
      formData: FormData;
    }) => propertiesApi.uploadPropertyPhotos(propertyId, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROPERTY_DETAIL, variables.propertyId],
      });
    },
  });
};

/**
 * Update property status mutation (Level 2+ required)
 */
export const useUpdatePropertyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: PropertyStatus }) =>
      propertiesApi.updatePropertyStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROPERTY_DETAIL, variables.id],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_PROPERTIES] });
    },
  });
};

/**
 * Get property analytics (Level 2+ required)
 */
export const usePropertyAnalytics = (
  id: string | number | undefined,
  period: '7d' | '30d' | 'all' = '30d'
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, 'analytics', id, period],
    queryFn: () => propertiesApi.getPropertyAnalytics(id!, period),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
