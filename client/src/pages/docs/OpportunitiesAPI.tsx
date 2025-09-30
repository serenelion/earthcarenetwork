import { Target, Shield, Download } from 'lucide-react';
import { Link } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import APIEndpoint from '@/components/docs/APIEndpoint';
import TableOfContents from '@/components/docs/TableOfContents';

export default function OpportunitiesAPI() {
  const opportunityBodyParams = [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: 'Title of the opportunity',
      example: 'Solar Farm Development Project',
    },
    {
      name: 'enterpriseId',
      type: 'string',
      required: true,
      description: 'Associated enterprise ID',
      example: 'ent_123abc',
    },
    {
      name: 'primaryContactId',
      type: 'string',
      required: false,
      description: 'Primary contact person ID',
      example: 'person_456def',
    },
    {
      name: 'value',
      type: 'integer',
      required: false,
      description: 'Deal value in cents',
      example: '50000000',
    },
    {
      name: 'status',
      type: 'string',
      required: false,
      description: 'Current status',
      enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
      example: 'qualified',
    },
    {
      name: 'probability',
      type: 'integer',
      required: false,
      description: 'Win probability (0-100)',
      example: '75',
    },
    {
      name: 'expectedCloseDate',
      type: 'string',
      required: false,
      description: 'Expected close date (ISO 8601)',
      example: '2024-12-31',
    },
    {
      name: 'description',
      type: 'string',
      required: false,
      description: 'Detailed description',
      example: '500MW solar farm installation with battery storage',
    },
    {
      name: 'notes',
      type: 'string',
      required: false,
      description: 'Internal notes',
      example: 'Requires approval from board before Q4',
    },
  ];

  const opportunityResponse = {
    id: "opp_123abc456def789",
    title: "Solar Farm Development Project",
    enterpriseId: "ent_123abc",
    primaryContactId: "person_456def",
    value: 50000000,
    status: "qualified",
    probability: 75,
    expectedCloseDate: "2024-12-31",
    description: "500MW solar farm installation with battery storage",
    notes: "Requires approval from board before Q4",
    leadScore: 85,
    leadScoreFactors: ["High engagement", "Budget confirmed", "Timeline aligned"],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-03-10T14:22:00Z"
  };

  return (
    <div className="max-w-4xl relative" data-testid="opportunities-api-page">
      <div className="hidden xl:block fixed right-8 top-1/2 transform -translate-y-1/2 w-64">
        <TableOfContents />
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Opportunities API</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-6">
          Track leads, manage sales pipeline, and close deals. Complete opportunity management with AI-powered lead scoring.
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <Badge variant="secondary">7 endpoints</Badge>
          <Badge variant="secondary">Pipeline Tracking</Badge>
          <Badge variant="secondary">AI Lead Scoring</Badge>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Authentication Required:</strong> All opportunities endpoints require 'enterprise_owner' or 'admin' role.
          </AlertDescription>
        </Alert>
      </div>

      <section className="mb-16">
        <h2 id="endpoints" className="text-2xl font-semibold mb-6">API Endpoints</h2>

        <APIEndpoint
          method="GET"
          path="/api/crm/opportunities"
          title="List Opportunities"
          description="Retrieve all opportunities with optional filtering."
          requiresAuth={true}
          roles={['enterprise_owner', 'admin']}
          queryParameters={[
            { name: 'search', type: 'string', required: false, description: 'Search by title', example: 'solar' },
            { name: 'limit', type: 'integer', required: false, description: 'Results limit', default: '50', example: '20' },
            { name: 'offset', type: 'integer', required: false, description: 'Pagination offset', default: '0', example: '0' },
          ]}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const response = await fetch('/api/crm/opportunities?limit=10', {
  credentials: 'include'
});

const opportunities = await response.json();
console.log(\`Found \${opportunities.length} opportunities\`);`,
            },
          ]}
          responses={[
            {
              status: 200,
              description: "List of opportunities",
              example: [opportunityResponse],
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="POST"
          path="/api/crm/opportunities"
          title="Create Opportunity"
          description="Create a new opportunity in your sales pipeline."
          requiresAuth={true}
          roles={['enterprise_owner', 'admin']}
          bodyParameters={opportunityBodyParams}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const newOpportunity = {
  title: "Wind Energy Project - Phase 2",
  enterpriseId: "ent_123abc",
  primaryContactId: "person_456def",
  value: 75000000, // $750,000 in cents
  status: "proposal",
  probability: 60,
  expectedCloseDate: "2024-10-15",
  description: "200MW wind farm expansion"
};

const response = await fetch('/api/crm/opportunities', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newOpportunity)
});

const opportunity = await response.json();
console.log('Created opportunity:', opportunity.id);`,
            },
          ]}
          responses={[
            {
              status: 201,
              description: "Opportunity created successfully",
              example: opportunityResponse,
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="PUT"
          path="/api/crm/opportunities/:id"
          title="Update Opportunity"
          description="Update an existing opportunity's details."
          requiresAuth={true}
          roles={['enterprise_owner', 'admin']}
          parameters={[
            { name: 'id', type: 'string', required: true, description: 'Opportunity ID', example: 'opp_123abc456def789' }
          ]}
          bodyParameters={opportunityBodyParams.map(p => ({ ...p, required: false }))}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const updates = {
  status: "negotiation",
  probability: 85,
  notes: "Verbal commitment received. Finalizing contracts."
};

const response = await fetch('/api/crm/opportunities/opp_123abc456def789', {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updates)
});

const updated = await response.json();`,
            },
          ]}
          responses={[
            {
              status: 200,
              description: "Opportunity updated successfully",
              example: opportunityResponse,
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="DELETE"
          path="/api/crm/opportunities/:id"
          title="Delete Opportunity"
          description="Permanently delete an opportunity."
          requiresAuth={true}
          roles={['enterprise_owner', 'admin']}
          parameters={[
            { name: 'id', type: 'string', required: true, description: 'Opportunity ID', example: 'opp_123abc456def789' }
          ]}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const response = await fetch('/api/crm/opportunities/opp_123abc456def789', {
  method: 'DELETE',
  credentials: 'include'
});

if (response.ok) {
  console.log('Opportunity deleted');
}`,
            },
          ]}
          responses={[
            {
              status: 204,
              description: "Opportunity deleted successfully",
              example: {},
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="GET"
          path="/api/crm/opportunities/export"
          title="Export Opportunities"
          description="Export all opportunities as CSV with enterprise and contact details."
          requiresAuth={true}
          roles={['enterprise_owner', 'admin']}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `// Trigger CSV download
const response = await fetch('/api/crm/opportunities/export', {
  credentials: 'include'
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'opportunities-export.csv';
a.click();`,
            },
          ]}
          responses={[
            {
              status: 200,
              description: "CSV file download",
              example: "Content-Type: text/csv...",
            },
          ]}
        />
      </section>

      <section className="mb-12">
        <h2 id="schema" className="text-2xl font-semibold mb-6">Opportunity Schema</h2>
        <div className="bg-muted/30 border rounded-lg p-6">
          <pre className="text-sm font-mono overflow-x-auto">
            <code className="language-json">
{JSON.stringify({
  id: "string (UUID)",
  title: "string (required)",
  enterpriseId: "string (required)",
  primaryContactId: "string (optional)",
  value: "integer (cents, optional)",
  status: "enum: lead | qualified | proposal | negotiation | closed_won | closed_lost",
  probability: "integer 0-100 (optional)",
  expectedCloseDate: "string ISO 8601 (optional)",
  description: "string (optional)",
  notes: "string (optional)",
  leadScore: "integer 0-100 (AI generated)",
  leadScoreFactors: "array of strings",
  createdAt: "string (ISO 8601)",
  updatedAt: "string (ISO 8601)"
}, null, 2)}
            </code>
          </pre>
        </div>
      </section>

      <section className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
        <div className="flex gap-3">
          <Link href="/docs/api/ai-copilot">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" data-testid="link-ai-copilot">
              AI Lead Scoring
            </button>
          </Link>
          <Link href="/docs/examples">
            <button className="px-4 py-2 border rounded-md hover:bg-muted" data-testid="link-examples">
              Code Examples
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
