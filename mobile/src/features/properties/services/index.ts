/**
 * RIVA - Properties Application Services
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
} from '../hooks/useProperties';

export type {
  ICreatePropertyRequest,
  IUpdatePropertyRequest,
  IPropertySearchParams,
  PropertyStatus,
} from '../api/propertiesApi';
