/**
 * IMOBI - Map Service
 * Utility functions for map operations
 */

import * as Location from 'expo-location';

/**
 * Get user's current location
 * Returns Cluj-Napoca center as fallback
 */
export const getUserLocation = async (): Promise<[number, number]> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.log('Location permission denied');
      return [23.5887, 46.7712]; // Cluj-Napoca center
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return [location.coords.longitude, location.coords.latitude];
  } catch (error) {
    console.error('Failed to get user location:', error);
    return [23.5887, 46.7712]; // Cluj-Napoca center fallback
  }
};

/**
 * Calculate bounds from center and radius (approximate)
 * @param center - [lng, lat]
 * @param radiusKm - Radius in kilometers
 */
export const calculateBounds = (
  center: [number, number],
  radiusKm: number
): {
  neLat: number;
  neLng: number;
  swLat: number;
  swLng: number;
} => {
  const [lng, lat] = center;

  // Rough conversion: 1 degree ≈ 111 km
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    neLat: lat + latDelta,
    neLng: lng + lngDelta,
    swLat: lat - latDelta,
    swLng: lng - lngDelta,
  };
};

/**
 * Romanian cities coordinates
 */
export const ROMANIA_CITIES = {
  Bucuresti: [26.1025, 44.4268] as [number, number],
  Cluj: [23.5887, 46.7712] as [number, number],
  Timisoara: [21.2272, 45.7494] as [number, number],
  Iasi: [27.5766, 47.1585] as [number, number],
  Constanta: [28.6348, 44.1598] as [number, number],
  Brasov: [25.6012, 45.6580] as [number, number],
  Sibiu: [24.1513, 45.7983] as [number, number],
  Oradea: [21.9211, 47.0722] as [number, number],
};
