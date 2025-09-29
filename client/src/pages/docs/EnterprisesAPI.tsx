import APIEndpoint from '@/components/docs/APIEndpoint';
import TableOfContents from '@/components/docs/TableOfContents';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Building2, Shield, Info } from 'lucide-react';

export default function EnterprisesAPI() {
  // Common parameter definitions
  const idParameter = {
    name: 'id',
    type: 'string',
    required: true,
    description: 'The unique identifier of the enterprise',
    example: 'ent_123abc456def789',
  };

  const limitParameter = {
    name: 'limit',
    type: 'integer',
    required: false,
    description: 'Number of enterprises to return (1-100)',
    default: '50',
    example: '20',
  };

  const offsetParameter = {
    name: 'offset',
    type: 'integer',
    required: false,
    description: 'Number of enterprises to skip for pagination',
    default: '0',
    example: '20',
  };

  const categoryParameter = {
    name: 'category',
    type: 'string',
    required: false,
    description: 'Filter enterprises by category',
    enum: ['land_projects', 'capital_sources', 'open_source_tools', 'network_organizers'],
    example: 'land_projects',
  };

  const searchParameter = {
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search enterprises by name, description, or tags',
    example: 'solar renewable energy',
  };

  // Enterprise body parameters for create/update
  const enterpriseBodyParams = [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'The name of the enterprise',
      example: 'Solar Solutions Inc',
    },
    {
      name: 'description',
      type: 'string',
      required: false,
      description: 'Detailed description of the enterprise',
      example: 'Leading provider of renewable energy solutions for sustainable communities',
    },
    {
      name: 'category',
      type: 'string',
      required: true,
      description: 'The category of the enterprise',
      enum: ['land_projects', 'capital_sources', 'open_source_tools', 'network_organizers'],
      example: 'land_projects',
    },
    {
      name: 'location',
      type: 'string',
      required: false,
      description: 'Geographic location of the enterprise',
      example: 'California, USA',
    },
    {
      name: 'website',
      type: 'string',
      required: false,
      description: 'Website URL of the enterprise',
      example: 'https://solarsolutions.example.com',
    },
    {
      name: 'contactEmail',
      type: 'string',
      required: false,
      description: 'Primary contact email for the enterprise',
      example: 'info@solarsolutions.example.com',
    },
    {
      name: 'tags',
      type: 'array',
      required: false,
      description: 'Array of tags describing the enterprise',
      example: '["solar", "renewable-energy", "sustainability"]',
    },
  ];

  // Code examples
  const listExamples = [
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Fetch enterprises with filtering
const response = await fetch('/api/enterprises?' + new URLSearchParams({
  category: 'land_projects',
  search: 'solar',
  limit: '10'
}));

const enterprises = await response.json();
console.log(\`Found \${enterprises.length} enterprises\`);`,
    },
    {
      language: 'python',
      label: 'Python',
      code: `import requests

# Fetch enterprises with filtering
params = {
    'category': 'land_projects',
    'search': 'solar',
    'limit': 10
}

response = requests.get('/api/enterprises', params=params)
enterprises = response.json()
print(f"Found {len(enterprises)} enterprises")`,
    },
    {
      language: 'curl',
      label: 'cURL',
      code: `curl -X GET "/api/enterprises?category=land_projects&search=solar&limit=10" \\
  -H "Content-Type: application/json"`,
    },
  ];

  const getExamples = [
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Get specific enterprise by ID
const response = await fetch('/api/enterprises/ent_123abc456def789');
const enterprise = await response.json();

console.log(\`Enterprise: \${enterprise.name}\`);
console.log(\`Category: \${enterprise.category}\`);`,
    },
    {
      language: 'python',
      label: 'Python',
      code: `import requests

# Get specific enterprise by ID
response = requests.get('/api/enterprises/ent_123abc456def789')
enterprise = response.json()

print(f"Enterprise: {enterprise['name']}")
print(f"Category: {enterprise['category']}")`,
    },
    {
      language: 'curl',
      label: 'cURL',
      code: `curl -X GET "/api/enterprises/ent_123abc456def789" \\
  -H "Content-Type: application/json"`,
    },
  ];

  const createExamples = [
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Create new enterprise (authenticated request)
const newEnterprise = {
  name: "Green Energy Solutions",
  description: "Innovative solar and wind energy solutions",
  category: "land_projects",
  location: "Austin, Texas",
  website: "https://greenenergy.example.com",
  contactEmail: "contact@greenenergy.example.com",
  tags: ["solar", "wind", "renewable", "clean-energy"]
};

const response = await fetch('/api/crm/enterprises', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newEnterprise)
});

