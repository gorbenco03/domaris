/**
 * IMOBI - Map Search Screen
 * Interactive map discovery for properties
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { 
  X, 
  Search, 
  Filter, 
  List,
  Navigation,
  ArrowLeft
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { IconButton } from '@/shared/components';
import { PropertyCard } from '@/shared/components';
import { useNavigation } from '@react-navigation/native';
import { useMapData, useSearch } from '@/features/search/services';
import { ActivityIndicator } from 'react-native';
import type { IPropertyListing } from '@/core/api/types';

const { width } = Dimensions.get('window');



// ============================================
// COMPONENT
// ============================================

const MapSearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [filters, setFilters] = useState<any>({ city: 'București' });

  // Real data fetching
  const { data: mapData, isLoading: mapLoading } = useMapData(filters);
  const { data: propertyData } = useSearch({ 
    ...filters, 
    limit: 10 // For preview cards
  });

  const markers = mapData?.features || [];
  const selectedProperty = propertyData?.data.find(p => p.id === selectedPropertyId);

  const formatPriceShort = (price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `${(price / 1000).toFixed(0)}k`;
    return `${price}`;
  };

  const renderMarker = (feature: any) => {
    const { id, price } = feature.properties;
    const [longitude, latitude] = feature.geometry.coordinates;
    const isSelected = selectedPropertyId === id;
    
    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.marker,
          { 
            backgroundColor: isSelected ? theme.colors.primary.main : theme.colors.surface,
            borderColor: isSelected ? '#ffffff' : theme.colors.primary.main,
            // Mock transformation for visualization without real Google Maps
            top: 400 + (latitude - 44.4) * 8000,
            left: 200 + (longitude - 26.1) * 4000,
          }
        ]}
        onPress={() => setSelectedPropertyId(id)}
      >
        <Text style={[
          styles.markerText, 
          { color: isSelected ? '#ffffff' : theme.colors.primary.main }
        ]}>
          {formatPriceShort(price)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Header */}
      <SafeAreaView style={styles.headerOverlay}>
        <View style={styles.headerContent}>
          <IconButton
            icon={<ArrowLeft size={22} color={theme.colors.textPrimary} />}
            onPress={() => navigation.goBack()}
            variant="surface"
            size="md"
            style={{ ...styles.backButton, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}
          />
          <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
            <Search size={20} color={theme.colors.textTertiary} />
            <Text style={[styles.searchText, { color: theme.colors.textSecondary }]}>
              București, România
            </Text>
          </View>
          <IconButton
            icon={<Filter size={20} color={theme.colors.textPrimary} />}
            onPress={() => {}}
            variant="ghost"
            style={{ backgroundColor: theme.colors.surface }}
          />
        </View>
      </SafeAreaView>

      {/* Mock Map Background */}
      <View style={[styles.mapMock, { backgroundColor: theme.colors.divider }]}>
        <View style={styles.gridLineH} />
        <View style={styles.gridLineH} />
        <View style={styles.gridLineV} />
        <View style={styles.gridLineV} />
        
        {/* Markers */}
        {mapLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
          </View>
        ) : (
          markers.map(renderMarker)
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.mapActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <List size={20} color={theme.colors.primary.main} />
          <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>Listă</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}
        >
          <Navigation size={20} color={theme.colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Property Preview Carousel */}
      {selectedProperty && (
        <View style={styles.previewContainer}>
          <PropertyCard
            {...selectedProperty}
            onPress={() => navigation.navigate('PropertyDetail', { propertyId: String(selectedProperty.id) })}
          />
          <IconButton
            icon={<X size={20} color="#ffffff" />}
            onPress={() => setSelectedPropertyId(null)}
            variant="ghost"
            style={{ 
              ...styles.closePreview, 
              backgroundColor: theme.colors.primary.main,
              width: 36,
              height: 36,
              borderRadius: 18
            }}
          />
        </View>
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
  mapMock: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLineH: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#cbd5e1',
    top: '33%',
    opacity: 0.2,
  },
  gridLineV: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#cbd5e1',
    left: '50%',
    opacity: 0.2,
  },
  marker: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
  },
  mapActions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  previewContainer: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  closePreview: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapSearchScreen;
