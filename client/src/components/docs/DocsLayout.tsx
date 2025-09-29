import { useState } from 'react';
import { Link, useLocation, Switch, Route } from 'wouter';
import { 
  ChevronRight, 
  Menu, 
  X, 
  Home, 
  Book, 
  Code, 
  Building2, 
  Users, 
  Target, 
  Search,
  Zap,
  Shield,
  FileText,
  Settings,
  Sparkles,
  ExternalLink
} from 'lucide-react';

// Import existing documentation pages
import DocsHome from '@/pages/docs/DocsHome';
import GettingStarted from '@/pages/docs/GettingStarted';
import APIOverview from '@/pages/docs/APIOverview';
import EnterprisesAPI from '@/pages/docs/EnterprisesAPI';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DocsLayoutProps {
  children?: React.ReactNode;
}

interface NavItem {
  title: string;
  href?: string;
  icon?: any;
  badge?: string;
  items?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: 'Getting Started',
    icon: Home,
    items: [
      { title: 'Overview', href: '/docs' },
      { title: 'Quick Start', href: '/docs/guides/getting-started' },
      { title: 'Authentication', href: '/docs/guides/authentication' },
      { title: 'First API Call', href: '/docs/guides/first-api-call' },
    ],
  },
  {
    title: 'API Reference',
    icon: Book,
    items: [
      { title: 'Overview', href: '/docs/api' },
      { title: 'Authentication', href: '/docs/api/authentication', icon: Shield },
      { title: 'Enterprises', href: '/docs/api/enterprises', icon: Building2 },
      { title: 'People', href: '/docs/api/people', icon: Users },
      { title: 'Opportunities', href: '/docs/api/opportunities', icon: Target },
      { title: 'Tasks', href: '/docs/api/tasks', icon: FileText },
      { title: 'Search', href: '/docs/api/search', icon: Search },
      { title: 'AI Copilot', href: '/docs/api/ai-copilot', icon: Sparkles },
    ],
  },
  {
    title: 'Integration Guides',
    icon: Code,
    items: [
      { title: 'Enterprise Directory', href: '/docs/guides/enterprise-directory' },
      { title: 'Contact Management', href: '/docs/guides/contact-management' },
      { title: 'CRM Workflow', href: '/docs/guides/crm-workflow' },
      { title: 'Search Integration', href: '/docs/guides/search-integration' },
      { title: 'AI Integration', href: '/docs/guides/ai-copilot' },
    ],
  },
  {
    title: 'Code Examples',
    icon: Code,
    items: [
      { title: 'JavaScript/Node.js', href: '/docs/examples/javascript' },
      { title: 'Python', href: '/docs/examples/python' },
      { title: 'cURL', href: '/docs/examples/curl' },
      { title: 'React Components', href: '/docs/examples/react' },
    ],
  },
  {
    title: 'Tools & Resources',
    icon: Settings,
    items: [
      { title: 'API Explorer', href: '/docs/tools/api-explorer', badge: 'Interactive' },
      { title: 'Postman Collection', href: '/docs/tools/postman-collection' },
      { title: 'Error Codes', href: '/docs/reference/errors' },
      { title: 'Rate Limits', href: '/docs/reference/rate-limits' },
      { title: 'Webhooks', href: '/docs/reference/webhooks', badge: 'Soon' },
    ],
  },
];

