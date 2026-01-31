/**
 * RIVA - MapView Component
 * Wrapper around Mapbox GL for displaying property markers
 */

import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { env } from '@/config/env';
import { PropertyMarker } from './PropertyMarker';

// Initialize Mapbox
Mapbox.setAccessToken(env.MAPBOX_ACCESS_TOKEN);

export interface Property {
  id: number;
  title: string;
  priceEur: number;
  surfaceSqm: number;
  rooms: number;
  lat: number;
  lng: number;
  images?: Array<{ url: string }>;
}

interface MapViewProps {
  properties: Property[];
  onPropertyPress?: (property: Property) => void;
  onRegionChange?: (bounds: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
  }) => void;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
}

export const MapViewComponent: React.FC<MapViewProps> = ({
  properties,
  onPropertyPress,
  onRegionChange,
  initialCenter = [28.8638, 47.0105], // Chișinău, Moldova
  initialZoom = 12,
}) => {
  const mapRef = useRef<Mapbox.MapView>(null);

  const handleRegionDidChange = async () => {
    if (!onRegionChange || !mapRef.current) return;

    try {
      const bounds = await mapRef.current.getVisibleBounds();
      if (bounds) {
        const [[swLng, swLat], [neLng, neLat]] = bounds;
        onRegionChange({ neLat, neLng, swLat, swLng });
      }
    } catch (error) {
      console.error('Failed to get visible bounds:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        onRegionDidChange={handleRegionDidChange}
        compassEnabled
        zoomEnabled
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Mapbox.Camera
          zoomLevel={initialZoom}
          centerCoordinate={initialCenter}
          animationDuration={0}
        />

        {/* Render property markers */}
        {properties.map((property) => (
          <PropertyMarker
            key={property.id}
            property={property}
            onPress={() => onPropertyPress?.(property)}
          />
        ))}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
