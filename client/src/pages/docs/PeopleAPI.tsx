import { Users, Shield, Info } from 'lucide-react';
import { Link } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import APIEndpoint from '@/components/docs/APIEndpoint';
import TableOfContents from '@/components/docs/TableOfContents';

export default function PeopleAPI() {
  const idParameter = {
    name: 'id',
    type: 'string',
    required: true,
    description: 'The unique identifier of the person',
    example: 'person_123abc456def789',
  };

  const personBodyParams = [
    {
      name: 'firstName',
      type: 'string',
      required: true,
      description: 'First name of the person',
      example: 'John',
    },
    {
      name: 'lastName',
      type: 'string',
      required: true,
      description: 'Last name of the person',
      example: 'Doe',
    },
    {
      name: 'email',
      type: 'string',
      required: false,
      description: 'Email address',
      example: 'john.doe@example.com',
    },
    {
      name: 'phone',
      type: 'string',
      required: false,
      description: 'Phone number',
      example: '+1-555-0123',
    },
    {
      name: 'title',
      type: 'string',
      required: false,
      description: 'Job title',
      example: 'CEO',
    },
    {
      name: 'enterpriseId',
      type: 'string',
      required: false,
      description: 'Associated enterprise ID',
      example: 'ent_123abc',
    },
    {
      name: 'linkedinUrl',
      type: 'string',
      required: false,
      description: 'LinkedIn profile URL',
      example: 'https://linkedin.com/in/johndoe',
    },
    {
      name: 'notes',
      type: 'string',
      required: false,
      description: 'Internal notes',
      example: 'Met at sustainability conference 2024',
    },
  ];

  const personResponse = {
    id: "person_123abc456def789",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1-555-0123",
    title: "CEO",
    enterpriseId: "ent_123abc",
    linkedinUrl: "https://linkedin.com/in/johndoe",
    notes: "Met at sustainability conference 2024",
    invitationStatus: "signed_up",
    claimStatus: "unclaimed",
    buildProStatus: "not_offered",
    supportStatus: "no_inquiry",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-03-10T14:22:00Z"
  };

  return (
    <div className="max-w-4xl relative" data-testid="people-api-page">
      <div className="hidden xl:block fixed right-8 top-1/2 transform -translate-y-1/2 w-64">
        <TableOfContents />
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">People API</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-6">
          Manage contacts, relationships, and communication tracking. Build comprehensive contact databases with detailed profiles and enterprise associations.
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <Badge variant="secondary">6 endpoints</Badge>
          <Badge variant="secondary">CRM Feature</Badge>
          <Badge variant="secondary">Enterprise Links</Badge>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Authentication Required:</strong> All people management endpoints require authentication. Most operations require 'enterprise_owner' or 'admin' role.
          </AlertDescription>
        </Alert>
      </div>

      <section className="mb-12">
        <h2 id="overview" className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-6">
          The People API allows you to manage contacts in your CRM. Track relationships, communication history, and organize contacts by their associated enterprises.
        </p>
      </section>

      <section className="mb-16">
        <h2 id="endpoints" className="text-2xl font-semibold mb-6">API Endpoints</h2>

        <APIEndpoint
          method="GET"
          path="/api/crm/people"
          title="List People"
          description="Retrieve a paginated list of contacts with optional search filtering."
          requiresAuth={true}
          queryParameters={[
            {
              name: 'search',
              type: 'string',
              required: false,
              description: 'Search by name or email',
              example: 'john',
            },
            {
              name: 'limit',
              type: 'integer',
              required: false,
              description: 'Number of results (1-100)',
              default: '50',
              example: '20',
            },
            {
              name: 'offset',
              type: 'integer',
              required: false,
              description: 'Pagination offset',
              default: '0',
              example: '0',
            },
          ]}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const response = await fetch('/api/crm/people?' + new URLSearchParams({
  search: 'john',
  limit: '10'
}), {
  credentials: 'include'
});

const people = await response.json();
console.log(\`Found \${people.length} contacts\`);`,
            },
          ]}
          responses={[
            {
              status: 200,
              description: "List of people",
              example: [personResponse],
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="POST"
          path="/api/crm/people"
          title="Create Person"
          description="Create a new contact in your CRM."
          requiresAuth={true}
          bodyParameters={personBodyParams}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const newPerson = {
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@example.com",
  phone: "+1-555-0456",
  title: "Sustainability Director",
  enterpriseId: "ent_123abc",
  notes: "Key decision maker for renewable projects"
};

const response = await fetch('/api/crm/people', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newPerson)
});

const person = await response.json();
console.log('Created person:', person.id);`,
            },
          ]}
          responses={[
            {
              status: 201,
              description: "Person created successfully",
              example: personResponse,
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="PUT"
          path="/api/crm/people/:id"
          title="Update Person"
          description="Update an existing contact's information."
          requiresAuth={true}
          parameters={[idParameter]}
          bodyParameters={personBodyParams.map(p => ({ ...p, required: false }))}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const updates = {
  title: "Chief Sustainability Officer",
  phone: "+1-555-9999",
  notes: "Promoted to CSO. Primary contact for all initiatives."
};

const response = await fetch('/api/crm/people/person_123abc456def789', {
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
              description: "Person updated successfully",
              example: personResponse,
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="DELETE"
          path="/api/crm/people/:id"
          title="Delete Person"
          description="Permanently delete a contact from your CRM."
          requiresAuth={true}
          parameters={[idParameter]}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const response = await fetch('/api/crm/people/person_123abc456def789', {
  method: 'DELETE',
  credentials: 'include'
});

if (response.ok) {
  console.log('Person deleted successfully');
}`,
            },
          ]}
          responses={[
            {
              status: 204,
              description: "Person deleted successfully",
              example: {},
            },
          ]}
        />
      </section>

      <section className="mb-12">
        <h2 id="schema" className="text-2xl font-semibold mb-6">Person Schema</h2>
        <div className="bg-muted/30 border rounded-lg p-6">
          <pre className="text-sm font-mono overflow-x-auto">
            <code className="language-json">
{JSON.stringify({
  id: "string (UUID)",
  firstName: "string (required)",
  lastName: "string (required)",
  email: "string (optional)",
  phone: "string (optional)",
  title: "string (optional)",
  enterpriseId: "string (optional)",
  linkedinUrl: "string (optional)",
  notes: "string (optional)",
  invitationStatus: "enum: not_invited | invited | signed_up | active",
  claimStatus: "enum: unclaimed | claimed | verified",
  buildProStatus: "enum: not_offered | offered | trial | subscribed | cancelled",
  supportStatus: "enum: no_inquiry | inquiry_sent | in_progress | resolved",
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
          <Link href="/docs/api/opportunities">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" data-testid="link-opportunities-api">
              Opportunities API
            </button>
          </Link>
          <Link href="/docs/api/tasks">
            <button className="px-4 py-2 border rounded-md hover:bg-muted" data-testid="link-tasks-api">
              Tasks API
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
