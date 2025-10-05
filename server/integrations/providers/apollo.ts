import type { ProviderConfig } from "../manager";

export class ApolloClient {
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async searchContacts(query: string, filters?: any): Promise<any[]> {
    if (!this.config.apiKey) {
      return this.getMockContacts(query);
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/people/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.config.apiKey
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
      console.error('Apollo searchContacts error:', error);
      return this.getMockContacts(query);
    }
  }

  async searchCompanies(query: string, filters?: any): Promise<any[]> {
    if (!this.config.apiKey) {
      return this.getMockCompanies(query);
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/organizations/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.config.apiKey
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
      console.error('Apollo searchCompanies error:', error);
      return this.getMockCompanies(query);
    }
  }

  private getMockContacts(query: string): any[] {
    return [
      {
        id: 'apollo-contact-1',
        first_name: 'Sarah',
        last_name: 'Green',
        email: 'sarah.green@example.com',
        title: 'Sustainability Director',
        organization: {
          name: 'EcoVentures Inc',
          website_url: 'https://ecoventures.example.com'
        },
        city: 'Portland',
        state: 'OR',
        phone: '+1-555-0100'
      },
      {
        id: 'apollo-contact-2',
        first_name: 'Michael',
        last_name: 'Rivers',
        email: 'michael@greentech.example.com',
        title: 'Co-Founder',
        organization: {
          name: 'GreenTech Solutions',
          website_url: 'https://greentech.example.com'
        },
        city: 'Austin',
        state: 'TX',
        phone: '+1-555-0101'
      }
    ];
  }

  private getMockCompanies(query: string): any[] {
    return [
      {
        id: 'apollo-org-1',
        name: 'Regenerative Agriculture Co',
        website_url: 'https://regenag.example.com',
        phone: '+1-555-0200',
        city: 'Boulder',
        state: 'CO',
        country: 'US',
        industry: 'Agriculture',
        estimated_num_employees: 50
      },
      {
        id: 'apollo-org-2',
        name: 'Clean Energy Partners',
        website_url: 'https://cleanenergypartners.example.com',
        phone: '+1-555-0201',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        industry: 'Renewable Energy',
        estimated_num_employees: 120
      }
    ];
  }
}
