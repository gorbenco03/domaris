/**
 * IMOBI - Property Marker Component
 * Custom marker for displaying properties on map
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import type { Property } from './MapView';

interface PropertyMarkerProps {
  property: Property;
  onPress?: () => void;
}

export const PropertyMarker: React.FC<PropertyMarkerProps> = ({ property, onPress }) => {
  const price = `€${property.priceEur}`;

  return (
    <Mapbox.MarkerView coordinate={[property.lng, property.lat]} id={String(property.id)}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.markerContainer}>
          <View style={styles.markerBubble}>
            <Text style={styles.priceText} numberOfLines={1}>
              {price}
            </Text>
          </View>
          <View style={styles.markerArrow} />
        </View>
      </TouchableOpacity>
    </Mapbox.MarkerView>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  priceText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1e3a5f',
    marginTop: -1,
  },
});
