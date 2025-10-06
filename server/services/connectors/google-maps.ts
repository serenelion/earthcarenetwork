import type { IntegrationTestResult } from "../integrations";

interface GoogleMapsConfig {
  apiKey?: string;
  config?: any;
}

export class GoogleMapsConnector {
  private apiKey?: string;
  private config: any;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor({ apiKey, config }: GoogleMapsConfig) {
    this.apiKey = apiKey;
    this.config = config || {};
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key is required');
    }
  }

  async testConnection(): Promise<IntegrationTestResult> {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'Google Maps API key not configured'
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${this.apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          return {
            success: true,
            message: 'Google Maps API connection successful'
          };
        } else {
          return {
            success: false,
            message: `Google Maps API error: ${data.error_message || data.status}`,
            details: data
          };
        }
      } else {
        return {
          success: false,
          message: `Google Maps API HTTP error: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Google Maps API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
  }

  async geocode(address: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `${this.baseUrl}/geocode/json?address=${encodedAddress}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Geocoding failed: ${data.error_message || data.status}`);
      }

      return data.results[0] || null;
    } catch (error) {
      console.error('Google Maps geocode error:', error);
      throw error;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Reverse geocoding failed: ${data.error_message || data.status}`);
      }

      return data.results[0] || null;
    } catch (error) {
      console.error('Google Maps reverseGeocode error:', error);
      throw error;
    }
  }

  async searchPlaces(query: string, location?: { lat: number; lng: number }, radius?: number): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      let url = `${this.baseUrl}/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      if (location) {
        url += `&location=${location.lat},${location.lng}`;
      }
      
      if (radius) {
        url += `&radius=${radius}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Place search failed: ${data.error_message || data.status}`);
      }

      return data.results || [];
    } catch (error) {
      console.error('Google Maps searchPlaces error:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/place/details/json?place_id=${placeId}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Place details failed: ${data.error_message || data.status}`);
      }

      return data.result || null;
    } catch (error) {
      console.error('Google Maps getPlaceDetails error:', error);
      throw error;
    }
  }
}
