/**
 * IMOBI - Search Application Services
 * UI should consume hooks from here, not other features.
 */

export {
  useSearch,
  useSearchSuggestions,
  useSearchFacets,
  useMapData,
} from '../hooks/useSearch';

export type {
  IAdvancedSearchFilters,
  ISearchSuggestion,
  IMapDataFilters,
} from '../api/searchApi';

export { useProperties, usePropertyDetail, trackPropertyView } from '@/shared/services/propertiesService';
export {
  useFavorites,
  useFavoriteStatus,
  useToggleFavorite,
} from '@/shared/services/favoritesService';
export { startConversation } from '@/shared/services/messagingService';
