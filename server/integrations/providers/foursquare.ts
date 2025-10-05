import type { ProviderConfig } from "../manager";

export class FoursquareClient {
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<any[]> {
    if (!this.config.apiKey) {
      return this.getMockPlaces(query);
    }

    try {
      const params = new URLSearchParams({ query });

      if (location) {
        params.append('ll', `${location.lat},${location.lng}`);
        params.append('radius', '5000');
      }

      const response = await fetch(
        `${this.config.baseUrl}/places/search?${params.toString()}`,
        {
          headers: {
            'Authorization': this.config.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Foursquare API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Foursquare searchPlaces error:', error);
      return this.getMockPlaces(query);
    }
  }

  private getMockPlaces(query: string): any[] {
    return [
      {
        fsq_id: '4sq-place-1',
        name: 'Permaculture Design Studio',
        location: {
          formatted_address: '789 Regeneration Rd, Boulder, CO 80301',
          locality: 'Boulder',
          region: 'CO'
        },
        categories: [
          {
            id: 13000,
            name: 'Design Studio',
            icon: {
              prefix: 'https://ss3.4sqi.net/img/categories_v2/building/',
              suffix: '.png'
            }
          }
        ],
        geocodes: {
          main: {
            latitude: 40.0150,
            longitude: -105.2705
          }
        }
      },
      {
        fsq_id: '4sq-place-2',
        name: 'Organic Food Cooperative',
        location: {
          formatted_address: '321 Local Farm Lane, Boulder, CO 80302',
          locality: 'Boulder',
          region: 'CO'
        },
        categories: [
          {
            id: 17000,
            name: 'Food & Drink',
            icon: {
              prefix: 'https://ss3.4sqi.net/img/categories_v2/food/',
              suffix: '.png'
            }
          }
        ],
        geocodes: {
          main: {
            latitude: 40.0200,
            longitude: -105.2800
          }
        }
      }
    ];
  }
}
