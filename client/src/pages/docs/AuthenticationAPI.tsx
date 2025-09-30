import { Shield, Lock, Users, Key, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import APIEndpoint from '@/components/docs/APIEndpoint';
import CodeBlock from '@/components/docs/CodeBlock';
import TableOfContents from '@/components/docs/TableOfContents';

export default function AuthenticationAPI() {
  const roleDescriptions = [
    {
      role: 'visitor',
      description: 'Default role for unauthenticated or new users. Read-only access to public enterprise listings.',
      color: 'secondary',
    },
    {
      role: 'member',
      description: 'Authenticated users with basic access. Can view enterprises, manage favorites, and use search.',
      color: 'default',
    },
    {
      role: 'enterprise_owner',
      description: 'Can manage their own enterprises, contacts, opportunities, and tasks. Full CRM access.',
      color: 'default',
    },
    {
      role: 'admin',
      description: 'Full system access including user management, all CRM features, and administrative tools.',
      color: 'destructive',
    },
  ];

  const authFlowExamples = [
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Check authentication status
const checkAuth = async () => {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include' // Important: include cookies
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log('Authenticated as:', user.email);
      console.log('Role:', user.role);
      return user;
    } else {
      console.log('Not authenticated');
      return null;
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
};

// Make authenticated request
const fetchCRMData = async () => {
  const response = await fetch('/api/crm/enterprises', {
    credentials: 'include', // Include session cookies
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (response.status === 401) {
    // User is not authenticated
    window.location.href = '/login';
    return;
  }
  
  if (response.status === 403) {
    // User lacks required permissions
    throw new Error('Insufficient permissions');
  }
  
  const data = await response.json();
  return data;
};`,
    },
    {
      language: 'python',
      label: 'Python',
      code: `import requests

# Check authentication status
def check_auth(session):
    try:
        response = session.get('/api/auth/user')
        
        if response.ok:
            user = response.json()
            print(f"Authenticated as: {user['email']}")
            print(f"Role: {user['role']}")
            return user
        else:
            print("Not authenticated")
            return None
    except Exception as error:
        print(f"Auth check failed: {error}")
        return None

# Make authenticated request
def fetch_crm_data(session):
    response = session.get('/api/crm/enterprises', 
                          headers={'Content-Type': 'application/json'})
    
    if response.status_code == 401:
        # User is not authenticated
        raise Exception("Authentication required")
    
    if response.status_code == 403:
        # User lacks required permissions
        raise Exception("Insufficient permissions")
    
    return response.json()

# Create session with cookies
session = requests.Session()`,
    },
  ];

  const userResponse = {
    id: "47557662",
    email: "user@earthcare.network",
    firstName: "Jane",
    lastName: "Doe",
    role: "enterprise_owner",
    membershipStatus: "paid_member",
    currentPlanType: "crm_basic",
    tokenUsageThisMonth: 2500,
    tokenQuotaLimit: 50000,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-03-10T14:22:00Z"
  };

  return (
    <div className="max-w-4xl relative" data-testid="authentication-api-page">
      {/* Table of Contents */}
      <div className="hidden xl:block fixed right-8 top-1/2 transform -translate-y-1/2 w-64">
        <TableOfContents />
      </div>

      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Authentication API</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-6">
          Secure authentication and authorization using Replit Auth with session-based authentication and role-based access control.
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <Badge variant="secondary">Session-based</Badge>
          <Badge variant="secondary">OIDC</Badge>
          <Badge variant="secondary">Role-based Access</Badge>
        </div>

        <Alert className="mb-6">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Our API uses <strong>Replit Auth</strong> for secure authentication. Users must sign in through Replit's OAuth flow, and all authenticated requests automatically include session cookies.
          </AlertDescription>
        </Alert>
      </div>

      {/* Authentication Overview */}
      <section className="mb-12">
        <h2 id="overview" className="text-2xl font-semibold mb-4">Authentication Overview</h2>
        <p className="text-muted-foreground mb-6">
          The Earth Care Network API uses session-based authentication powered by Replit Auth (OIDC). 
          When users sign in, they receive a session cookie that authenticates all subsequent API requests.
        </p>
        
        <div className="bg-muted/30 border rounded-lg p-6 mb-6">
          <h3 className="font-semibold mb-3">How It Works:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>User signs in via Replit Auth OAuth flow</li>
            <li>Server creates a secure session and sets session cookie</li>
            <li>All API requests automatically include the session cookie</li>
            <li>Server validates session and checks user permissions</li>
            <li>API responds with data or appropriate error codes</li>
          </ol>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> When making requests from JavaScript, always include <code className="text-sm">credentials: 'include'</code> in fetch options to ensure cookies are sent with requests.
          </AlertDescription>
        </Alert>
      </section>

      {/* Role-Based Access Control */}
      <section className="mb-12">
        <h2 id="roles" className="text-2xl font-semibold mb-6">Role-Based Access Control</h2>
        <p className="text-muted-foreground mb-6">
          Users are assigned roles that determine their access level across the platform:
        </p>
        
        <div className="space-y-4">
          {roleDescriptions.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-mono">{item.role}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                  </div>
                  <Badge variant={item.color as any}>{item.role}</Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
          <h4 className="font-medium mb-3">Permission Matrix:</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Feature</th>
                  <th className="text-center py-2">Visitor</th>
                  <th className="text-center py-2">Member</th>
                  <th className="text-center py-2">Enterprise Owner</th>
                  <th className="text-center py-2">Admin</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">View Public Enterprises</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Manage Favorites</td>
                  <td className="text-center">-</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Global Search</td>
                  <td className="text-center">-</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">CRM Features</td>
                  <td className="text-center">-</td>
                  <td className="text-center">-</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">AI Copilot</td>
                  <td className="text-center">-</td>
                  <td className="text-center">-</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-2">Admin Functions</td>
                  <td className="text-center">-</td>
                  <td className="text-center">-</td>
                  <td className="text-center">-</td>
                  <td className="text-center">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Authentication Endpoint */}
      <section className="mb-12">
        <h2 id="endpoints" className="text-2xl font-semibold mb-6">Authentication Endpoints</h2>
        
        <APIEndpoint
          method="GET"
          path="/api/auth/user"
          title="Get Current User"
          description="Retrieve the currently authenticated user's information including their role, subscription status, and usage limits."
          requiresAuth={true}
          examples={authFlowExamples}
          responses={[
            {
              status: 200,
              description: "User authenticated successfully",
              example: userResponse,
            },
            {
              status: 401,
              description: "Not authenticated",
              example: {
                message: "Not authenticated",
                code: "NO_AUTH"
              },
            },
          ]}
        />
      </section>

      {/* Making Authenticated Requests */}
      <section className="mb-12">
        <h2 id="making-requests" className="text-2xl font-semibold mb-6">Making Authenticated Requests</h2>
        <p className="text-muted-foreground mb-6">
          All authenticated endpoints require the session cookie to be included with requests. Here's how to properly make authenticated API calls:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Browser/Frontend (JavaScript)</h3>
            <CodeBlock language="javascript">
{`// Always include credentials: 'include' to send cookies
const response = await fetch('/api/crm/people', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Handle different authentication states
if (response.status === 401) {
  // User is not authenticated - redirect to login
  window.location.href = '/login';
}

if (response.status === 403) {
  // User lacks required permissions
  alert('You do not have permission to access this resource');
  return;
}

const data = await response.json();`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Server-Side (Node.js)</h3>
            <CodeBlock language="javascript">
{`// When making requests from your server to our API
const fetch = require('node-fetch');

// You'll need to pass the session cookie from the client
const response = await fetch('https://api.earthcare.network/api/crm/people', {
  headers: {
    'Content-Type': 'application/json',
    'Cookie': req.headers.cookie // Forward the cookie from client request
  }
});

const data = await response.json();`}
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* Error Handling */}
      <section className="mb-12">
        <h2 id="error-handling" className="text-2xl font-semibold mb-6">Error Handling</h2>
        <p className="text-muted-foreground mb-6">
          Authentication errors return specific HTTP status codes and error messages:
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="destructive" className="mb-2">401 Unauthorized</Badge>
                  <CardTitle className="text-lg">Not Authenticated</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    The user is not logged in or their session has expired.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CodeBlock language="json">
{`{
  "message": "Not authenticated",
  "code": "NO_AUTH"
}`}
              </CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="destructive" className="mb-2">403 Forbidden</Badge>
                  <CardTitle className="text-lg">Insufficient Permissions</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    The user is authenticated but lacks the required role or permissions.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CodeBlock language="json">
{`{
  "error": "Forbidden - insufficient permissions"
}`}
              </CodeBlock>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Security Best Practices */}
      <section className="mb-12">
        <h2 id="best-practices" className="text-2xl font-semibold mb-6">Security Best Practices</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Session Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Sessions are HTTP-only cookies, inaccessible to JavaScript</p>
              <p>• All sessions are encrypted and signed to prevent tampering</p>
              <p>• Sessions expire after period of inactivity</p>
              <p>• Users can sign out to immediately invalidate their session</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Permission Checks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Always verify user permissions before performing sensitive operations</p>
              <p>• Don't rely solely on frontend permission checks</p>
              <p>• Server validates all requests against user roles</p>
              <p>• Use the lowest privilege level required for each operation</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
        <p className="text-muted-foreground mb-4">
          Now that you understand authentication, explore the API endpoints:
        </p>
        <div className="flex gap-3">
          <Link href="/docs/api/enterprises">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" data-testid="link-enterprises-api">
              Enterprises API
            </button>
          </Link>
          <Link href="/docs/api/people">
            <button className="px-4 py-2 border rounded-md hover:bg-muted" data-testid="link-people-api">
              People API
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
