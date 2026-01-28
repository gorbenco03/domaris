/**
 * IMOBI - Home Screen
 * Main discovery screen with search and property highlights
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTutorialTarget } from '@/shared/services';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Bell,
  ChevronRight,
  Sparkles,
  Building2,
  Home,
  Store,
  Bookmark,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { QuickFilters } from '@/features/search/components/QuickFilters';
import { PropertyCard } from '@/shared/components';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import {
  useProperties,
  useSearchFacets,
  useSearch,
  useFavorites,
  useToggleFavorite,
} from '@/features/search/services';
import { ActivityIndicator } from 'react-native';
import { SearchStackParamList } from '@/app/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PAGINATION } from '@/config/constants';
import { useRequireAuth } from '@/shared/hooks';

type NavigationProp = NativeStackNavigationProp<SearchStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// MOCK DATA
// ============================================

const QUICK_CATEGORIES = [
  { id: 'APARTMENT', label: 'Apartamente', icon: Building2, color: '#6366f1' },
  { id: 'HOUSE', label: 'Case', icon: Home, color: '#10b981' },
  { id: 'COMMERCIAL', label: 'Comercial', icon: Store, color: '#f59e0b' },
];

// ============================================
// COMPONENT
// ============================================

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);

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

  // Tutorial target refs
  const categoriesRef = useRef<View>(null);
  const aiBannerRef = useRef<View>(null);

  // Register tutorial targets
  useTutorialTarget('home-categories', categoriesRef);
  useTutorialTarget('home-ai-banner', aiBannerRef);

  const handleQuickFilterToggle = (filterId: string) => {
    setQuickFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId]
    );
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

  // Real data fetching
  const { 
    data: propertiesData, 
    isLoading: propertiesLoading, 
    refetch: refetchProperties 
  } = useProperties({ 
    limit: 6,
    sortBy: 'createdAt' as any,
    sortOrder: 'DESC'
  });

  const {
    data: facetsData,
    isLoading: facetsLoading,
    refetch: refetchFacets
  } = useSearchFacets();

  const properties = propertiesData?.data || [];
  const popularLocations = (facetsData?.cities || []).slice(0, 4).map((f, i) => ({
    id: String(i),
    name: f.name,
    count: f.count,
  }));

  const handleSearch = (filters: Record<string, unknown>) => {
    navigation.navigate('SearchResults', { filters });
  };

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('PropertyDetail', { propertyId });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProperties(), refetchFacets()]);
    setRefreshing(false);
  }, [refetchProperties, refetchFacets]);

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ width: '100%', flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.logo, { color: theme.colors.primary.main }]}>
              IMOBI
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color={theme.colors.accent.main} />
              <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
                România
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.notificationButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => {
              if (!requireAuth({ message: 'Autentifică-te pentru a vedea notificările.' })) {
                return;
              }
              navigation.navigate('Notifications' as never);
            }}
          >
            <Bell size={22} color={theme.colors.textSecondary} />
            <View style={[styles.notificationDot, { backgroundColor: theme.colors.secondary.error }]} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]}>
            Găsește-ți casa visurilor
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
            Direct de la proprietari, fără comisioane
          </Text>
        </View>

        {/* Quick Categories */}
        <View style={styles.categoriesSection} ref={categoriesRef}>
          <View style={styles.categoriesGrid}>
            {QUICK_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  { 
                    backgroundColor: theme.colors.surface,
                    ...theme.shadows.sm,
                  }
                ]}
                activeOpacity={0.8}
                onPress={() => handleSearch({ propertyType: category.id })}
              >
                <View 
                  style={[
                    styles.categoryIconContainer,
                    { backgroundColor: `${category.color}15` }
                  ]}
                >
                  <category.icon size={24} color={category.color} />
                </View>
                <Text 
                  style={[styles.categoryLabel, { color: theme.colors.textPrimary }]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI Chat Banner */}
        <View style={styles.aiSection} ref={aiBannerRef}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('AIChat' as never)}
          >
            <LinearGradient
              colors={theme.gradients.ai}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiBanner}
            >
              <View style={styles.aiBannerContent}>
                <Sparkles size={28} color="#ffffff" />
                <View style={styles.aiBannerText}>
                  <Text style={styles.aiBannerTitle}>
                    Întreabă AI-ul nostru
                  </Text>
                  <Text style={styles.aiBannerSubtitle}>
                    "Vreau un apartament cu 2 camere în București"
                  </Text>
                </View>
              </View>
              <ChevronRight size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Filters */}
        <QuickFilters
          selectedFilters={quickFilters as any}
          onFilterToggle={handleQuickFilterToggle}
        />

        {/* Popular Locations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Căutări populare
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (!requireAuth({ message: 'Autentifică-te pentru a vedea căutările salvate.' })) {
                  return;
                }
                navigation.navigate('SavedSearches' as never);
              }}
              style={styles.savedSearchesButton}
            >
              <Bookmark size={16} color={theme.colors.primary.main} />
              <Text style={[styles.seeAllText, { color: theme.colors.primary.main }]}>
                Căutări salvate
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.locationsContainer}
          >
            {facetsLoading ? (
              <ActivityIndicator color={theme.colors.primary.main} />
            ) : (
              popularLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.locationCard,
                    { 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    }
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSearch({ city: location.name })}
                >
                  <MapPin size={16} color={theme.colors.accent.main} />
                  <Text 
                    style={[styles.locationName, { color: theme.colors.textPrimary }]}
                  >
                    {location.name}
                  </Text>
                  <Text 
                    style={[styles.locationCount, { color: theme.colors.textTertiary }]}
                  >
                    {location.count} anunțuri
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* New Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Adăugate recent
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.colors.primary.main }]}>
                Vezi toate
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.propertiesContainer}>
            {propertiesLoading ? (
              <ActivityIndicator color={theme.colors.primary.main} />
            ) : properties.length > 0 ? (
              properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={String(property.id)}
                  title={property.title}
                  transactionType={property.transactionType || 'SALE'}
                  price={(property as any).priceEur ?? property.price ?? 0}
                  currency={property.currency || 'EUR'}
                  location={{
                    neighborhood: property.neighborhood || undefined,
                    city: property.city || '',
                  }}
                  characteristics={{
                    rooms: property.rooms,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    totalArea: (property as any).surfaceSqm ?? property.surface ?? 0,
                    floor: property.floor,
                    totalFloors: property.totalFloors,
                  }}
                  image={
                    (property as any).images?.[0]?.url ||
                    (property as any).photos?.[0]?.url ||
                    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
                  }
                  onPress={() => handlePropertyPress(String(property.id))}
                  isFavorite={favoriteIds.has(String(property.id))}
                  onFavoritePress={() =>
                    handleToggleFavorite(
                      Number(property.id),
                      favoriteIds.has(String(property.id))
                    )
                  }
                />
              ))
            ) : (
              <Text style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                Momentan nu există anunțuri noi
              </Text>
            )}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    gap: 2,
  },
  logo: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  notificationButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  categoriesSection: {
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    flexBasis: '31%',
    maxWidth: '31%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    aspectRatio: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  aiSection: {
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  aiBannerText: {
    flex: 1,
  },
  aiBannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  aiBannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  locationsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  locationName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  locationCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  propertiesContainer: {
    gap: 16,
  },
  savedSearchesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

export default HomeScreen;
