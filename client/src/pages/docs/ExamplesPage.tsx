import { Code, Rocket, Target, Users, Building2, Sparkles, Download, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodeBlock from '@/components/docs/CodeBlock';
import TableOfContents from '@/components/docs/TableOfContents';

export default function ExamplesPage() {
  return (
    <div className="max-w-4xl relative" data-testid="examples-page">
      <div className="hidden xl:block fixed right-8 top-1/2 transform -translate-y-1/2 w-64">
        <TableOfContents />
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Code className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Code Examples</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-6">
          Real-world examples and complete code snippets for common use cases. Copy, paste, and adapt for your application.
        </p>
      </div>

      {/* Quick Start Example */}
      <section className="mb-16">
        <h2 id="quick-start" className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Rocket className="h-6 w-6" />
          Quick Start
        </h2>
        <p className="text-muted-foreground mb-6">
          Get started quickly with these essential examples:
        </p>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Check Authentication Status</h3>
            <Tabs defaultValue="javascript" className="w-full">
              <TabsList>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                <TabsTrigger value="react">React</TabsTrigger>
              </TabsList>
              
              <TabsContent value="javascript">
                <CodeBlock language="javascript">
{`async function checkAuth() {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log('Logged in as:', user.email);
      console.log('Role:', user.role);
      return user;
    } else {
      console.log('Not authenticated');
      window.location.href = '/login';
      return null;
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

// Use it
const user = await checkAuth();
if (user) {
  console.log(\`Welcome \${user.firstName}!\`);
}`}
                </CodeBlock>
              </TabsContent>
              
              <TabsContent value="typescript">
                <CodeBlock language="typescript">
{`interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'visitor' | 'member' | 'enterprise_owner' | 'admin';
  currentPlanType: 'free' | 'crm_basic' | 'build_pro_bundle';
}

async function checkAuth(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const user: User = await response.json();
      console.log('Logged in as:', user.email);
      console.log('Role:', user.role);
      return user;
    } else {
      console.log('Not authenticated');
      window.location.href = '/login';
      return null;
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}`}
                </CodeBlock>
              </TabsContent>
              
              <TabsContent value="react">
                <CodeBlock language="typescript">
{`import { useEffect, useState } from 'react';

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  return { user, loading };
}

// Use in component
function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  return <div>Welcome {user.firstName}!</div>;
}`}
                </CodeBlock>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">2. Fetch and Display Enterprises</h3>
            <CodeBlock language="javascript">
{`// Fetch enterprises with filtering
async function fetchEnterprises(category = null, search = '') {
  const params = new URLSearchParams({
    limit: '20',
    offset: '0'
  });
  
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  
  const response = await fetch(\`/api/enterprises?\${params}\`);
  const enterprises = await response.json();
  
  return enterprises;
}

// Display enterprises
async function displayEnterprises() {
  const enterprises = await fetchEnterprises('land_projects', 'solar');
  
  enterprises.forEach(enterprise => {
    console.log(\`📍 \${enterprise.name}\`);
    console.log(\`   Category: \${enterprise.category}\`);
    console.log(\`   Location: \${enterprise.location}\`);
    console.log(\`   Tags: \${enterprise.tags.join(', ')}\`);
  });
}

displayEnterprises();`}
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* CRM Management Examples */}
      <section className="mb-16">
        <h2 id="crm-management" className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          CRM Management
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">Create and Update Enterprise</h3>
            <CodeBlock language="javascript">
{`// Create a new enterprise
async function createEnterprise(data) {
  const response = await fetch('/api/crm/enterprises', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      category: data.category,
      location: data.location,
      website: data.website,
      tags: data.tags
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create enterprise');
  }
  
  return await response.json();
}

// Update existing enterprise
async function updateEnterprise(id, updates) {
  const response = await fetch(\`/api/crm/enterprises/\${id}\`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update enterprise');
  }
  
  return await response.json();
}

// Example usage
const newEnterprise = await createEnterprise({
  name: "Green Energy Solutions",
  description: "Innovative solar and wind energy solutions",
  category: "land_projects",
  location: "Austin, Texas",
  website: "https://greenenergy.example.com",
  tags: ["solar", "wind", "renewable"]
});

console.log('Created:', newEnterprise.id);

// Update it
await updateEnterprise(newEnterprise.id, {
  description: "Leading provider of solar and wind energy solutions",
  tags: ["solar", "wind", "renewable", "sustainable"]
});`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Manage Contacts (People)</h3>
            <CodeBlock language="javascript">
{`// Complete contact management workflow
async function manageContacts() {
  // Create a contact
  const createResponse = await fetch('/api/crm/people', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
      phone: "+1-555-0789",
      title: "Director of Sustainability",
      enterpriseId: "ent_123abc",
      linkedinUrl: "https://linkedin.com/in/sarahjohnson",
      notes: "Met at climate conference 2024. Very interested in our solutions."
    })
  });
  
  const contact = await createResponse.json();
  console.log('Created contact:', contact.id);
  
  // Search for contacts
  const searchResponse = await fetch('/api/crm/people?search=sarah', {
    credentials: 'include'
  });
  const people = await searchResponse.json();
  
  // Update contact
  const updateResponse = await fetch(\`/api/crm/people/\${contact.id}\`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: "VP of Sustainability",
      notes: "Promoted! Now decision maker for all sustainability initiatives."
    })
  });
  
  const updated = await updateResponse.json();
  console.log('Updated contact:', updated.title);
  
  return updated;
}`}
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* Opportunity Management */}
      <section className="mb-16">
        <h2 id="opportunities" className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Target className="h-6 w-6" />
          Opportunity Management
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">Complete Sales Pipeline Example</h3>
            <CodeBlock language="javascript">
{`// Full opportunity lifecycle management
async function manageSalesPipeline() {
  // 1. Create an opportunity
  const opportunity = await fetch('/api/crm/opportunities', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: "Solar Farm Development - Phase 1",
      enterpriseId: "ent_123abc",
      primaryContactId: "person_456def",
      value: 50000000, // $500,000 in cents
      status: "lead",
      probability: 25,
      expectedCloseDate: "2024-12-31",
      description: "500MW solar farm installation with battery storage",
      notes: "Initial discussion. Waiting for budget approval."
    })
  }).then(r => r.json());
  
  console.log('Created opportunity:', opportunity.id);
  
  // 2. Update as it progresses through the pipeline
  const statuses = ['qualified', 'proposal', 'negotiation'];
  const probabilities = [50, 75, 90];
  
  for (let i = 0; i < statuses.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate time passing
    
    await fetch(\`/api/crm/opportunities/\${opportunity.id}\`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: statuses[i],
        probability: probabilities[i],
        notes: \`Moved to \${statuses[i]} stage\`
      })
    });
    
    console.log(\`Updated to \${statuses[i]} (\${probabilities[i]}% probability)\`);
  }
  
  // 3. Close as won
  const closed = await fetch(\`/api/crm/opportunities/\${opportunity.id}\`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'closed_won',
      probability: 100,
      notes: 'Contract signed! 🎉'
    })
  }).then(r => r.json());
  
  console.log('Deal closed successfully!', closed);
  
  return closed;
}

// Run the pipeline
manageSalesPipeline();`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Export Opportunities to CSV</h3>
            <CodeBlock language="javascript">
{`// Export all opportunities as CSV
async function exportOpportunities() {
  const response = await fetch('/api/crm/opportunities/export', {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Export failed');
  }
  
  // Get the blob
  const blob = await response.blob();
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = \`opportunities-\${new Date().toISOString().split('T')[0]}.csv\`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  console.log('Export completed successfully');
}

// Export with button click
document.getElementById('export-btn').addEventListener('click', exportOpportunities);`}
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* Enterprise Management & Profile Claims */}
      <section className="mb-16">
        <h2 id="enterprise-management" className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Enterprise Management & Profile Claims
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">Complete Profile Claim Workflow</h3>
            <p className="text-muted-foreground mb-4">
              This example shows the complete flow: admin creates an enterprise, sends a claim invitation, and the recipient claims the profile.
            </p>
            <CodeBlock language="javascript">
{`// STEP 1: Admin creates an enterprise
async function createEnterprise() {
  const response = await fetch('/api/crm/enterprises', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Green Valley Solar Farm",
      description: "500MW solar installation with battery storage",
      category: "land_projects",
      location: "California, USA",
      website: "https://greenvalleysolar.example.com",
      contactEmail: "info@greenvalleysolar.example.com",
      tags: ["solar", "renewable-energy", "battery-storage"]
    })
  });
  
  const enterprise = await response.json();
  console.log('✅ Created enterprise:', enterprise.id);
  return enterprise;
}

// STEP 2: Admin sends profile claim invitation
async function sendClaimInvitation(enterpriseId) {
  const response = await fetch(\`/api/crm/enterprises/\${enterpriseId}/invite\`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ceo@greenvalleysolar.example.com',
      name: 'John Green'
    })
  });
  
  const result = await response.json();
  console.log('✅ Invitation created!');
  console.log('📧 Send this link to the recipient:');
  console.log(\`   https://yourdomain.com\${result.claimUrl}\`);
  console.log(\`   Token: \${result.claim.claimToken}\`);
  console.log(\`   ⏰ Expires: \${result.claim.expiresAt}\`);
  
  return result;
}

// STEP 3: Recipient checks the claim details (before logging in)
async function checkClaimDetails(token) {
  const response = await fetch(\`/api/enterprises/claim/\${token}\`);
  const claimInfo = await response.json();
  
  console.log('📋 Claim Details:');
  console.log(\`   Enterprise: \${claimInfo.enterprise.name}\`);
  console.log(\`   Category: \${claimInfo.enterprise.category}\`);
  console.log(\`   Invited: \${claimInfo.claim.invitedEmail}\`);
  console.log(\`   Status: \${claimInfo.claim.status}\`);
  
  return claimInfo;
}

// STEP 4: Recipient claims the profile (after logging in)
async function claimProfile(token) {
  const response = await fetch(\`/api/enterprises/claim/\${token}\`, {
    method: 'POST',
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const result = await response.json();
  console.log('🎉 Profile claimed successfully!');
  console.log(\`   You are now the owner of: \${result.enterprise.name}\`);
  console.log('   Your role has been upgraded to: enterprise_owner');
  
  return result;
}

// Complete workflow execution
async function completeProfileClaimWorkflow() {
  // Step 1: Admin creates enterprise
  const enterprise = await createEnterprise();
  
  // Step 2: Admin sends invitation
  const invitation = await sendClaimInvitation(enterprise.id);
  
  // Step 3: Recipient checks details
  const claimInfo = await checkClaimDetails(invitation.claim.claimToken);
  
  // Step 4: Recipient logs in and claims profile
  // (User would authenticate here)
  const claimed = await claimProfile(invitation.claim.claimToken);
  
  console.log('\\n✅ Complete workflow finished!');
  return claimed;
}

// Run the complete workflow
completeProfileClaimWorkflow();`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Bulk Import Enterprises from URLs</h3>
            <CodeBlock language="javascript">
{`// Import multiple enterprises at once from URLs
async function bulkImportEnterprises() {
  const urls = [
    'https://solarenergy.example.com',
    'https://windpower.example.com',
    'https://hydroelectric.example.com',
    'https://geothermal.example.com'
  ];
  
  console.log(\`📥 Starting bulk import of \${urls.length} enterprises...\`);
  
  const response = await fetch('/api/crm/bulk-import/urls', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urls: urls,
      category: 'land_projects'
    })
  });
  
  const result = await response.json();
  
  console.log(\`\\n✅ Import completed!\`);
  console.log(\`   Successful: \${result.imported}\`);
  console.log(\`   Failed: \${result.failed}\`);
  
  if (result.enterprises?.length > 0) {
    console.log('\\n📊 Imported Enterprises:');
    result.enterprises.forEach((ent, i) => {
      console.log(\`   \${i + 1}. \${ent.name}\`);
      console.log(\`      ID: \${ent.id}\`);
      console.log(\`      Source: \${ent.sourceUrl}\`);
    });
  }
  
  return result;
}

// Run bulk import
bulkImportEnterprises();`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Favorites Management</h3>
            <CodeBlock language="javascript">
{`// Manage favorite enterprises with personal notes
async function manageFavorites() {
  // Add enterprises to favorites
  const enterprises = [
    { id: 'ent_solar123', notes: 'Great solar panel supplier' },
    { id: 'ent_wind456', notes: 'Interested in partnership' },
    { id: 'ent_hydro789', notes: 'Follow up Q4 2025' }
  ];
  
  console.log('⭐ Adding favorites...');
  for (const ent of enterprises) {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enterpriseId: ent.id,
        notes: ent.notes
      })
    });
    
    const favorite = await response.json();
    console.log(\`   ✅ Added: \${ent.id}\`);
  }
  
  // Get favorites list
  const listResponse = await fetch('/api/favorites?limit=50', {
    credentials: 'include'
  });
  const favorites = await listResponse.json();
  
  console.log(\`\\n📋 Your Favorites (\${favorites.length} total):\`);
  favorites.forEach(fav => {
    console.log(\`   ⭐ \${fav.enterprise.name}\`);
    if (fav.notes) {
      console.log(\`      💡 \${fav.notes}\`);
    }
  });
  
  // Get favorites statistics
  const statsResponse = await fetch('/api/favorites/stats', {
    credentials: 'include'
  });
  const stats = await statsResponse.json();
  
  console.log('\\n📊 Favorites by Category:');
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    console.log(\`   \${category}: \${count}\`);
  });
  
  return favorites;
}

manageFavorites();`}
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* AI Copilot Examples */}
      <section className="mb-16">
        <h2 id="ai-copilot" className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          AI Copilot Integration
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">AI Lead Scoring</h3>
            <CodeBlock language="javascript">
{`// Get AI-powered lead score and recommendations
async function scoreOpportunity(enterpriseId, personId) {
  const response = await fetch('/api/crm/ai/lead-score', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enterpriseId,
      personId
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const score = await response.json();
  
  // Display results
  console.log(\`Lead Score: \${score.score}/100\`);
  console.log('\\nKey Factors:');
  score.factors.forEach(factor => {
    console.log(\`  ✓ \${factor}\`);
  });
  console.log('\\nRecommendation:', score.recommendation);
  console.log('\\nNext Steps:');
  score.nextSteps.forEach((step, i) => {
    console.log(\`  \${i + 1}. \${step}\`);
  });
  
  return score;
}

// Use it
const score = await scoreOpportunity('ent_123abc', 'person_456def');

// Act on high scores
if (score.score >= 80) {
  console.log('🔥 High priority opportunity!');
  // Create follow-up task
  await fetch('/api/crm/tasks', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Follow up on high-score lead',
      description: score.recommendation,
      priority: 'urgent',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  });
}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">AI Suggestions Dashboard</h3>
            <CodeBlock language="javascript">
{`// Build an AI-powered suggestions dashboard
async function buildSuggestionsDashboard() {
  const response = await fetch('/api/crm/ai/suggestions?limit=10', {
    credentials: 'include'
  });
  
  const data = await response.json();
  
  // Group by priority
  const grouped = {
    urgent: [],
    high: [],
    medium: [],
    low: []
  };
  
  data.suggestions.forEach(suggestion => {
    if (grouped[suggestion.priority]) {
      grouped[suggestion.priority].push(suggestion);
    }
  });
  
  // Display by priority
  console.log('🚨 URGENT ACTIONS');
  grouped.urgent.forEach(s => {
    console.log(\`  • \${s.title}\`);
    console.log(\`    → \${s.suggestedAction}\`);
  });
  
  console.log('\\n⚡ HIGH PRIORITY');
  grouped.high.forEach(s => {
    console.log(\`  • \${s.title}\`);
    console.log(\`    → \${s.suggestedAction}\`);
  });
  
  // Display insights
  console.log('\\n💡 KEY INSIGHTS');
  data.insights.forEach(insight => {
    console.log(\`  • \${insight}\`);
  });
  
  return data;
}

// Refresh suggestions every 5 minutes
setInterval(buildSuggestionsDashboard, 5 * 60 * 1000);

// Initial load
buildSuggestionsDashboard();`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Chat with AI Copilot</h3>
            <CodeBlock language="javascript">
{`// Interactive AI chat assistant
class AICopilot {
  constructor() {
    this.conversationId = null;
  }
  
  async chat(message) {
    const response = await fetch('/api/crm/ai/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationId: this.conversationId
      })
    });
    
    const data = await response.json();
    
    // Store conversation ID for context
    if (data.conversationId) {
      this.conversationId = data.conversationId;
    }
    
    return data;
  }
  
  async displayResponse(response) {
    console.log('🤖 AI Copilot:', response.response);
    
    if (response.relatedEntities?.length > 0) {
      console.log('\\n📎 Related:');
      response.relatedEntities.forEach(entity => {
        console.log(\`  • \${entity.type}: \${entity.name}\`);
      });
    }
    
    if (response.suggestedActions?.length > 0) {
      console.log('\\n✅ Suggested Actions:');
      response.suggestedActions.forEach((action, i) => {
        console.log(\`  \${i + 1}. \${action}\`);
      });
    }
  }
}

// Use the copilot
const copilot = new AICopilot();

// Ask questions
const response1 = await copilot.chat('Which opportunities should I focus on this week?');
copilot.displayResponse(response1);

// Follow-up maintains context
const response2 = await copilot.chat('What about the solar farm project specifically?');
copilot.displayResponse(response2);`}
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* Search Examples */}
      <section className="mb-16">
        <h2 id="search" className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Global Search
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">Autocomplete Search Component</h3>
            <CodeBlock language="javascript">
{`// Build a real-time autocomplete search
class AutocompleteSearch {
  constructor(inputElement, resultsElement) {
    this.input = inputElement;
    this.results = resultsElement;
    this.debounceTimer = null;
    
    this.input.addEventListener('input', (e) => this.handleInput(e));
  }
  
  handleInput(event) {
    clearTimeout(this.debounceTimer);
    
    const query = event.target.value.trim();
    
    if (query.length < 2) {
      this.results.innerHTML = '';
      return;
    }
    
    this.debounceTimer = setTimeout(() => {
      this.search(query);
    }, 300);
  }
  
  async search(query) {
    try {
      const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&limit=5\`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      this.displayResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }
  
  displayResults(data) {
    const html = [];
    
    // Enterprises
    if (data.enterprises?.length > 0) {
      html.push('<div class="group"><h4>Enterprises</h4>');
      data.enterprises.forEach(ent => {
        html.push(\`
          <div class="result" data-type="enterprise" data-id="\${ent.id}">
            <strong>\${ent.name}</strong>
            <span>\${ent.category}</span>
          </div>
        \`);
      });
      html.push('</div>');
    }
    
    // People
    if (data.people?.length > 0) {
      html.push('<div class="group"><h4>People</h4>');
      data.people.forEach(person => {
        html.push(\`
          <div class="result" data-type="person" data-id="\${person.id}">
            <strong>\${person.firstName} \${person.lastName}</strong>
            <span>\${person.title || person.email}</span>
          </div>
        \`);
      });
      html.push('</div>');
    }
    
    // Opportunities
    if (data.opportunities?.length > 0) {
      html.push('<div class="group"><h4>Opportunities</h4>');
      data.opportunities.forEach(opp => {
        html.push(\`
          <div class="result" data-type="opportunity" data-id="\${opp.id}">
            <strong>\${opp.title}</strong>
            <span>\${opp.status}</span>
          </div>
        \`);
      });
      html.push('</div>');
    }
    
    this.results.innerHTML = html.join('');
  }
}

// Initialize
const search = new AutocompleteSearch(
  document.getElementById('search-input'),
  document.getElementById('search-results')
);`}
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* Error Handling */}
      <section className="mb-16">
        <h2 id="error-handling" className="text-2xl font-semibold mb-6">Error Handling Best Practices</h2>
        
        <CodeBlock language="javascript">
{`// Comprehensive error handling wrapper
async function apiRequest(url, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  try {
    const response = await fetch(url, defaultOptions);
    
    // Handle authentication errors
    if (response.status === 401) {
      console.error('Not authenticated');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    
    // Handle permission errors
    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action');
    }
    
    // Handle not found
    if (response.status === 404) {
      throw new Error('Resource not found');
    }
    
    // Handle rate limiting
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Handle server errors
    if (response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    // Parse response
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Usage examples
try {
  const enterprises = await apiRequest('/api/enterprises');
  console.log('Success:', enterprises);
} catch (error) {
  alert(\`Error: \${error.message}\`);
}

try {
  const opportunity = await apiRequest('/api/crm/opportunities', {
    method: 'POST',
    body: JSON.stringify({
      title: "New Opportunity",
      enterpriseId: "ent_123"
    })
  });
  console.log('Created:', opportunity);
} catch (error) {
  if (error.message.includes('permission')) {
    alert('You need enterprise_owner or admin role to create opportunities');
  } else {
    alert(\`Failed to create opportunity: \${error.message}\`);
  }
}`}
        </CodeBlock>
      </section>

      {/* Next Steps */}
      <section className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Ready to Build?</h3>
        <p className="text-muted-foreground mb-4">
          You now have everything you need to integrate with the Earth Care Network API. Start building your sustainable application today!
        </p>
        <div className="flex gap-3">
          <Link href="/docs/api">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" data-testid="link-api-reference">
              Full API Reference
            </button>
          </Link>
          <Link href="/docs/guides/getting-started">
            <button className="px-4 py-2 border rounded-md hover:bg-muted" data-testid="link-getting-started">
              Getting Started Guide
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
