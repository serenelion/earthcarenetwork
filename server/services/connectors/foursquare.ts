import type { IntegrationTestResult } from "../integrations";

interface FoursquareConfig {
  apiKey?: string;
  config?: any;
}

export class FoursquareConnector {
  private apiKey?: string;
  private config: any;
  private baseUrl = 'https://api.foursquare.com/v3';

  constructor({ apiKey, config }: FoursquareConfig) {
    this.apiKey = apiKey;
    this.config = config || {};
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Foursquare API key is required');
    }
  }

  async testConnection(): Promise<IntegrationTestResult> {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'Foursquare API key not configured'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/places/search?query=coffee&near=San Francisco`, {
        method: 'GET',
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Foursquare API connection successful'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `Foursquare API error: ${errorData.message || response.statusText}`,
          details: errorData
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Foursquare API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
  }

  async searchPlaces(query: string, near?: string, ll?: string): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Foursquare API key not configured');
    }

    try {
      let url = `${this.baseUrl}/places/search?query=${encodeURIComponent(query)}`;
      
      if (near) {
        url += `&near=${encodeURIComponent(near)}`;
      }
      
      if (ll) {
        url += `&ll=${ll}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Foursquare API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Foursquare searchPlaces error:', error);
      throw error;
    }
  }

  async getPlaceDetails(fsqId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Foursquare API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/places/${fsqId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Foursquare API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Foursquare getPlaceDetails error:', error);
      throw error;
    }
  }

  async searchNearby(ll: string, radius?: number, categories?: string): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Foursquare API key not configured');
    }

    try {
      let url = `${this.baseUrl}/places/nearby?ll=${ll}`;
      
      if (radius) {
        url += `&radius=${radius}`;
      }
      
      if (categories) {
        url += `&categories=${categories}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Foursquare API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Foursquare searchNearby error:', error);
      throw error;
    }
  }

  async getCategories(): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Foursquare API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/categories`, {
        method: 'GET',
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Foursquare API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Foursquare getCategories error:', error);
      throw error;
    }
  }
}
