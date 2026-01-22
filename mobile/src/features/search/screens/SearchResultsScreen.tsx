/**
 * IMOBI - Search Results Screen
 * Property search results with filters
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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
import { PropertyCard } from '@/features/properties/components/PropertyCard';
import { IconButton } from '@/shared/components/IconButton';
import { useSearch } from '@/features/search/hooks/useSearch';
import { SearchStackParamList } from '@/app/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { IPropertyListItem } from '@/core/api/types';

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

const SearchResultsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();

  // Extract initial filters from route params
  const initialFilters = route.params?.filters || {};
  const [searchText, setSearchText] = useState(initialFilters.query || initialFilters.city || '');
  // const [viewMode, setViewMode] = useState<'list' | 'map'>('list'); // Removed viewMode state
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<any>({
    ...initialFilters,
    transactionType: initialFilters.transactionType || 'SALE',
  });

  // Real data fetching
  const { 
    data: searchResponse, 
    isLoading, 
    refetch,
  } = useSearch({
    ...filters,
    query: searchText,
    sortBy: sortBy === 'date_newest' ? 'date_desc' : sortBy as any,
  });

  const results = searchResponse?.data || [];
  const totalCount = searchResponse?.total || 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('PropertyDetail', { propertyId });
  };

  const handleFilterPress = (filterType: string) => {
    // Open full filters modal for now, focusing logic can be added later
    (navigation.navigate as any)('SearchFilters', { filters });
  };

  const handleFiltersPress = () => {
    // Open full filters modal passing current filters
    (navigation.navigate as any)('SearchFilters', { filters });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(Boolean).length;
  };

  const getCurrentSortLabel = () => {
    return SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Sortare';
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar Row */}
      <View style={styles.searchRow}>
        {navigation.canGoBack() && (
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.searchBarContainer}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            onSubmit={() => {}}
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
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setShowSortModal(!showSortModal)}
            activeOpacity={0.8}
          >
            <ArrowUpDown size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.sortButtonText, { color: theme.colors.textSecondary }]}>
              {getCurrentSortLabel()}
            </Text>
          </TouchableOpacity>

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

      {/* Sort Options Dropdown */}
      {showSortModal && (
        <View 
          style={[
            styles.sortDropdown, 
            { 
              backgroundColor: theme.colors.surface,
              ...theme.shadows.lg,
            }
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
                    color: sortBy === option.value 
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
      )}
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
          onFavoritePress={() => {}}
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
          setFilters({
            transactionType: null,
            propertyType: null,
            priceRange: null,
            rooms: null,
            area: null,
          });
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
    top: 160,
    right: 16,
    width: 180,
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
});

export default SearchResultsScreen;
