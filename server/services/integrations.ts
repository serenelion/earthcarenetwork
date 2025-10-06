import { storage } from "../storage";
import type { InsertIntegrationConfig, IntegrationConfig } from "@shared/schema";
import { encryptApiKey, decryptApiKey, maskApiKey } from "../utils/encryption";

export interface IntegrationHealthStatus {
  healthy: boolean;
  lastChecked: Date;
  message?: string;
  responseTime?: number;
}

export interface IntegrationTestResult {
  success: boolean;
  message: string;
  details?: any;
  responseTime?: number;
}

export class IntegrationService {
  async getAllIntegrations(status?: 'active' | 'inactive' | 'error'): Promise<IntegrationConfig[]> {
    const configs = await storage.getIntegrationConfigs(status);
    
    return configs.map(config => this.sanitizeConfig(config));
  }

  async getIntegration(id: string): Promise<IntegrationConfig | undefined> {
    const config = await storage.getIntegrationConfig(id);
    if (!config) {
      return undefined;
    }
    return this.sanitizeConfig(config);
  }

  async getIntegrationByName(name: string): Promise<IntegrationConfig | undefined> {
    const config = await storage.getIntegrationConfigByName(name);
    if (!config) {
      return undefined;
    }
    return this.sanitizeConfig(config);
  }

  async createIntegration(data: InsertIntegrationConfig): Promise<IntegrationConfig> {
    let encryptedApiKey = data.apiKey;
    let encryptedApiSecret = data.apiSecret;
    
    if (data.apiKey && !data.isEncrypted) {
      encryptedApiKey = await encryptApiKey(data.apiKey);
    }
    
    if (data.apiSecret && !data.isEncrypted) {
      encryptedApiSecret = await encryptApiKey(data.apiSecret);
    }
    
    const config = await storage.createIntegrationConfig({
      ...data,
      apiKey: encryptedApiKey,
      apiSecret: encryptedApiSecret,
      isEncrypted: true,
    });
    
    return this.sanitizeConfig(config);
  }

  async updateIntegration(id: string, data: Partial<InsertIntegrationConfig>): Promise<IntegrationConfig> {
    const updateData: any = { ...data };
    
    if (data.apiKey && !data.isEncrypted) {
      updateData.apiKey = await encryptApiKey(data.apiKey);
      updateData.isEncrypted = true;
    }
    
    if (data.apiSecret && !data.isEncrypted) {
      updateData.apiSecret = await encryptApiKey(data.apiSecret);
      updateData.isEncrypted = true;
    }
    
    const config = await storage.updateIntegrationConfig(id, updateData);
    return this.sanitizeConfig(config);
  }

  async deleteIntegration(id: string): Promise<void> {
    await storage.deleteIntegrationConfig(id);
  }

  async testConnection(id: string): Promise<IntegrationTestResult> {
    const config = await storage.getIntegrationConfig(id);
    if (!config) {
      return {
        success: false,
        message: 'Integration not found'
      };
    }

    const startTime = Date.now();
    
    try {
      const connector = await this.getConnector(config);
      const result = await connector.testConnection();
      
      const responseTime = Date.now() - startTime;
      
      await storage.updateIntegrationTestResult(
        id,
        result.message,
        result.success
      );
      
      return {
        ...result,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await storage.updateIntegrationTestResult(
        id,
        errorMessage,
        false
      );
      
      return {
        success: false,
        message: errorMessage,
        responseTime
      };
    }
  }

  async getHealthStatus(id: string): Promise<IntegrationHealthStatus> {
    const config = await storage.getIntegrationConfig(id);
    if (!config) {
      return {
        healthy: false,
        lastChecked: new Date(),
        message: 'Integration not found'
      };
    }

    const testResult = await this.testConnection(id);
    
    return {
      healthy: testResult.success && config.status === 'active',
      lastChecked: new Date(),
      message: testResult.message,
      responseTime: testResult.responseTime
    };
  }

  async getDecryptedApiKey(id: string): Promise<string | null> {
    const config = await storage.getIntegrationConfig(id);
    if (!config || !config.apiKey) {
      return null;
    }
    
    if (config.isEncrypted) {
      return await decryptApiKey(config.apiKey);
    }
    
    return config.apiKey;
  }

  async getDecryptedApiSecret(id: string): Promise<string | null> {
    const config = await storage.getIntegrationConfig(id);
    if (!config || !config.apiSecret) {
      return null;
    }
    
    if (config.isEncrypted) {
      return await decryptApiKey(config.apiSecret);
    }
    
    return config.apiSecret;
  }

  private sanitizeConfig(config: IntegrationConfig): IntegrationConfig {
    return {
      ...config,
      apiKey: config.apiKey ? maskApiKey(config.apiKey) : null,
      apiSecret: config.apiSecret ? maskApiKey(config.apiSecret) : null,
    };
  }

  private async getConnector(config: IntegrationConfig): Promise<any> {
    const apiKey = config.apiKey && config.isEncrypted 
      ? await decryptApiKey(config.apiKey)
      : config.apiKey;
    
    const apiSecret = config.apiSecret && config.isEncrypted
      ? await decryptApiKey(config.apiSecret)
      : config.apiSecret;

    switch (config.name) {
      case 'apollo':
        const { ApolloConnector } = await import('./connectors/apollo');
        return new ApolloConnector({ apiKey, config: config.config });
      
      case 'google_maps':
        const { GoogleMapsConnector } = await import('./connectors/google-maps');
        return new GoogleMapsConnector({ apiKey, config: config.config });
      
      case 'foursquare':
        const { FoursquareConnector } = await import('./connectors/foursquare');
        return new FoursquareConnector({ apiKey, config: config.config });
      
      case 'notte':
        const { NotteConnector } = await import('./connectors/notte');
        return new NotteConnector({ apiKey, apiSecret, config: config.config });
      
      default:
        throw new Error(`Unknown integration: ${config.name}`);
    }
  }
}

export const integrationService = new IntegrationService();
