import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly mapboxToken: string;
  private readonly mapboxBaseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  constructor(private readonly configService: ConfigService) {
    this.mapboxToken = this.configService.get<string>('MAPBOX_SECRET_TOKEN') || '';

    if (!this.mapboxToken) {
      this.logger.warn('MAPBOX_SECRET_TOKEN not configured - geocoding will be disabled');
    }
  }

  /**
   * Geocode address to coordinates
   * @param address - Full address string (e.g., "Strada Fericirii 10, Cluj-Napoca, Romania")
   * @returns Coordinates and formatted address, or null if failed
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!this.mapboxToken) {
      this.logger.warn('Geocoding skipped - no Mapbox token configured');
      return null;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.mapboxBaseUrl}/${encodedAddress}.json`;

      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxToken,
          country: 'RO', // Restrict to Romania
          limit: 1,
        },
        timeout: 5000,
      });

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const [longitude, latitude] = feature.center;

        return {
          latitude,
          longitude,
          formattedAddress: feature.place_name,
        };
      }

      this.logger.warn(`No geocoding results for address: ${address}`);
      return null;
    } catch (error) {
      this.logger.error(`Geocoding failed for address: ${address}`, error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @returns Formatted address, or null if failed
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    if (!this.mapboxToken) {
      this.logger.warn('Reverse geocoding skipped - no Mapbox token configured');
      return null;
    }

    try {
      const url = `${this.mapboxBaseUrl}/${longitude},${latitude}.json`;

      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxToken,
          country: 'RO',
          limit: 1,
        },
        timeout: 5000,
      });

      if (response.data.features && response.data.features.length > 0) {
        return response.data.features[0].place_name;
      }

      this.logger.warn(`No reverse geocoding results for: ${latitude}, ${longitude}`);
      return null;
    } catch (error) {
      this.logger.error(`Reverse geocoding failed for: ${latitude}, ${longitude}`, error);
      return null;
    }
  }

  /**
   * Validate if coordinates are within Romania bounds
   * Approximate Romania bounds:
   * Lat: 43.6 (south) to 48.3 (north)
   * Lng: 20.2 (west) to 30.0 (east)
   */
  isValidRomanianCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= 43.6 &&
      latitude <= 48.3 &&
      longitude >= 20.2 &&
      longitude <= 30.0
    );
  }
}
