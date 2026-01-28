/**
 * IMOBI - Search Results Screen
 * Property search results with filters
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Map,
  List,
  ArrowUpDown,
  X,
  Home,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { SearchBar } from '@/features/search/components/SearchBar';
import { FilterChips } from '@/features/search/components/FilterChips';
import { PropertyCard, IconButton } from '@/shared/components';
import { useSearch, useSearchSuggestions, useFavorites, useToggleFavorite } from '@/features/search/services';
import { useRequireAuth } from '@/shared/hooks';
import { SearchStackParamList } from '@/app/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { IPropertyListItem } from '@/core/api/types';
import type { IAdvancedSearchFilters, ISearchSuggestion } from '@/features/search/services';
import { PAGINATION } from '@/config/constants';

type NavigationProp = NativeStackNavigationProp<SearchStackParamList>;

// ============================================
// MOCK DATA
// ============================================

// MOCK DATA REMOVED

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'date_newest';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevanță' },
  { value: 'date_newest', label: 'Cele mai noi' },
  { value: 'price_asc', label: 'Preț crescător' },
  { value: 'price_desc', label: 'Preț descrescător' },
];

// ============================================
// COMPONENT
// ============================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SearchResultsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();

  // Extract initial filters from route params
  const initialFilters = route.params?.filters || {};
  const sortButtonRef = useRef<View>(null);
  const [sortMenuPosition, setSortMenuPosition] = useState<{ top: number; left: number } | null>(
    null
  );

  const normalizeFilters = useCallback((raw: any): IAdvancedSearchFilters => {
    const toNumber = (value: unknown) => {
      if (value === undefined || value === null || value === '') return undefined;
      const numeric = Number(value);
      return Number.isNaN(numeric) ? undefined : numeric;
    };

    return {
      query: raw.query || undefined,
      city: raw.city || undefined,
      neighborhood: raw.neighborhood || undefined,
      transactionType: raw.transactionType || undefined,
      propertyType: raw.propertyType || undefined,
      priceMin: toNumber(raw.priceMin ?? raw.minPrice ?? raw.priceRange?.min),
      priceMax: toNumber(raw.priceMax ?? raw.maxPrice ?? raw.priceRange?.max),
      rooms: toNumber(raw.rooms),
      roomsMin: toNumber(raw.roomsMin ?? raw.minRooms ?? raw.rooms?.min),
      roomsMax: toNumber(raw.roomsMax ?? raw.maxRooms ?? raw.rooms?.max),
      bedroomsMin: toNumber(raw.bedroomsMin ?? raw.bedrooms?.min),
      bedroomsMax: toNumber(raw.bedroomsMax ?? raw.bedrooms?.max),
      bathroomsMin: toNumber(raw.bathroomsMin ?? raw.bathrooms?.min),
      bathroomsMax: toNumber(raw.bathroomsMax ?? raw.bathrooms?.max),
      floorMin: toNumber(raw.floorMin ?? raw.floor?.min),
      floorMax: toNumber(raw.floorMax ?? raw.floor?.max),
      yearBuiltMin: toNumber(raw.yearBuiltMin ?? raw.yearBuilt?.min),
      yearBuiltMax: toNumber(raw.yearBuiltMax ?? raw.yearBuilt?.max),
      surfaceMin: toNumber(raw.surfaceMin ?? raw.area?.min ?? raw.surface?.min),
      surfaceMax: toNumber(raw.surfaceMax ?? raw.area?.max ?? raw.surface?.max),
      isFurnished: raw.isFurnished ?? undefined,
      hasCentralHeating: raw.hasCentralHeating ?? undefined,
      petFriendly: raw.petFriendly ?? undefined,
      amenities: raw.amenities ?? undefined,
      excludeAgencies: raw.excludeAgencies ?? undefined,
      rentType: raw.rentType ?? undefined,
      page: raw.page ? Number(raw.page) : undefined,
      limit: raw.limit ? Number(raw.limit) : undefined,
    };
  }, []);

  const [filters, setFilters] = useState<IAdvancedSearchFilters>(() =>
    normalizeFilters(initialFilters)
  );
  const [searchText, setSearchText] = useState(
    initialFilters.query || initialFilters.city || initialFilters.neighborhood || ''
  );
  // const [viewMode, setViewMode] = useState<'list' | 'map'>('list'); // Removed viewMode state
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { isAuthenticated, requireAuth } = useRequireAuth();

  const { data: favoritesData } = useFavorites({
    page: 1,
    limit: PAGINATION.MAX_PAGE_SIZE,
  }, { enabled: isAuthenticated });
  const toggleFavoriteMutation = useToggleFavorite();
  const favoriteIds = useMemo(
    () => new Set((favoritesData?.data || []).map((favorite) => String(favorite.propertyId))),
    [favoritesData?.data]
  );

  useEffect(() => {
    if (!route.params?.filters) return;
    const nextFilters = normalizeFilters(route.params.filters);
    setFilters((prev) => ({ ...prev, ...nextFilters }));
    const nextText = nextFilters.query || nextFilters.city || nextFilters.neighborhood || '';
    if (nextText) {
      setSearchText(nextText);
    }
  }, [route.params?.filters, normalizeFilters]);

  useEffect(() => {
    if (searchText.trim().length === 0 && (filters.query || filters.city || filters.neighborhood)) {
      setFilters((prev) => ({
        ...prev,
        query: undefined,
        city: undefined,
        neighborhood: undefined,
        page: 1,
      }));
    }
  }, [searchText, filters.query, filters.city, filters.neighborhood]);

  const { data: suggestionsData } = useSearchSuggestions(searchText.trim());
  const suggestions = useMemo(() => {
    return (suggestionsData || []).map((suggestion: ISearchSuggestion, index: number) => ({
      id: `${suggestion.type}-${suggestion.text}-${index}`,
      text: suggestion.text,
      type: suggestion.type === 'city' || suggestion.type === 'neighborhood' ? 'location' : 'popular',
      subtitle:
        suggestion.type === 'city'
          ? 'Oraș'
          : suggestion.type === 'neighborhood'
          ? 'Cartier'
          : undefined,
    }));
  }, [suggestionsData]);

  // Real data fetching
  const { 
    data: searchResponse, 
    isLoading, 
    refetch,
  } = useSearch({
    ...filters,
    sortBy: sortBy === 'date_newest' ? 'date_desc' : sortBy as any,
  });

  const results = searchResponse?.data || [];
  const totalCount = searchResponse?.meta?.total ?? (searchResponse as any)?.total ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('PropertyDetail', { propertyId });
  };

  const handleToggleFavorite = async (propertyId: number, currentlyFavorite: boolean) => {
    if (!requireAuth({ message: 'Autentifică-te pentru a salva favorite.' })) {
      return;
    }
    try {
      await toggleFavoriteMutation.mutateAsync({ propertyId, currentlyFavorite });
    } catch (error) {
      console.warn('Failed to toggle favorite', error);
    }
  };

  const handleApplyFilters = useCallback(
    (nextFilters: IAdvancedSearchFilters) => {
      const normalized = normalizeFilters(nextFilters);
      setFilters((prev) => ({ ...prev, ...normalized, page: 1 }));
    },
    [normalizeFilters]
  );

  const handleFilterPress = (_filterType: string) => {
    // Open full filters modal for now
    setShowSortModal(false);
    (navigation.navigate as any)('SearchFilters', { filters });
  };

  const handleFiltersPress = () => {
    // Open full filters modal passing current filters
    setShowSortModal(false);
    (navigation.navigate as any)('SearchFilters', { filters });
  };

  const getActiveFiltersCount = () => {
    const keys: Array<keyof IAdvancedSearchFilters> = [
      'transactionType',
      'propertyType',
      'priceMin',
      'priceMax',
      'rooms',
      'roomsMin',
      'roomsMax',
      'bedroomsMin',
      'bedroomsMax',
      'bathroomsMin',
      'bathroomsMax',
      'floorMin',
      'floorMax',
      'yearBuiltMin',
      'yearBuiltMax',
      'surfaceMin',
      'surfaceMax',
      'isFurnished',
      'hasCentralHeating',
      'petFriendly',
      'amenities',
      'excludeAgencies',
      'rentType',
    ];

    return keys.reduce((count, key) => {
      const value = filters[key];
      if (value === undefined || value === null || value === '') return count;
      if (value === false) return count;
      if (Array.isArray(value) && value.length === 0) return count;
      return count + 1;
    }, 0);
  };

  const getCurrentSortLabel = () => {
    return SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Sortare';
  };

  const handleSearchSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setFilters((prev) => ({
        ...prev,
        query: undefined,
        city: undefined,
        neighborhood: undefined,
        page: 1,
      }));
      return;
    }

    setFilters((prev) => ({
      ...prev,
      query: trimmed,
      city: undefined,
      neighborhood: undefined,
      page: 1,
    }));
  };

  const handleSuggestionSelect = (suggestion: { text: string; type: string }) => {
    setSearchText(suggestion.text);
    if (suggestion.type === 'location') {
      const [neighborhood, city] = suggestion.text.split(',').map((part) => part.trim());
      setFilters((prev) => ({
        ...prev,
        city: city || suggestion.text,
        neighborhood: city ? neighborhood : undefined,
        query: undefined,
        page: 1,
      }));
      return;
    }

    setFilters((prev) => ({
      ...prev,
      query: suggestion.text,
      city: undefined,
      neighborhood: undefined,
      page: 1,
    }));
  };

  const openSortMenu = () => {
    sortButtonRef.current?.measureInWindow((x, y, width, height) => {
      const menuWidth = 190;
      const left = Math.min(x, SCREEN_WIDTH - menuWidth - 16);
      setSortMenuPosition({ top: y + height + 8, left });
      setShowSortModal(true);
    });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar Row */}
      <View style={styles.searchRow}>
        {navigation.canGoBack() && (
          <IconButton
            icon={<ArrowLeft size={22} color={theme.colors.textPrimary} />}
            onPress={() => navigation.goBack()}
            variant="surface"
            size="md"
            style={[styles.backButton, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]}
          />
        )}
        <View style={styles.searchBarContainer}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            onSubmit={handleSearchSubmit}
            onSuggestionSelect={handleSuggestionSelect}
            suggestions={suggestions}
            showSuggestions={searchText.trim().length >= 2}
            placeholder="Caută..."
          />
        </View>
      </View>

      {/* Filters */}
      <FilterChips
        filters={filters}
        onFilterPress={handleFilterPress}
        onFiltersPress={handleFiltersPress}
        activeFiltersCount={getActiveFiltersCount()}
      />

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: theme.colors.textSecondary }]}>
          {totalCount} rezultate
        </Text>
        <View style={styles.resultsActions}>
          {/* Sort Button */}
          <View ref={sortButtonRef}>
            <TouchableOpacity
              style={[styles.sortButton, { backgroundColor: theme.colors.surface }]}
              onPress={openSortMenu}
              activeOpacity={0.8}
            >
              <ArrowUpDown size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.sortButtonText, { color: theme.colors.textSecondary }]}>
                {getCurrentSortLabel()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* View Mode Toggle */}
          <View style={[styles.viewToggle, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                { backgroundColor: theme.colors.primary.main }, // Always active here
              ]}
              onPress={() => {}} // Already on list
              activeOpacity={1}
            >
              <List size={18} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                // Inactive style
              ]}
              onPress={() => (navigation.navigate as any)('MapSearch')}
            >
              <Map size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </View>
  );

  const renderProperty = ({ item }: { item: IPropertyListItem }) => {
    // Map API item to PropertyCard props
    const anyItem = item as any;
    const mappedProps = {
      ...anyItem,
      id: String(anyItem.id),
      location: anyItem.neighborhood ? `${anyItem.neighborhood}, ${anyItem.city}` : anyItem.city,
      characteristics: [
        anyItem.rooms ? `${anyItem.rooms} camere` : '',
        anyItem.surfaceSqm ? `${anyItem.surfaceSqm} mp` : '',
      ].filter(Boolean),
      image: anyItem.images?.[0]?.url || 'https://via.placeholder.com/300',
      price: anyItem.priceEur || 0,
      currency: (anyItem.currency === 'RON' ? 'RON' : 'EUR') as 'EUR' | 'RON',
    };

    return (
      <View style={styles.propertyCard}>
        <PropertyCard
          {...mappedProps}
          onPress={() => handlePropertyPress(String(item.id))}
          isFavorite={favoriteIds.has(String(item.id))}
          onFavoritePress={() =>
            handleToggleFavorite(
              Number(item.id),
              favoriteIds.has(String(item.id))
            )
          }
        />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.divider }]}>
        <Home size={32} color={theme.colors.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
        Nicio proprietate găsită
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Încearcă să modifici filtrele sau să cauți într-o altă zonă
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.colors.primary.main }]}
        onPress={() => {
          setFilters({});
          setSearchText('');
        }}
      >
        <X size={18} color="#ffffff" />
        <Text style={styles.emptyButtonText}>Resetează filtrele</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    return null;
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <FlatList
        data={results}
        renderItem={renderProperty}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setShowSortModal(false)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
        onEndReached={() => {
          // Load more (to be implemented with infinite query)
        }}
        onEndReachedThreshold={0.5}
      />
      {isLoading && results.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      )}
      {showSortModal && sortMenuPosition && (
        <Modal transparent animationType="fade" visible={showSortModal}>
          <View style={styles.sortOverlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowSortModal(false)} />
            <View
              style={[
                styles.sortDropdown,
                {
                  top: sortMenuPosition.top,
                  left: sortMenuPosition.left,
                  backgroundColor: theme.colors.surface,
                  ...theme.shadows.lg,
                },
              ]}
            >
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    sortBy === option.value && { backgroundColor: `${theme.colors.primary.main}10` },
                  ]}
                  onPress={() => {
                    setSortBy(option.value);
                    setShowSortModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      {
                        color:
                          sortBy === option.value
                            ? theme.colors.primary.main
                            : theme.colors.textPrimary,
                        fontFamily: sortBy === option.value ? 'Inter-SemiBold' : 'Inter-Regular',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  headerContainer: {
    position: 'relative',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  resultsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  viewToggleButton: {
    padding: 8,
    borderRadius: 6,
  },
  sortDropdown: {
    position: 'absolute',
    width: 190,
    borderRadius: 12,
    paddingVertical: 8,
    zIndex: 100,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortOptionText: {
    fontSize: 14,
  },
  propertyCard: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  sortOverlay: {
    flex: 1,
  },
});

export default SearchResultsScreen;
