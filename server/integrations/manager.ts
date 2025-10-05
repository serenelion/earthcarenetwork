import { storage } from "../storage";

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  credentials?: any;
}

export interface NormalizedSearchResult {
  id?: string;
  name: string;
  email?: string;
  company?: string;
  location?: string;
  address?: string;
  phone?: string;
  website?: string;
  category?: string;
  source: string;
  rawData?: any;
}

export class ExternalIntegrationManager {
  private providers: Map<string, any>;
  private rateLimits: Map<string, { count: number; resetTime: number }>;

  constructor() {
    this.providers = new Map();
    this.rateLimits = new Map();
  }

  async getProviderClient(provider: string, userId: string): Promise<any> {
    const credentials = await this.resolveCredentials(provider, userId);
    
    const clientClass = await this.loadProviderClient(provider);
    return new clientClass(credentials);
  }

  private async resolveCredentials(provider: string, userId: string): Promise<ProviderConfig> {
    const envVarMap: Record<string, string> = {
      'apollo': 'APOLLO_API_KEY',
      'google_maps': 'GOOGLE_MAPS_API_KEY',
      'foursquare': 'FOURSQUARE_API_KEY',
      'pipedrive': 'PIPEDRIVE_API_KEY',
      'twenty_crm': 'TWENTY_CRM_API_KEY'
    };

    const envVar = envVarMap[provider];
    if (envVar && process.env[envVar]) {
      return {
        apiKey: process.env[envVar],
        baseUrl: this.getProviderBaseUrl(provider)
      };
    }

    const userToken = await storage.getUserProviderToken(userId, provider as any);
    if (userToken && userToken.isActive) {
      await storage.updateTokenLastUsed(userToken.id);
      return {
        credentials: userToken.tokenData,
        baseUrl: this.getProviderBaseUrl(provider)
      };
    }

    return {
      baseUrl: this.getProviderBaseUrl(provider)
    };
  }

  private getProviderBaseUrl(provider: string): string {
    const baseUrls: Record<string, string> = {
      'apollo': 'https://api.apollo.io/v1',
      'google_maps': 'https://maps.googleapis.com/maps/api',
      'foursquare': 'https://api.foursquare.com/v3',
      'pipedrive': 'https://api.pipedrive.com/v1',
      'twenty_crm': 'https://api.twenty.com/graphql'
    };
    return baseUrls[provider] || '';
  }

