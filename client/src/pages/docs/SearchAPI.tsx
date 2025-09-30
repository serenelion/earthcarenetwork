import { Search, Shield } from 'lucide-react';
import { Link } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import APIEndpoint from '@/components/docs/APIEndpoint';
import CodeBlock from '@/components/docs/CodeBlock';
import TableOfContents from '@/components/docs/TableOfContents';

export default function SearchAPI() {
  const searchResponse = {
    enterprises: [
      {
        id: "ent_123abc",
        name: "Solar Solutions Inc",
        category: "land_projects",
        description: "Leading provider of renewable energy solutions",
        tags: ["solar", "renewable", "sustainability"]
      }
    ],
    people: [
      {
        id: "person_456def",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        title: "CEO",
        enterpriseId: "ent_123abc"
      }
    ],
    opportunities: [
      {
        id: "opp_789ghi",
        title: "Solar Farm Development",
        status: "qualified",
        value: 50000000,
        enterpriseId: "ent_123abc"
      }
    ],
    tasks: [
      {
        id: "task_012jkl",
        title: "Follow up with solar project",
        status: "pending",
        priority: "high"
      }
    ]
  };

  return (
    <div className="max-w-4xl relative" data-testid="search-api-page">
      <div className="hidden xl:block fixed right-8 top-1/2 transform -translate-y-1/2 w-64">
        <TableOfContents />
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Search API</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-6">
          Powerful global search across all entities. Find enterprises, people, opportunities, and tasks with a single query.
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <Badge variant="secondary">1 endpoint</Badge>
          <Badge variant="secondary">Global Search</Badge>
          <Badge variant="secondary">Multi-Entity</Badge>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Authentication Required:</strong> Search requires authentication to access full results.
          </AlertDescription>
        </Alert>
      </div>

      <section className="mb-12">
        <h2 id="overview" className="text-2xl font-semibold mb-4">Search Overview</h2>
        <p className="text-muted-foreground mb-6">
          The Search API provides unified search across all CRM entities including enterprises, people, opportunities, and tasks. 
          Results are returned in a structured format grouped by entity type.
        </p>

        <div className="bg-muted/30 border rounded-lg p-6">
          <h3 className="font-semibold mb-3">Search Features:</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Search across multiple entity types simultaneously</li>
            <li>Filter results by specific entity types</li>
            <li>Fuzzy matching for better results</li>
            <li>Pagination support for large result sets</li>
            <li>Minimum 2 character query length</li>
          </ul>
        </div>
      </section>

      <section className="mb-16">
        <h2 id="endpoints" className="text-2xl font-semibold mb-6">API Endpoint</h2>

        <APIEndpoint
          method="GET"
          path="/api/search"
          title="Global Search"
          description="Search across enterprises, people, opportunities, and tasks with a single query."
          requiresAuth={true}
          queryParameters={[
            {
              name: 'q',
              type: 'string',
              required: true,
              description: 'Search query (minimum 2 characters)',
              example: 'solar renewable',
            },
            {
              name: 'type',
              type: 'string',
              required: false,
              description: 'Filter by entity types (comma-separated)',
              enum: ['enterprises', 'people', 'opportunities', 'tasks'],
              example: 'enterprises,people',
            },
            {
              name: 'limit',
              type: 'integer',
              required: false,
              description: 'Max results per entity type',
              default: '20',
              example: '10',
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
              code: `// Search across all entities
const response = await fetch('/api/search?' + new URLSearchParams({
  q: 'solar renewable',
  limit: '10'
}), {
  credentials: 'include'
});

const results = await response.json();
console.log(\`Found \${results.enterprises.length} enterprises\`);
console.log(\`Found \${results.people.length} people\`);
console.log(\`Found \${results.opportunities.length} opportunities\`);`,
            },
            {
              language: 'javascript',
              label: 'JavaScript (Filtered)',
              code: `// Search only enterprises and people
const response = await fetch('/api/search?' + new URLSearchParams({
  q: 'John',
  type: 'enterprises,people',
  limit: '5'
}), {
  credentials: 'include'
});

const results = await response.json();
// Results will only contain enterprises and people arrays`,
            },
            {
              language: 'python',
              label: 'Python',
              code: `import requests

# Search across all entities
params = {
    'q': 'solar renewable',
    'limit': 10
}

response = requests.get('/api/search', 
                       params=params,
                       cookies=session_cookies)

results = response.json()
print(f"Found {len(results['enterprises'])} enterprises")
print(f"Found {len(results['people'])} people")`,
            },
            {
              language: 'curl',
              label: 'cURL',
              code: `curl -X GET "/api/search?q=solar+renewable&limit=10" \\
  -H "Content-Type: application/json" \\
  --cookie "session=..."`,
            },
          ]}
          responses={[
            {
              status: 200,
              description: "Search results grouped by entity type",
              example: searchResponse,
            },
            {
              status: 400,
              description: "Invalid query",
              example: {
                message: "Query must be at least 2 characters long"
              },
            },
            {
              status: 401,
              description: "Authentication required",
              example: {
                message: "Not authenticated"
              },
            },
          ]}
        />
      </section>

      <section className="mb-12">
        <h2 id="response-format" className="text-2xl font-semibold mb-6">Response Format</h2>
        <p className="text-muted-foreground mb-6">
          Search results are returned as an object with arrays for each entity type:
        </p>

        <CodeBlock language="typescript" title="TypeScript Interface">
{`interface SearchResponse {
  enterprises: Array<{
    id: string;
    name: string;
    category: string;
    description?: string;
    location?: string;
    tags?: string[];
  }>;
  people: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    title?: string;
    enterpriseId?: string;
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    status: string;
    value?: number;
    enterpriseId: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority?: string;
    dueDate?: string;
  }>;
}`}
        </CodeBlock>
      </section>

      <section className="mb-12">
        <h2 id="search-tips" className="text-2xl font-semibold mb-6">Search Tips</h2>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Multi-word Queries</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Use spaces to search for multiple terms. The API will match records containing any of the terms.
            </p>
            <CodeBlock language="text">
{`?q=solar renewable energy`}
            </CodeBlock>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Entity Type Filtering</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Narrow results to specific entity types for faster, more relevant searches.
            </p>
            <CodeBlock language="text">
{`?q=john&type=people,enterprises`}
            </CodeBlock>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Pagination</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Use limit and offset for large result sets.
            </p>
            <CodeBlock language="text">
{`?q=project&limit=20&offset=40  # Get results 41-60`}
            </CodeBlock>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 id="use-cases" className="text-2xl font-semibold mb-6">Common Use Cases</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Autocomplete Search</h3>
            <CodeBlock language="javascript">
{`// Implement real-time search as user types
const searchInput = document.getElementById('search');
let debounceTimer;

searchInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  
  const query = e.target.value.trim();
  if (query.length < 2) return;
  
  debounceTimer = setTimeout(async () => {
    const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&limit=5\`, {
      credentials: 'include'
    });
    const results = await response.json();
    
    // Display results in dropdown
    displaySearchResults(results);
  }, 300); // Debounce for 300ms
});`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Find Related Records</h3>
            <CodeBlock language="javascript">
{`// Search for all records related to a company
const companyName = "Solar Solutions Inc";
const response = await fetch(\`/api/search?q=\${encodeURIComponent(companyName)}\`, {
  credentials: 'include'
});

const results = await response.json();

// Find the enterprise
const enterprise = results.enterprises[0];

// Find all people at that enterprise
const people = results.people.filter(p => p.enterpriseId === enterprise.id);

// Find all opportunities for that enterprise
const opportunities = results.opportunities.filter(o => o.enterpriseId === enterprise.id);`}
            </CodeBlock>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
        <div className="flex gap-3">
          <Link href="/docs/api/ai-copilot">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" data-testid="link-ai-copilot">
              AI Copilot API
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