const enterprise = await response.json();
console.log(\`Created enterprise: \${enterprise.id}\`);`,
    },
    {
      language: 'python',
      label: 'Python',
      code: `import requests
import json

# Create new enterprise (authenticated request)
new_enterprise = {
    "name": "Green Energy Solutions",
    "description": "Innovative solar and wind energy solutions",
    "category": "land_projects",
    "location": "Austin, Texas",
    "website": "https://greenenergy.example.com",
    "contactEmail": "contact@greenenergy.example.com",
    "tags": ["solar", "wind", "renewable", "clean-energy"]
}

response = requests.post('/api/crm/enterprises', 
                        json=new_enterprise)
enterprise = response.json()
print(f"Created enterprise: {enterprise['id']}")`,
    },
    {
      language: 'curl',
      label: 'cURL',
      code: `curl -X POST "/api/crm/enterprises" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Green Energy Solutions",
    "description": "Innovative solar and wind energy solutions",
    "category": "land_projects",
    "location": "Austin, Texas",
    "website": "https://greenenergy.example.com",
    "contactEmail": "contact@greenenergy.example.com",
    "tags": ["solar", "wind", "renewable", "clean-energy"]
  }'`,
    },
  ];

  // Response examples
  const enterpriseResponse = {
    id: "ent_123abc456def789",
    name: "Solar Solutions Inc",
    description: "Leading provider of renewable energy solutions for sustainable communities",
    category: "land_projects",
    location: "California, USA",
    website: "https://solarsolutions.example.com",
    imageUrl: null,
    isVerified: true,
    followerCount: 245,
    tags: ["solar", "renewable-energy", "sustainability"],
    contactEmail: "info@solarsolutions.example.com",
    sourceUrl: null,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-03-10T14:22:00Z"
  };

  const responses = [
    {
      status: 200,
      description: "Success",
      example: enterpriseResponse,
    },
    {
      status: 404,
      description: "Enterprise not found",
      example: {
        message: "Enterprise not found",
        statusCode: 404
      },
    },
  ];

  const createResponses = [
    {
      status: 201,
      description: "Enterprise created successfully",
      example: enterpriseResponse,
    },
    {
      status: 400,
      description: "Validation error",
      example: {
        message: "Validation error",
        error: "Field 'name' is required",
        statusCode: 400
      },
    },
    {
      status: 401,
      description: "Authentication required",
      example: {
        message: "Authentication required",
        statusCode: 401
      },
    },
  ];

  const listResponses = [
    {
      status: 200,
      description: "List of enterprises",
      example: [enterpriseResponse],
    },
  ];

  return (
    <div className="max-w-4xl relative" data-testid="enterprises-api-page">
      {/* Table of Contents - positioned absolutely on larger screens */}
      <div className="hidden xl:block fixed right-8 top-1/2 transform -translate-y-1/2 w-64">
        <TableOfContents />
      </div>

      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Enterprises API</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-6">
          Manage the enterprise directory with full CRUD operations. Access public listings or manage enterprises with proper authentication.
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <Badge variant="secondary">8 endpoints</Badge>
          <Badge variant="secondary">Public & Private</Badge>
          <Badge variant="secondary">Categorized</Badge>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Public access:</strong> Anyone can read enterprise listings. 
            <strong>Authentication required:</strong> Creating, updating, or deleting enterprises requires proper authentication and permissions.
          </AlertDescription>
        </Alert>
      </div>

      {/* Enterprise Categories */}
      <section className="mb-12">
        <h2 id="categories" className="text-2xl font-semibold mb-4">Enterprise Categories</h2>
        <p className="text-muted-foreground mb-6">
          Enterprises are organized into four main categories:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Land Projects</h4>
            <p className="text-sm text-muted-foreground">Regenerative agriculture, conservation projects, and land restoration initiatives.</p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Capital Sources</h4>
            <p className="text-sm text-muted-foreground">Investment firms, funding organizations, and financial institutions focused on sustainability.</p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Open Source Tools</h4>
            <p className="text-sm text-muted-foreground">Technology platforms, software tools, and open-source projects supporting environmental initiatives.</p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Network Organizers</h4>
            <p className="text-sm text-muted-foreground">Communities, organizations, and networks coordinating sustainability efforts.</p>
          </div>
        </div>
      </section>

      {/* Public Endpoints */}
      <section className="mb-16">
        <h2 id="public-endpoints" className="text-2xl font-semibold mb-6">Public Endpoints</h2>
        <p className="text-muted-foreground mb-8">
          These endpoints are publicly accessible and don't require authentication:
        </p>

        <APIEndpoint
          method="GET"
          path="/api/enterprises"
          title="List Enterprises"
          description="Retrieve a paginated list of enterprises with optional filtering by category and search terms."
          queryParameters={[limitParameter, offsetParameter, categoryParameter, searchParameter]}
          examples={listExamples}
          responses={listResponses}
          className="mb-12"
        />

        <APIEndpoint
          method="GET"
          path="/api/enterprises/:id"
          title="Get Enterprise by ID"
          description="Retrieve detailed information about a specific enterprise by its unique identifier."
          parameters={[idParameter]}
          examples={getExamples}
          responses={responses}
          className="mb-12"
        />

        <APIEndpoint
          method="GET"
          path="/api/enterprises/:id/contacts"
          title="Get Enterprise Contacts"
          description="Retrieve contact information for people associated with a specific enterprise."
          parameters={[idParameter]}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `// Get contacts for an enterprise
const response = await fetch('/api/enterprises/ent_123abc456def789/contacts');
const contacts = await response.json();

console.log(\`Found \${contacts.length} contacts\`);`,
            },
          ]}
          responses={[
            {
              status: 200,
              description: "List of contacts for the enterprise",
              example: [
                {
                  id: "person_123",
                  firstName: "John",
                  lastName: "Doe",
                  email: "john@solarsolutions.example.com",
                  title: "CEO",
                  phone: "+1-555-0123"
                }
              ],
            },
          ]}
        />
      </section>

      {/* Protected Endpoints */}
      <section className="mb-16">
        <h2 id="protected-endpoints" className="text-2xl font-semibold mb-6">Protected Endpoints</h2>
        <p className="text-muted-foreground mb-8">
          These endpoints require authentication and appropriate permissions:
        </p>

        <Alert className="mb-8">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Role Requirements:</strong> Creating and managing enterprises requires 'enterprise_owner' or 'admin' role.
          </AlertDescription>
        </Alert>

        <APIEndpoint
          method="POST"
          path="/api/crm/enterprises"
          title="Create Enterprise"
          description="Create a new enterprise in the directory. Requires authentication and appropriate permissions."
          bodyParameters={enterpriseBodyParams}
          examples={createExamples}
          responses={createResponses}
          requiresAuth={true}
          roles={['enterprise_owner', 'admin']}
          className="mb-12"
        />

        <APIEndpoint
          method="PUT"
          path="/api/crm/enterprises/:id"
          title="Update Enterprise"
          description="Update an existing enterprise's information. Only the enterprise owner or admin can modify enterprise details."
          parameters={[idParameter]}
          bodyParameters={enterpriseBodyParams.map(param => ({ ...param, required: false }))}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `// Update enterprise information
const updates = {
  description: "Updated description for our renewable energy solutions",
  location: "San Francisco, California",
  tags: ["solar", "wind", "renewable", "innovation"]
};

const response = await fetch('/api/crm/enterprises/ent_123abc456def789', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updates)
});

const updatedEnterprise = await response.json();
console.log('Enterprise updated:', updatedEnterprise.name);`,
            },
          ]}
          responses={[
            {
              status: 200,
              description: "Enterprise updated successfully",
              example: enterpriseResponse,
            },
            {
              status: 404,
              description: "Enterprise not found",
              example: {
                message: "Enterprise not found",
                statusCode: 404
              },
            },
          ]}
          requiresAuth={true}
          roles={['enterprise_owner', 'admin']}
          className="mb-12"
        />

        <APIEndpoint
          method="DELETE"
          path="/api/crm/enterprises/:id"
          title="Delete Enterprise"
          description="Permanently delete an enterprise from the directory. This action cannot be undone and requires admin privileges."
          parameters={[idParameter]}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `// Delete enterprise (admin only)
const response = await fetch('/api/crm/enterprises/ent_123abc456def789', {
  method: 'DELETE'
});

if (response.ok) {
  console.log('Enterprise deleted successfully');
} else {
  console.error('Failed to delete enterprise');
}`,
            },
          ]}
          responses={[
            {
              status: 204,
              description: "Enterprise deleted successfully",
              example: {},
            },
            {
              status: 404,
              description: "Enterprise not found",
              example: {
                message: "Enterprise not found",
                statusCode: 404
              },
            },
          ]}
          requiresAuth={true}
          roles={['admin']}
        />
      </section>

      {/* Enterprise Schema */}
      <section className="mb-12">
        <h2 id="schema" className="text-2xl font-semibold mb-6">Enterprise Schema</h2>
        <p className="text-muted-foreground mb-6">
          The complete data structure for enterprise objects:
        </p>
        <div className="bg-muted/30 border rounded-lg p-6">
          <pre className="text-sm font-mono overflow-x-auto">
            <code className="language-json">
{JSON.stringify({
  id: "string (UUID)",
  name: "string (required)",
  description: "string (optional)",
  category: "string (enum: land_projects, capital_sources, open_source_tools, network_organizers)",
  location: "string (optional)",
  website: "string (URL, optional)",
  imageUrl: "string (URL, optional)",
  isVerified: "boolean (default: false)",
  followerCount: "integer (default: 0)",
  tags: "array of strings (optional)",
  contactEmail: "string (email, optional)",
  sourceUrl: "string (URL, optional - for imported enterprises)",
  createdAt: "string (ISO 8601 timestamp)",
  updatedAt: "string (ISO 8601 timestamp)"
}, null, 2)}
            </code>
          </pre>
        </div>
      </section>
    </div>
  );
}