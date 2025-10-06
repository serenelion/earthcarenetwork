import type { IntegrationTestResult } from "../integrations";

interface ApolloConfig {
  apiKey?: string;
  config?: any;
}

export class ApolloConnector {
  private apiKey?: string;
  private config: any;
  private baseUrl = 'https://api.apollo.io/v1';

  constructor({ apiKey, config }: ApolloConfig) {
    this.apiKey = apiKey;
    this.config = config || {};
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Apollo API key is required');
    }
  }

  async testConnection(): Promise<IntegrationTestResult> {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'Apollo API key not configured'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/health`, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Apollo API connection successful'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `Apollo API error: ${errorData.message || response.statusText}`,
          details: errorData
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Apollo API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
  }

  async searchPeople(query: string, filters?: any): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/people/search`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q_keywords: query,
          ...filters
        })
      });

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.people || [];
    } catch (error) {
      console.error('Apollo searchPeople error:', error);
      throw error;
    }
  }

  async searchOrganizations(query: string, filters?: any): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/organizations/search`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q_organization_name: query,
          ...filters
        })
      });

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.organizations || [];
    } catch (error) {
      console.error('Apollo searchOrganizations error:', error);
      throw error;
    }
  }

  async enrichPerson(email: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/people/match`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Apollo enrichPerson error:', error);
      throw error;
    }
  }

  async enrichOrganization(domain: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/organizations/enrich`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain })
      });

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Apollo enrichOrganization error:', error);
      throw error;
    }
  }
}
