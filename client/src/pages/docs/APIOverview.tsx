import { Building2, Users, Target, Search, Shield, Sparkles, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CodeBlock from '@/components/docs/CodeBlock';

export default function APIOverview() {
  const apiSections = [
    {
      title: 'Authentication',
      description: 'Secure authentication using Replit Auth with role-based access control',
      icon: Shield,
      href: '/docs/api/authentication',
      endpoints: [
        'GET /api/auth/user - Get current user',
      ],
      badge: 'Required',
    },
    {
      title: 'Enterprises',
      description: 'Manage enterprise directory, profiles, and metadata',
      icon: Building2,
      href: '/docs/api/enterprises',
      endpoints: [
        'GET /api/enterprises - List enterprises',
        'GET /api/enterprises/:id - Get enterprise',
        'POST /api/crm/enterprises - Create enterprise',
        'PUT /api/crm/enterprises/:id - Update enterprise',
        'DELETE /api/crm/enterprises/:id - Delete enterprise',
      ],
      badge: '8 endpoints',
    },
    {
      title: 'People',
      description: 'Handle contacts, relationships, and communication tracking',
      icon: Users,
      href: '/docs/api/people',
      endpoints: [
        'GET /api/crm/people - List people',
        'POST /api/crm/people - Create person',
        'PUT /api/crm/people/:id - Update person',
        'DELETE /api/crm/people/:id - Delete person',
      ],
      badge: '6 endpoints',
    },
    {
      title: 'Opportunities',
      description: 'Track leads, deals, and sales pipeline management',
      icon: Target,
      href: '/docs/api/opportunities',
      endpoints: [
        'GET /api/crm/opportunities - List opportunities',
        'POST /api/crm/opportunities - Create opportunity',
        'PUT /api/crm/opportunities/:id - Update opportunity',
        'DELETE /api/crm/opportunities/:id - Delete opportunity',
      ],
      badge: '7 endpoints',
    },
    {
      title: 'Tasks',
      description: 'Project management and task tracking functionality',
      icon: FileText,
      href: '/docs/api/tasks',
      endpoints: [
        'GET /api/crm/tasks - List tasks',
        'POST /api/crm/tasks - Create task',
        'PUT /api/crm/tasks/:id - Update task',
        'DELETE /api/crm/tasks/:id - Delete task',
      ],
      badge: '5 endpoints',
    },
    {
      title: 'Search',
      description: 'Global search across enterprises, people, opportunities, and tasks',
      icon: Search,
      href: '/docs/api/search',
      endpoints: [
        'GET /api/search - Global search',
      ],
      badge: '1 endpoint',
    },
    {
      title: 'AI Copilot',
      description: 'AI-powered insights, lead scoring, and intelligent suggestions',
      icon: Sparkles,
      href: '/docs/api/ai-copilot',
      endpoints: [
        'POST /api/crm/ai/lead-score - Generate lead score',
        'GET /api/crm/ai/suggestions - Get AI suggestions',
        'POST /api/crm/ai/chat - Chat with AI',
      ],
      badge: 'AI-powered',
    },
  ];

  const statusCodes = [
    { code: '200', description: 'Success - Request completed successfully' },
    { code: '201', description: 'Created - Resource created successfully' },
    { code: '400', description: 'Bad Request - Invalid request parameters' },
    { code: '401', description: 'Unauthorized - Authentication required' },
    { code: '403', description: 'Forbidden - Insufficient permissions' },
    { code: '404', description: 'Not Found - Resource does not exist' },
    { code: '500', description: 'Server Error - Internal server error' },
  ];

  return (
    <div className="max-w-4xl" data-testid="api-overview-page">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">API Reference</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Complete reference for the Earth Care Network API. Build sustainable applications 
          with our RESTful API featuring enterprises, people management, and AI insights.
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <Badge variant="secondary" className="text-sm">
            REST API
          </Badge>
          <Badge variant="secondary" className="text-sm">
            JSON Responses
          </Badge>
          <Badge variant="secondary" className="text-sm">
            Rate Limited
          </Badge>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            All API endpoints require authentication except for public enterprise listings. 
            See our <Link href="/docs/guides/authentication" className="font-medium underline">Authentication Guide</Link> to get started.
          </AlertDescription>
        </Alert>
      </div>

      {/* Base URL */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Base URL</h2>
        <CodeBlock language="text">
{`https://your-app.replit.dev`}
        </CodeBlock>
        <p className="text-muted-foreground mt-3">
          All API requests should be made to this base URL. Replace <code>your-app</code> with your actual Replit deployment name.
        </p>
      </section>

      {/* Authentication */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
        <p className="text-muted-foreground mb-4">
          Our API uses session-based authentication with Replit Auth. After signing in, 
          your requests will automatically include the necessary authentication cookies.
        </p>
        
        <CodeBlock language="javascript" title="Example authenticated request">
{`// Browser environment (cookies included automatically)
const response = await fetch('/api/crm/enterprises', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

const enterprises = await response.json();`}
        </CodeBlock>
      </section>

      {/* API Sections */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">API Sections</h2>
        <div className="grid grid-cols-1 gap-6">
          {apiSections.map((section, index) => (
            <Card key={index} className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <section.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        <Link href={section.href}>{section.title}</Link>
                      </CardTitle>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {section.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.endpoints.map((endpoint, i) => (
                    <div key={i} className="text-sm font-mono text-muted-foreground">
                      {endpoint}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link href={section.href}>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      View Documentation →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* HTTP Status Codes */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">HTTP Status Codes</h2>
        <p className="text-muted-foreground mb-6">
          Our API returns standard HTTP status codes to indicate the success or failure of requests.
        </p>
        <div className="border rounded-lg overflow-hidden">
          {statusCodes.map((status, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 p-4 ${index < statusCodes.length - 1 ? 'border-b' : ''}`}
            >
              <Badge
                variant={status.code.startsWith('2') ? 'default' : status.code.startsWith('4') ? 'destructive' : 'secondary'}
                className="font-mono min-w-[60px] justify-center"
              >
                {status.code}
              </Badge>
              <span className="text-sm">{status.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Rate Limiting */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Rate Limiting</h2>
        <Alert className="mb-4">
          <AlertDescription>
            Rate limiting is implemented to ensure fair usage and maintain service quality. 
            Current limits vary by endpoint and user role.
          </AlertDescription>
        </Alert>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium">Standard Rate Limit</span>
            <Badge variant="outline">1000 requests/hour</Badge>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium">Search API</span>
            <Badge variant="outline">100 requests/hour</Badge>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium">AI Endpoints</span>
            <Badge variant="outline">50 requests/hour</Badge>
          </div>
        </div>
      </section>

      {/* Error Handling */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Error Handling</h2>
        <p className="text-muted-foreground mb-4">
          All errors return a consistent JSON structure with error details:
        </p>
        
        <CodeBlock language="json" title="Error Response Format">
{`{
  "message": "Validation error",
  "error": "Field 'name' is required",
  "statusCode": 400
}`}
        </CodeBlock>
      </section>

      {/* Quick Start */}
      <section className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Ready to Start?</h3>
        <p className="text-muted-foreground mb-4">
          Get up and running with our API in minutes.
        </p>
        <div className="flex gap-3">
          <Link href="/docs/guides/getting-started">
            <Button>
              Quick Start Guide
            </Button>
          </Link>
          <Link href="/docs/guides/authentication">
            <Button variant="outline">
              Authentication Setup
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}