function NavigationItem({ item, level = 0 }: { item: NavItem; level?: number }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.items && item.items.length > 0;
  const isActive = item.href === location;
  const isParentActive = hasChildren && item.items?.some(child => child.href === location);

  return (
    <div>
      {item.href ? (
        <Link href={item.href}>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors',
              level === 0 ? 'font-medium' : '',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              level > 0 ? 'ml-4' : ''
            )}
            data-testid={`nav-item-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {item.icon && <item.icon className="h-4 w-4" />}
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="h-5 text-xs">
                {item.badge}
              </Badge>
            )}
          </div>
        </Link>
      ) : (
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium cursor-pointer rounded-md transition-colors',
            isParentActive
              ? 'text-foreground bg-muted'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          onClick={() => setIsOpen(!isOpen)}
          data-testid={`nav-section-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          <span className="flex-1">{item.title}</span>
          {hasChildren && (
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform',
                isOpen || isParentActive ? 'rotate-90' : ''
              )}
            />
          )}
        </div>
      )}
      
      {hasChildren && (isOpen || isParentActive) && (
        <div className="mt-1 space-y-1">
          {item.items.map((subItem, index) => (
            <NavigationItem key={index} item={subItem} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavigationContent() {
  return (
    <div className="space-y-6">
      {navigation.map((section, index) => (
        <div key={index}>
          <NavigationItem item={section} />
          {index < navigation.length - 1 && <Separator className="mt-4" />}
        </div>
      ))}
    </div>
  );
}

function Breadcrumbs() {
  const [location] = useLocation();
  const pathSegments = location.split('/').filter(Boolean);
  
  if (pathSegments[0] !== 'docs') return null;

  const breadcrumbs = [
    { title: 'Documentation', href: '/docs' },
  ];

  // Build breadcrumbs from path
  let currentPath = '/docs';
  for (let i = 1; i < pathSegments.length; i++) {
    currentPath += `/${pathSegments[i]}`;
    const title = pathSegments[i].charAt(0).toUpperCase() + pathSegments[i].slice(1);
    breadcrumbs.push({ title, href: currentPath });
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6" data-testid="breadcrumbs">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          <Link 
            href={breadcrumb.href}
            className={cn(
              "hover:text-foreground transition-colors",
              index === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""
            )}
          >
            {breadcrumb.title}
          </Link>
        </div>
      ))}
    </nav>
  );
}

// Placeholder component factory
function PlaceholderPage({ title, description, testId }: { title: string; description: string; testId: string }) {
  return (
    <div className="max-w-4xl" data-testid={testId}>
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-xl text-muted-foreground mb-6">{description}</p>
      <div className="bg-muted/30 rounded-lg p-6">
        <p>Documentation coming soon...</p>
      </div>
    </div>
  );
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-border bg-card/50">
          <div className="flex-shrink-0 px-4 py-6">
            <Link href="/docs" className="flex items-center gap-2" data-testid="docs-logo">
              <Book className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Documentation</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 px-4">
            <NavigationContent />
          </ScrollArea>
          <div className="p-4 border-t">
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-4 w-4" />
              Back to Earth Network
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed top-4 left-4 z-40"
              data-testid="mobile-nav-trigger"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 px-4 py-6">
                <Link href="/docs" className="flex items-center gap-2">
                  <Book className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-lg">Documentation</span>
                </Link>
              </div>
              <ScrollArea className="flex-1 px-4">
                <NavigationContent />
              </ScrollArea>
              <div className="p-4 border-t">
                <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-4 w-4" />
                  Back to Earth Network
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <Breadcrumbs />
            <Switch>
              {/* Home */}
              <Route path="/docs" component={DocsHome} />
              
              {/* Getting Started Guides */}
              <Route path="/docs/guides/getting-started" component={GettingStarted} />
              <Route path="/docs/guides/authentication">
                <PlaceholderPage 
                  title="Authentication" 
                  description="Learn how to authenticate with the Earth Care Network API using Replit Auth."
                  testId="auth-guide-page"
                />
              </Route>
              <Route path="/docs/guides/first-api-call">
                <PlaceholderPage 
                  title="First API Call" 
                  description="Make your first request to the Earth Care Network API."
                  testId="first-api-call-page"
                />
              </Route>
              
              {/* Integration Guides */}
              <Route path="/docs/guides/enterprise-directory">
                <PlaceholderPage 
                  title="Enterprise Directory Integration" 
                  description="Build a searchable enterprise directory with filters and categories."
                  testId="enterprise-directory-guide-page"
                />
              </Route>
              <Route path="/docs/guides/contact-management">
                <PlaceholderPage 
                  title="Contact Management Integration" 
                  description="Implement comprehensive contact and relationship management."
                  testId="contact-management-guide-page"
                />
              </Route>
              <Route path="/docs/guides/crm-workflow">
                <PlaceholderPage 
                  title="CRM Workflow Setup" 
                  description="Implement opportunity management and pipeline tracking."
                  testId="crm-workflow-guide-page"
                />
              </Route>
              <Route path="/docs/guides/search-integration">
                <PlaceholderPage 
                  title="Search Integration" 
                  description="Implement global search across enterprises, people, and opportunities."
                  testId="search-integration-guide-page"
                />
              </Route>
              <Route path="/docs/guides/ai-copilot">
                <PlaceholderPage 
                  title="AI Copilot Integration" 
                  description="Add intelligent lead scoring and suggestions to your application."
                  testId="ai-copilot-guide-page"
                />
              </Route>
              
              {/* API Reference */}
              <Route path="/docs/api" component={APIOverview} />
              <Route path="/docs/api/enterprises" component={EnterprisesAPI} />
              <Route path="/docs/api/authentication">
                <PlaceholderPage 
                  title="Authentication API" 
                  description="API reference for authentication endpoints."
                  testId="api-auth-page"
                />
              </Route>
              <Route path="/docs/api/people">
                <PlaceholderPage 
                  title="People API" 
                  description="Manage contacts and relationships with the People API."
                  testId="people-api-page"
                />
              </Route>
              <Route path="/docs/api/opportunities">
                <PlaceholderPage 
                  title="Opportunities API" 
                  description="Track leads and manage sales pipeline with the Opportunities API."
                  testId="opportunities-api-page"
                />
              </Route>
              <Route path="/docs/api/tasks">
                <PlaceholderPage 
                  title="Tasks API" 
                  description="Project management and task tracking functionality."
                  testId="tasks-api-page"
                />
              </Route>
              <Route path="/docs/api/search">
                <PlaceholderPage 
                  title="Search API" 
                  description="Global search across enterprises, people, opportunities, and tasks."
                  testId="search-api-page"
                />
              </Route>
              <Route path="/docs/api/ai-copilot">
                <PlaceholderPage 
                  title="AI Copilot API" 
                  description="AI-powered insights, lead scoring, and intelligent suggestions."
                  testId="ai-copilot-api-page"
                />
              </Route>
              
              {/* Code Examples */}
              <Route path="/docs/examples/javascript">
                <PlaceholderPage 
                  title="JavaScript/Node.js Examples" 
                  description="Complete code examples and SDK usage for JavaScript and Node.js applications."
                  testId="javascript-examples-page"
                />
              </Route>
              <Route path="/docs/examples/python">
                <PlaceholderPage 
                  title="Python Examples" 
                  description="Complete code examples and SDK usage for Python applications."
                  testId="python-examples-page"
                />
              </Route>
              <Route path="/docs/examples/curl">
                <PlaceholderPage 
                  title="cURL Examples" 
                  description="Raw HTTP request examples using cURL for testing and integration."
                  testId="curl-examples-page"
                />
              </Route>
              <Route path="/docs/examples/react">
                <PlaceholderPage 
                  title="React Component Examples" 
                  description="Pre-built React components and integration patterns."
                  testId="react-examples-page"
                />
              </Route>
              
              {/* Tools & Resources */}
              <Route path="/docs/tools/api-explorer">
                <PlaceholderPage 
                  title="API Explorer" 
                  description="Interactive tool to explore and test all API endpoints."
                  testId="api-explorer-page"
                />
              </Route>
              <Route path="/docs/tools/postman-collection">
                <PlaceholderPage 
                  title="Postman Collection" 
                  description="Download our comprehensive Postman collection for API testing."
                  testId="postman-collection-page"
                />
              </Route>
              <Route path="/docs/reference/errors">
                <PlaceholderPage 
                  title="Error Codes Reference" 
                  description="Complete reference of API error codes and troubleshooting guide."
                  testId="error-codes-page"
                />
              </Route>
              <Route path="/docs/reference/rate-limits">
                <PlaceholderPage 
                  title="Rate Limits" 
                  description="API rate limiting policies, quotas, and best practices."
                  testId="rate-limits-page"
                />
              </Route>
              <Route path="/docs/reference/webhooks">
                <PlaceholderPage 
                  title="Webhooks" 
                  description="Real-time event notifications and webhook configuration."
                  testId="webhooks-page"
                />
              </Route>
              
              {/* 404 for docs */}
              <Route>
                <div className="max-w-4xl" data-testid="docs-not-found">
                  <h1 className="text-4xl font-bold mb-4">Documentation Not Found</h1>
                  <p className="text-muted-foreground">
                    The documentation page you're looking for doesn't exist.
                  </p>
                </div>
              </Route>
            </Switch>
          </div>
        </div>
      </main>
    </div>
  );
}