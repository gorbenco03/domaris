/**
 * IMOBI - Location Picker Modal
 * Full-screen modal for picking location on map
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { MapPin, X, Check } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { env } from '@/config/env';

Mapbox.setAccessToken(env.MAPBOX_ACCESS_TOKEN);

interface LocationPickerModalProps {
  visible: boolean;
  initialLocation?: [number, number]; // [lng, lat]
  onConfirm: (location: { lat: number; lng: number }) => void;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  initialLocation = [24.7536, 45.9432], // Bucharest
  onConfirm,
  onClose,
}) => {
  const { theme } = useTheme();
  const mapRef = useRef<Mapbox.MapView>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number]>(initialLocation);

  const handleMapPress = (feature: any) => {
    const { geometry } = feature;
    if (geometry?.coordinates) {
      setSelectedLocation(geometry.coordinates);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      lng: selectedLocation[0],
      lat: selectedLocation[1],
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <X size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Alege locația pe hartă
          </Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
            <Check size={24} color={theme.colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <Mapbox.MapView
            ref={mapRef}
            style={styles.map}
            styleURL={Mapbox.StyleURL.Street}
            onPress={handleMapPress}
            compassEnabled
            zoomEnabled
          >
            <Mapbox.Camera
              zoomLevel={14}
              centerCoordinate={selectedLocation}
              animationDuration={0}
            />

            {/* Selected location marker */}
            {selectedLocation && (
              <Mapbox.MarkerView
                coordinate={selectedLocation}
                id="selected-location"
              >
                <View style={styles.markerContainer}>
                  <MapPin size={40} color={theme.colors.accent.main} fill={theme.colors.accent.main} />
                </View>
              </Mapbox.MarkerView>
            )}
          </Mapbox.MapView>
        </View>

        {/* Instructions */}
        <View style={[styles.instructions, { backgroundColor: theme.colors.surface }]}>
          <MapPin size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.instructionsText, { color: theme.colors.textSecondary }]}>
            Apasă pe hartă pentru a selecta locația exactă a proprietății
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});
