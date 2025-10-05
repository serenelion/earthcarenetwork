import type { ProviderConfig } from "../manager";

export class PipedriveClient {
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async searchDeals(query: string): Promise<any[]> {
    if (!this.config.apiKey) {
      return this.getMockDeals(query);
    }

    try {
      const params = new URLSearchParams({
        term: query,
        api_token: this.config.apiKey
      });

      const response = await fetch(
        `${this.config.baseUrl}/deals/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Pipedrive API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.items || [];
    } catch (error) {
      console.error('Pipedrive searchDeals error:', error);
      return this.getMockDeals(query);
    }
  }

  async searchPersons(query: string): Promise<any[]> {
    if (!this.config.apiKey) {
      return this.getMockPersons(query);
    }

    try {
      const params = new URLSearchParams({
        term: query,
        api_token: this.config.apiKey
      });

      const response = await fetch(
        `${this.config.baseUrl}/persons/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Pipedrive API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.items || [];
    } catch (error) {
      console.error('Pipedrive searchPersons error:', error);
      return this.getMockPersons(query);
    }
  }

  async createDeal(dealData: any): Promise<any> {
    if (!this.config.apiKey) {
      return this.getMockDeal();
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/deals?api_token=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dealData)
        }
      );

      if (!response.ok) {
        throw new Error(`Pipedrive API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Pipedrive createDeal error:', error);
      return this.getMockDeal();
    }
  }

  private getMockDeals(query: string): any[] {
    return [
      {
        item: {
          id: 1,
          title: 'Solar Panel Installation - Community Center',
          value: 45000,
          currency: 'USD',
          status: 'open',
          org_name: 'Bright Future Solar',
          person_name: 'Emma Watson',
          email: 'emma@brightfuturesolar.example.com',
          phone: '+1-555-0400'
        }
      },
      {
        item: {
          id: 2,
          title: 'Regenerative Farm Consulting',
          value: 15000,
          currency: 'USD',
          status: 'open',
          org_name: 'Living Soil Consulting',
          person_name: 'James Green',
          email: 'james@livingsoil.example.com',
          phone: '+1-555-0401'
        }
      }
    ];
  }

  private getMockPersons(query: string): any[] {
    return [
      {
        item: {
          id: 101,
          name: 'Emma Watson',
          email: [{ value: 'emma@brightfuturesolar.example.com', primary: true }],
          phone: [{ value: '+1-555-0400', primary: true }],
          organization: {
            id: 201,
            name: 'Bright Future Solar'
          }
        }
      },
      {
        item: {
          id: 102,
          name: 'James Green',
          email: [{ value: 'james@livingsoil.example.com', primary: true }],
          phone: [{ value: '+1-555-0401', primary: true }],
          organization: {
            id: 202,
            name: 'Living Soil Consulting'
          }
        }
      }
    ];
  }

  private getMockDeal(): any {
    return {
      id: 999,
      title: 'New Deal',
      value: 0,
      currency: 'USD',
      status: 'open',
      add_time: new Date().toISOString()
    };
  }
}
