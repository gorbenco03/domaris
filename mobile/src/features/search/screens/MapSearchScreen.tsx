/**
 * RIVA - Map Search Screen
 * Interactive map discovery for properties with Mapbox
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {
  Search,
  Filter,
  List,
  Navigation,
  ArrowLeft,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { IconButton } from '@/shared/components';
import { useNavigation } from '@react-navigation/native';
import { MapViewComponent } from '@/features/maps/components';
import { PropertyPreviewCard } from '@/features/maps/components/PropertyPreviewCard';
import { useMapProperties } from '@/features/maps/hooks/useMapProperties';
import { getUserLocation } from '@/features/maps/services/mapService';
import type { MapProperty } from '@/features/maps/hooks/useMapProperties';

const MapSearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.8638, 47.0105]); // Chișinău, Moldova
  const [mapBounds, setMapBounds] = useState<{
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
  } | null>(null);

  // Fetch properties in current map bounds
  const { data: properties = [], isLoading } = useMapProperties(mapBounds);

  // Handle map region change
  const handleRegionChange = useCallback((bounds: typeof mapBounds) => {
    setMapBounds(bounds);
  }, []);

  // Handle property marker press
  const handlePropertyPress = useCallback((property: MapProperty) => {
    setSelectedProperty(property);
  }, []);

  // Center map on user's location
  const handleMyLocation = async () => {
    const location = await getUserLocation();
    setMapCenter(location);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Mapbox Map */}
      <MapViewComponent
        properties={properties}
        onPropertyPress={handlePropertyPress}
        onRegionChange={handleRegionChange}
        initialCenter={mapCenter}
        initialZoom={12}
      />

      {/* Search Header */}
      <SafeAreaView style={styles.headerOverlay}>
        <View style={styles.headerContent}>
          <IconButton
            icon={<ArrowLeft size={22} color={theme.colors.textPrimary} />}
            onPress={() => navigation.goBack()}
            variant="surface"
            size="md"
            style={{
              ...styles.backButton,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          />
          <TouchableOpacity
            style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('Filters')}
          >
            <Search size={20} color={theme.colors.textTertiary} />
            <Text style={[styles.searchText, { color: theme.colors.textSecondary }]}>
              Chișinău, Moldova
            </Text>
          </TouchableOpacity>
          <IconButton
            icon={<Filter size={20} color={theme.colors.textPrimary} />}
            onPress={() => navigation.navigate('Filters')}
            variant="ghost"
            style={{ backgroundColor: theme.colors.surface }}
          />
        </View>
      </SafeAreaView>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.mapActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <List size={20} color={theme.colors.primary.main} />
          <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>
            Listă
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}
          onPress={handleMyLocation}
        >
          <Navigation size={20} color={theme.colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Airbnb-style Property Preview Card */}
      {selectedProperty && (
        <PropertyPreviewCard
          id={selectedProperty.id}
          title={selectedProperty.title}
          price={selectedProperty.priceEur}
          currency={selectedProperty.currency}
          city={selectedProperty.city}
          neighborhood={selectedProperty.neighborhood}
          surface={selectedProperty.surfaceSqm}
          rooms={selectedProperty.rooms}
          transactionType={selectedProperty.transactionType}
          listingStatus={selectedProperty.status}
          publicFrom={selectedProperty.publicFrom}
          imageUrl={selectedProperty.images?.[0]?.url}
          onPress={() =>
            navigation.navigate('PropertyDetail', {
              propertyId: String(selectedProperty.id),
            })
          }
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  backButton: {
    padding: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  mapActions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  });

export default MapSearchScreen;
