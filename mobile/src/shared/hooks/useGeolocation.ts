/**
 * RIVA - useGeolocation Hook
 * Get device location using expo-location
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionStatus: Location.PermissionStatus | null;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  autoFetch?: boolean;
}

/**
 * Hook to get device geolocation
 * @param options - Geolocation options
 * @returns Location state and refresh function
 */
export function useGeolocation(options: GeolocationOptions = {}) {
  const { enableHighAccuracy = false, autoFetch = false } = options;

  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    permissionStatus: null,
  });

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setState((prev) => ({ ...prev, permissionStatus: status }));
      return status === Location.PermissionStatus.GRANTED;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }, []);

  const fetchLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Check/request permission first
      const hasPermission = await requestPermission();

      if (!hasPermission) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Permisiunea pentru locație a fost refuzată',
        }));
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });

      setState({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        error: null,
        loading: false,
        permissionStatus: Location.PermissionStatus.GRANTED,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Nu s-a putut obține locația',
      }));
    }
  }, [enableHighAccuracy, requestPermission]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
  }, [autoFetch, fetchLocation]);

  return {
    ...state,
    fetchLocation,
    requestPermission,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}

export default useGeolocation;
