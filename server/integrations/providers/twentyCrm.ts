import type { ProviderConfig } from "../manager";

export class TwentyCrmClient {
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async fetchCompanies(filters?: any): Promise<any[]> {
    if (!this.config.apiKey) {
      return this.getMockCompanies();
    }

    try {
      const query = `
        query Companies($filter: CompanyFilterInput) {
          companies(filter: $filter) {
            edges {
              node {
                id
                name
                domainName
                address
                employees
                idealCustomerProfile
                createdAt
              }
            }
          }
        }
      `;

      const response = await fetch(this.config.baseUrl || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          query,
          variables: { filter: filters || {} }
        })
      });

      if (!response.ok) {
        throw new Error(`Twenty CRM API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.companies?.edges?.map((edge: any) => edge.node) || [];
    } catch (error) {
      console.error('Twenty CRM fetchCompanies error:', error);
      return this.getMockCompanies();
    }
  }

  async fetchPeople(filters?: any): Promise<any[]> {
    if (!this.config.apiKey) {
      return this.getMockPeople();
    }

    try {
      const query = `
        query People($filter: PersonFilterInput) {
          people(filter: $filter) {
            edges {
              node {
                id
                firstName
                lastName
                email
                phone
                city
                company {
                  id
                  name
                  domainName
                }
                createdAt
              }
            }
          }
        }
      `;

      const response = await fetch(this.config.baseUrl || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          query,
          variables: { filter: filters || {} }
        })
      });

      if (!response.ok) {
        throw new Error(`Twenty CRM API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.people?.edges?.map((edge: any) => edge.node) || [];
    } catch (error) {
      console.error('Twenty CRM fetchPeople error:', error);
      return this.getMockPeople();
    }
  }

  private getMockCompanies(): any[] {
    return [
      {
        id: 'twenty-company-1',
        name: 'EarthWise Technologies',
        domainName: 'earthwise.tech',
        address: '100 Green Street, Seattle, WA 98101',
        employees: 85,
        idealCustomerProfile: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'twenty-company-2',
        name: 'Circular Economy Solutions',
        domainName: 'circulareconomy.co',
        address: '250 Sustainability Blvd, San Francisco, CA 94102',
        employees: 120,
        idealCustomerProfile: true,
        createdAt: new Date().toISOString()
      }
    ];
  }

  private getMockPeople(): any[] {
    return [
      {
        id: 'twenty-person-1',
        firstName: 'Alice',
        lastName: 'Chen',
        email: 'alice@earthwise.tech',
        phone: '+1-555-0500',
        city: 'Seattle',
        company: {
          id: 'twenty-company-1',
          name: 'EarthWise Technologies',
          domainName: 'earthwise.tech'
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'twenty-person-2',
        firstName: 'David',
        lastName: 'Park',
        email: 'david@circulareconomy.co',
        phone: '+1-555-0501',
        city: 'San Francisco',
        company: {
          id: 'twenty-company-2',
          name: 'Circular Economy Solutions',
          domainName: 'circulareconomy.co'
        },
        createdAt: new Date().toISOString()
      }
    ];
  }
}