  private async loadProviderClient(provider: string): Promise<any> {
    switch (provider) {
      case 'apollo':
        const { ApolloClient } = await import('./providers/apollo');
        return ApolloClient;
      case 'google_maps':
        const { GoogleMapsClient } = await import('./providers/googleMaps');
        return GoogleMapsClient;
      case 'foursquare':
        const { FoursquareClient } = await import('./providers/foursquare');
        return FoursquareClient;
      case 'pipedrive':
        const { PipedriveClient } = await import('./providers/pipedrive');
        return PipedriveClient;
      case 'twenty_crm':
        const { TwentyCrmClient } = await import('./providers/twentyCrm');
        return TwentyCrmClient;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  async validateProviderCredentials(provider: string, userId?: string): Promise<boolean> {
    try {
      if (userId) {
        const credentials = await this.resolveCredentials(provider, userId);
        return !!(credentials.apiKey || credentials.credentials);
      }

      const envVarMap: Record<string, string> = {
        'apollo': 'APOLLO_API_KEY',
        'google_maps': 'GOOGLE_MAPS_API_KEY',
        'foursquare': 'FOURSQUARE_API_KEY',
        'pipedrive': 'PIPEDRIVE_API_KEY',
        'twenty_crm': 'TWENTY_CRM_API_KEY'
      };

      const envVar = envVarMap[provider];
      return !!(envVar && process.env[envVar]);
    } catch (error) {
      return false;
    }
  }

  normalizeSearchResults(provider: string, rawResults: any[]): NormalizedSearchResult[] {
    if (!rawResults || !Array.isArray(rawResults)) {
      return [];
    }

    switch (provider) {
      case 'apollo':
        return this.normalizeApolloResults(rawResults);
      case 'google_maps':
        return this.normalizeGoogleMapsResults(rawResults);
      case 'foursquare':
        return this.normalizeFoursquareResults(rawResults);
      case 'pipedrive':
        return this.normalizePipedriveResults(rawResults);
      case 'twenty_crm':
        return this.normalizeTwentyCrmResults(rawResults);
      default:
        return rawResults.map(r => ({ ...r, source: provider }));
    }
  }

  private normalizeApolloResults(results: any[]): NormalizedSearchResult[] {
    return results.map(result => ({
      id: result.id,
      name: result.name || `${result.first_name || ''} ${result.last_name || ''}`.trim(),
      email: result.email,
      company: result.organization?.name || result.company,
      location: result.city && result.state ? `${result.city}, ${result.state}` : result.location,
      phone: result.phone,
      website: result.organization?.website_url,
      source: 'apollo',
      rawData: result
    }));
  }

  private normalizeGoogleMapsResults(results: any[]): NormalizedSearchResult[] {
    return results.map(result => ({
      id: result.place_id,
      name: result.name,
      address: result.formatted_address || result.vicinity,
      phone: result.formatted_phone_number,
      website: result.website,
      location: result.geometry?.location ? 
        `${result.geometry.location.lat}, ${result.geometry.location.lng}` : undefined,
      source: 'google_maps',
      rawData: result
    }));
  }

  private normalizeFoursquareResults(results: any[]): NormalizedSearchResult[] {
    return results.map(result => ({
      id: result.fsq_id,
      name: result.name,
      address: result.location?.formatted_address,
      category: result.categories?.[0]?.name,
      location: result.geocodes?.main ? 
        `${result.geocodes.main.latitude}, ${result.geocodes.main.longitude}` : undefined,
      source: 'foursquare',
      rawData: result
    }));
  }

  private normalizePipedriveResults(results: any[]): NormalizedSearchResult[] {
    return results.map(result => ({
      id: result.id?.toString(),
      name: result.title || result.name,
      email: result.email?.[0]?.value || result.email,
      company: result.org_name || result.organization?.name,
      phone: result.phone?.[0]?.value || result.phone,
      source: 'pipedrive',
      rawData: result
    }));
  }

  private normalizeTwentyCrmResults(results: any[]): NormalizedSearchResult[] {
    return results.map(result => ({
      id: result.id,
      name: result.name || `${result.firstName || ''} ${result.lastName || ''}`.trim(),
      email: result.email,
      company: result.company?.name || result.companyName,
      phone: result.phone,
      website: result.website || result.company?.website,
      source: 'twenty_crm',
      rawData: result
    }));
  }

  async checkRateLimit(provider: string, userId: string): Promise<boolean> {
    const key = `${provider}:${userId}`;
    const limit = this.rateLimits.get(key);

    if (!limit) {
      this.rateLimits.set(key, { count: 1, resetTime: Date.now() + 60000 });
      return true;
    }

    if (Date.now() > limit.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: Date.now() + 60000 });
      return true;
    }

    const maxRequests = 60;
    if (limit.count >= maxRequests) {
      return false;
    }

    limit.count++;
    return true;
  }

  async handleApiError(error: any, provider: string): Promise<never> {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status || 500;

    console.error(`[Integration Error] Provider: ${provider}, Status: ${statusCode}, Message: ${errorMessage}`);

    if (statusCode === 401 || statusCode === 403) {
      throw new Error(`Authentication failed for ${provider}: ${errorMessage}`);
    } else if (statusCode === 429) {
      throw new Error(`Rate limit exceeded for ${provider}`);
    } else {
      throw new Error(`${provider} API error: ${errorMessage}`);
    }
  }
}

export const integrationManager = new ExternalIntegrationManager();
