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
  ChevronLeft
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { IconButton } from '@/shared/components';
import { PropertyCard } from '@/features/properties/components';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// ============================================
// MOCK DATA
// ============================================

const MOCK_MARKERS = [
  { id: '1', price: '95k', type: 'APARTMENT', latitude: 44.4268, longitude: 26.1025 },
  { id: '2', price: '120k', type: 'HOUSE', latitude: 44.4350, longitude: 26.1150 },
  { id: '3', price: '85k', type: 'STUDIO', latitude: 44.4420, longitude: 26.0950 },
  { id: '4', price: '150k', type: 'APARTMENT', latitude: 44.4150, longitude: 26.0850 },
];

const MOCK_PROPERTIES = [
  {
    id: '1',
    title: 'Apartament 3 camere, Metrou Dristor',
    price: 95000,
    currency: 'EUR' as const,
    transactionType: 'SALE' as const,
    location: { city: 'București', neighborhood: 'Dristor' },
    characteristics: { rooms: 3, bedrooms: 2, totalArea: 75 },
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
  }
];

// ============================================
// COMPONENT
// ============================================

const MapSearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const renderMarker = (marker: any) => {
    const isSelected = selectedPropertyId === marker.id;
    return (
      <TouchableOpacity
        key={marker.id}
        style={[
          styles.marker,
          { 
            backgroundColor: isSelected ? theme.colors.primary.main : theme.colors.surface,
            borderColor: isSelected ? '#ffffff' : theme.colors.primary.main,
            top: 200 + (marker.latitude - 44.4) * 5000,
            left: 100 + (marker.longitude - 26.0) * 2000,
          }
        ]}
        onPress={() => setSelectedPropertyId(marker.id)}
      >
        <Text style={[
          styles.markerText, 
          { color: isSelected ? '#ffffff' : theme.colors.primary.main }
        ]}>
          {marker.price}
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
            icon={<ChevronLeft size={24} color={theme.colors.textPrimary} />}
            onPress={() => navigation.goBack()}
            variant="ghost"
            style={{ ...styles.backButton, backgroundColor: theme.colors.surface }}
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
        {MOCK_MARKERS.map(renderMarker)}
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
      {selectedPropertyId && (
        <View style={styles.previewContainer}>
          <PropertyCard
            id={MOCK_PROPERTIES[0].id}
            title={MOCK_PROPERTIES[0].title}
            transactionType={MOCK_PROPERTIES[0].transactionType}
            price={MOCK_PROPERTIES[0].price}
            currency={MOCK_PROPERTIES[0].currency}
            location={MOCK_PROPERTIES[0].location}
            characteristics={MOCK_PROPERTIES[0].characteristics}
            image={MOCK_PROPERTIES[0].image}
            onPress={() => {}}
            variant="list"
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
});

export default MapSearchScreen;
