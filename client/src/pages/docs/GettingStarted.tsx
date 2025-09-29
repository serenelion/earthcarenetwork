import { ArrowRight, CheckCircle, ExternalLink, Shield, Code, Zap } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CodeBlock from '@/components/docs/CodeBlock';
import LanguageTabs from '@/components/docs/LanguageTabs';

export default function GettingStarted() {
  const setupSteps = [
    {
      title: 'Sign up for Earth Care Network',
      description: 'Create your account to access the API',
      completed: true,
    },
    {
      title: 'Authenticate your requests',
      description: 'Set up Replit Auth integration',
      completed: false,
    },
    {
      title: 'Make your first API call',
      description: 'Fetch enterprises from our directory',
      completed: false,
    },
    {
      title: 'Explore advanced features',
      description: 'Try search, AI insights, and more',
      completed: false,
    },
  ];

  const quickExamples = [
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Fetch enterprises
const response = await fetch('/api/enterprises?limit=10');
const enterprises = await response.json();

console.log(\`Found \${enterprises.length} enterprises\`);`,
    },
    {
      language: 'python',
      label: 'Python',
      code: `import requests

# Fetch enterprises
response = requests.get('/api/enterprises?limit=10')
enterprises = response.json()

print(f"Found {len(enterprises)} enterprises")`,
    },
    {
      language: 'curl',
      label: 'cURL',
      code: `# Fetch enterprises
curl -X GET "/api/enterprises?limit=10" \\
  -H "Content-Type: application/json"`,
    },
  ];

  return (
    <div className="max-w-4xl" data-testid="getting-started-page">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Getting Started</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Build sustainable applications with the Earth Care Network API. 
          Follow this guide to make your first API call in under 10 minutes.
        </p>
        
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Our API uses Replit Auth for secure authentication. You'll need an Earth Care Network account to get started.
          </AlertDescription>
        </Alert>
      </div>

      {/* Quick Start Checklist */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Quick Start Checklist</h2>
        <div className="space-y-4">
          {setupSteps.map((step, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Core Concepts */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Core Concepts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Secure API access using Replit Auth with role-based permissions.
              </p>
              <Link href="/docs/guides/authentication">
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  Learn more <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-primary mb-2" />
              <CardTitle>REST API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Simple HTTP endpoints for enterprises, people, and opportunities.
              </p>
              <Link href="/docs/api">
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  API Reference <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Intelligent lead scoring and automated suggestions powered by AI.
              </p>
              <Link href="/docs/api/ai-copilot">
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  Explore AI <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Example */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Your First API Call</h2>
        <p className="text-muted-foreground mb-6">
          Here's a simple example to fetch enterprises from our directory:
        </p>
        <LanguageTabs examples={quickExamples} />
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
          <h4 className="font-medium mb-2">Expected Response:</h4>
          <CodeBlock language="json">
{`[
  {
    "id": "ent_123",
    "name": "Solar Solutions Inc",
    "category": "land_projects",
    "location": "California, USA",
    "description": "Renewable energy solutions for sustainable communities",
    "website": "https://solarsolutions.example.com",
    "isVerified": true,
    "tags": ["solar", "renewable-energy", "sustainability"]
  }
]`}
          </CodeBlock>
        </div>
      </section>

      {/* Next Steps */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Next Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Learn how to authenticate requests and handle user sessions.
              </p>
              <Link href="/docs/guides/authentication">
                <Button variant="outline" size="sm">
                  Authentication Guide
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Explore APIs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Browse our complete API reference with interactive examples.
              </p>
              <Link href="/docs/api">
                <Button variant="outline" size="sm">
                  API Reference
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Integration Guides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Step-by-step guides for common integration patterns.
              </p>
              <Link href="/docs/guides">
                <Button variant="outline" size="sm">
                  Integration Guides
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ready-to-use code examples in multiple languages.
              </p>
              <Link href="/docs/examples">
                <Button variant="outline" size="sm">
                  Browse Examples
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support */}
      <section className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
        <p className="text-muted-foreground mb-4">
          Can't find what you're looking for? We're here to help.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/contact">
              Contact Support
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/docs/guides">
              Browse Guides
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}