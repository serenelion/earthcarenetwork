import type { ProviderConfig } from "../manager";

export class GoogleMapsClient {
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async textSearch(query: string, location?: { lat: number; lng: number }): Promise<any[]> {
    if (!this.config.apiKey) {
      return this.getMockPlaces(query);
    }

    try {
      const params = new URLSearchParams({
        query,
        key: this.config.apiKey
      });

      if (location) {
        params.append('location', `${location.lat},${location.lng}`);
        params.append('radius', '5000');
      }

      const response = await fetch(
        `${this.config.baseUrl}/place/textsearch/json?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Maps API error: ${data.status}`);
      }

      return data.results || [];
    } catch (error) {
      console.error('Google Maps textSearch error:', error);
      return this.getMockPlaces(query);
    }
  }

  async nearbySearch(
    location: { lat: number; lng: number }, 
    radius: number = 5000, 
    type?: string
  ): Promise<any[]> {
    if (!this.config.apiKey) {
      return this.getMockPlaces('nearby');
    }

    try {
      const params = new URLSearchParams({
        location: `${location.lat},${location.lng}`,
        radius: radius.toString(),
        key: this.config.apiKey
      });

      if (type) {
        params.append('type', type);
      }

      const response = await fetch(
        `${this.config.baseUrl}/place/nearbysearch/json?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Maps API error: ${data.status}`);
      }

      return data.results || [];
    } catch (error) {
      console.error('Google Maps nearbySearch error:', error);
      return this.getMockPlaces('nearby');
    }
  }

  private getMockPlaces(query: string): any[] {
    return [
      {
        place_id: 'gmaps-place-1',
        name: 'Earth Care Community Center',
        formatted_address: '123 Sustainability Ave, Portland, OR 97201',
        geometry: {
          location: {
            lat: 45.5152,
            lng: -122.6784
          }
        },
        formatted_phone_number: '+1-555-0300',
        website: 'https://earthcare-center.example.com',
        rating: 4.8,
        types: ['community_center', 'point_of_interest']
      },
      {
        place_id: 'gmaps-place-2',
        name: 'Green Building Supply',
        formatted_address: '456 Eco Way, Portland, OR 97202',
        geometry: {
          location: {
            lat: 45.5200,
            lng: -122.6700
          }
        },
        formatted_phone_number: '+1-555-0301',
        website: 'https://greenbuilding.example.com',
        rating: 4.5,
        types: ['store', 'point_of_interest']
      }
    ];
  }
}
