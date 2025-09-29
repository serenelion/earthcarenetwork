import { ArrowRight, Code, Book, Zap, Users, Building2, Target, Search } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const quickStartCards = [
  {
    title: 'Authentication',
    description: 'Set up API authentication with Replit Auth',
    icon: Zap,
    href: '/docs/guides/authentication',
    time: '5 min',
  },
  {
    title: 'First API Call',
    description: 'Make your first request to the Enterprises API',
    icon: Code,
    href: '/docs/guides/first-api-call',
    time: '10 min',
  },
  {
    title: 'Search Integration',
    description: 'Implement global search in your application',
    icon: Search,
    href: '/docs/guides/search-integration',
    time: '15 min',
  },
];

const apiSections = [
  {
    title: 'Enterprises API',
    description: 'Manage enterprise directory, profiles, and metadata',
    icon: Building2,
    href: '/docs/api/enterprises',
    endpoints: 8,
  },
  {
    title: 'People API',
    description: 'Handle contacts, relationships, and communication tracking',
    icon: Users,
    href: '/docs/api/people',
    endpoints: 6,
  },
  {
    title: 'Opportunities API',
    description: 'Track leads, deals, and sales pipeline management',
    icon: Target,
    href: '/docs/api/opportunities',
    endpoints: 7,
  },
];

const integrationGuides = [
  {
    title: 'Enterprise Directory Integration',
    description: 'Build a searchable enterprise directory with filters and categories',
    href: '/docs/guides/enterprise-directory',
    difficulty: 'Beginner',
  },
  {
    title: 'CRM Workflow Setup',
    description: 'Implement opportunity management and pipeline tracking',
    href: '/docs/guides/crm-workflow',
    difficulty: 'Intermediate',
  },
  {
    title: 'AI Copilot Integration',
    description: 'Add intelligent lead scoring and suggestions to your app',
    href: '/docs/guides/ai-copilot',
    difficulty: 'Advanced',
  },
];

export default function DocsHome() {
  return (
    <div className="max-w-6xl mx-auto" data-testid="docs-home">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4" data-testid="docs-title">
          Earth Care Network API Documentation
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Build powerful applications on top of our sustainable enterprise network. 
          Integrate with our directory, manage relationships, and leverage AI-powered insights.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/docs/guides/getting-started">
            <Button size="lg" data-testid="get-started-btn">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/docs/api">
            <Button variant="outline" size="lg" data-testid="api-reference-btn">
              <Book className="mr-2 h-4 w-4" />
              API Reference
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Start Cards */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Quick Start</h2>
          <Badge variant="secondary">Start here</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickStartCards.map((card, index) => (
            <Link key={card.href} href={card.href}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow group" data-testid={`quick-start-card-${index}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <card.icon className="h-8 w-8 text-primary" />
                    <Badge variant="outline">{card.time}</Badge>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {card.title}
                  </CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* API Reference Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">API Reference</h2>
          <Link href="/docs/api">
            <Button variant="ghost" size="sm">
              View All APIs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {apiSections.map((section, index) => (
            <Link key={section.href} href={section.href}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow group" data-testid={`api-section-card-${index}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <section.icon className="h-8 w-8 text-primary" />
                    <Badge variant="secondary">{section.endpoints} endpoints</Badge>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Integration Guides */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Integration Guides</h2>
          <Link href="/docs/guides">
            <Button variant="ghost" size="sm">
              View All Guides
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          {integrationGuides.map((guide, index) => (
            <Link key={guide.href} href={guide.href}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow group" data-testid={`integration-guide-${index}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors text-lg">
                        {guide.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {guide.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={guide.difficulty === 'Beginner' ? 'default' : guide.difficulty === 'Intermediate' ? 'secondary' : 'outline'}
                      >
                        {guide.difficulty}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Resources */}
      <section className="bg-muted/30 rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-4">Popular Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
              Common Use Cases
            </h3>
            <div className="space-y-2">
              <Link href="/docs/guides/enterprise-search" className="block text-sm hover:text-primary transition-colors">
                • Building Enterprise Search & Filters
              </Link>
              <Link href="/docs/guides/contact-management" className="block text-sm hover:text-primary transition-colors">
                • Contact & Relationship Management
              </Link>
              <Link href="/docs/guides/opportunity-tracking" className="block text-sm hover:text-primary transition-colors">
                • Opportunity Pipeline Tracking
              </Link>
              <Link href="/docs/guides/ai-lead-scoring" className="block text-sm hover:text-primary transition-colors">
                • AI-Powered Lead Scoring
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
              Developer Tools
            </h3>
            <div className="space-y-2">
              <Link href="/docs/tools/api-explorer" className="block text-sm hover:text-primary transition-colors">
                • Interactive API Explorer
              </Link>
              <Link href="/docs/tools/postman-collection" className="block text-sm hover:text-primary transition-colors">
                • Postman Collection
              </Link>
              <Link href="/docs/tools/sdks" className="block text-sm hover:text-primary transition-colors">
                • SDKs & Libraries (Coming Soon)
              </Link>
              <Link href="/docs/tools/webhooks" className="block text-sm hover:text-primary transition-colors">
                • Webhooks (Coming Soon)
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}