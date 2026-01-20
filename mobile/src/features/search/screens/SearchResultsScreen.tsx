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

// ============================================
// MOCK DATA
// ============================================

const MOCK_RESULTS = [
  {
    id: '1',
    title: 'Apartament 3 camere renovat complet',
    transactionType: 'SALE' as const,
    price: 95000,
    currency: 'EUR' as const,
    location: {
      neighborhood: 'Drumul Taberei',
      city: 'București',
    },
    characteristics: {
      bedrooms: 2,
      bathrooms: 1,
      totalArea: 75,
      floor: 4,
      totalFloors: 10,
    },
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    isNew: true,
    isVerified: true,
    stats: { views: 234, favorites: 12 },
  },
  {
    id: '2',
    title: 'Apartament 2 camere modern Militari',
    transactionType: 'SALE' as const,
    price: 72000,
    currency: 'EUR' as const,
    location: {
      neighborhood: 'Militari',
      city: 'București',
    },
    characteristics: {
      bedrooms: 1,
      bathrooms: 1,
      totalArea: 52,
      floor: 2,
      totalFloors: 8,
    },
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    isVerified: true,
    priceReduced: true,
    stats: { views: 156, favorites: 8 },
  },
  {
    id: '3',
    title: 'Garsonieră ultramodernă Titan',
    transactionType: 'RENT' as const,
    price: 450,
    currency: 'EUR' as const,
    location: {
      neighborhood: 'Titan',
      city: 'București',
    },
    characteristics: {
      bedrooms: 0,
      bathrooms: 1,
      totalArea: 38,
      floor: 6,
      totalFloors: 12,
    },
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    isNew: true,
    stats: { views: 89, favorites: 5 },
  },
  {
    id: '4',
    title: 'Casă cu curte mare în Pipera',
    transactionType: 'SALE' as const,
    price: 285000,
    currency: 'EUR' as const,
    location: {
      neighborhood: 'Pipera',
      city: 'București',
    },
    characteristics: {
      bedrooms: 4,
      bathrooms: 3,
      totalArea: 220,
    },
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    isVerified: true,
    stats: { views: 312, favorites: 28 },
  },
];

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
  const navigation = useNavigation();
  const route = useRoute();

  const [searchText, setSearchText] = useState('București');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    transactionType: 'SALE' as 'SALE' | 'RENT' | null,
    propertyType: null,
    priceRange: null,
    rooms: null,
    area: null,
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('PropertyDetail', { propertyId } as never);
  };

  const handleFilterPress = (filterType: string) => {
    // Open filter modal for specific filter
    console.log('Open filter:', filterType);
  };

  const handleFiltersPress = () => {
    // Open full filters modal
    console.log('Open all filters');
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
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
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
          {MOCK_RESULTS.length} rezultate
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
                viewMode === 'list' && { backgroundColor: theme.colors.primary.main },
              ]}
              onPress={() => setViewMode('list')}
            >
              <List 
                size={18} 
                color={viewMode === 'list' ? '#ffffff' : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'map' && { backgroundColor: theme.colors.primary.main },
              ]}
              onPress={() => setViewMode('map')}
            >
              <Map 
                size={18} 
                color={viewMode === 'map' ? '#ffffff' : theme.colors.textSecondary} 
              />
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

  const renderProperty = ({ item }: { item: typeof MOCK_RESULTS[0] }) => (
    <View style={styles.propertyCard}>
      <PropertyCard
        {...item}
        onPress={() => handlePropertyPress(item.id)}
        onFavoritePress={() => {}}
      />
    </View>
  );

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
    if (!loading) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={theme.colors.primary.main} />
      </View>
    );
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <FlatList
        data={MOCK_RESULTS}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id}
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
          // Load more
        }}
        onEndReachedThreshold={0.5}
      />
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
});

export default SearchResultsScreen;
