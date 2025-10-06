import type { IntegrationTestResult } from "../integrations";

interface NotteConfig {
  apiKey?: string;
  apiSecret?: string;
  config?: any;
}

export class NotteConnector {
  private apiKey?: string;
  private apiSecret?: string;
  private config: any;
  private baseUrl = 'https://api.notte.app/v1';

  constructor({ apiKey, apiSecret, config }: NotteConfig) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.config = config || {};
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Notte API key is required');
    }
  }

  async testConnection(): Promise<IntegrationTestResult> {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'Notte API key not configured'
      };
    }

    return {
      success: false,
      message: 'Notte connector is a stub implementation. Please configure the actual API endpoints and authentication when the Notte API becomes available.'
    };
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
    this.apiSecret = undefined;
  }
}
