/**
 * IMOBI - Shared Properties Service
 * Explicit contract for property data hooks.
 */

export {
  useProperties,
  usePropertyDetail,
  useMyProperties,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
  useUploadPropertyPhotos,
  useUpdatePropertyStatus,
  usePropertyAnalytics,
} from '@/features/properties/hooks/useProperties';

export { trackPropertyView } from '@/features/properties/api/propertiesApi';
