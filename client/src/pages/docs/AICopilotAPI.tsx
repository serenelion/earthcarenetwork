import { Sparkles, Shield, Zap, Brain } from 'lucide-react';
import { Link } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import APIEndpoint from '@/components/docs/APIEndpoint';
import CodeBlock from '@/components/docs/CodeBlock';
import TableOfContents from '@/components/docs/TableOfContents';

export default function AICopilotAPI() {
  const leadScoreResponse = {
    score: 85,
    factors: [
      "Strong engagement history",
      "Budget confirmed and aligned",
      "Decision maker identified",
      "Timeline matches our capacity",
      "High fit with our offering"
    ],
    recommendation: "High priority - schedule executive meeting within 1 week",
    nextSteps: [
      "Send personalized proposal",
      "Schedule executive demo",
      "Prepare case studies from similar projects"
    ]
  };

  const suggestionsResponse = {
    suggestions: [
      {
        type: "follow_up",
        entityType: "opportunity",
        entityId: "opp_123abc",
        title: "Follow up on Solar Farm Development",
        reason: "No activity in 5 days, high-value opportunity",
        priority: "high",
        suggestedAction: "Schedule status call"
      },
      {
        type: "connection",
        entityType: "person",
        entityId: "person_456def",
        title: "Connect John Doe with sustainability team",
        reason: "Mutual interest in renewable energy projects",
        priority: "medium",
        suggestedAction: "Send introduction email"
      }
    ],
    insights: [
      "3 high-value opportunities approaching close date",
      "2 new leads match your ideal customer profile",
      "Pipeline velocity increased 15% this quarter"
    ]
  };

  const chatResponse = {
    response: "Based on your current pipeline, I recommend focusing on the Solar Farm Development opportunity. It has a high lead score (85/100) and the decision maker is engaged. The budget is confirmed at $500K and timeline aligns with Q4. I suggest scheduling an executive demo within the next week.",
    relatedEntities: [
      {
        type: "opportunity",
        id: "opp_123abc",
        name: "Solar Farm Development"
      }
    ],
    suggestedActions: [
      "Schedule executive demo",
      "Prepare ROI analysis",
      "Review competitive landscape"
    ]
  };

  return (
    <div className="max-w-4xl relative" data-testid="ai-copilot-api-page">
      <div className="hidden xl:block fixed right-8 top-1/2 transform -translate-y-1/2 w-64">
        <TableOfContents />
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">AI Copilot API</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-6">
          AI-powered insights, lead scoring, and intelligent suggestions. Leverage OpenAI to enhance your CRM workflow with smart automation.
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <Badge variant="secondary">3 endpoints</Badge>
          <Badge variant="secondary">OpenAI Powered</Badge>
          <Badge variant="secondary">Usage Limits</Badge>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Authentication & Limits:</strong> AI endpoints require 'enterprise_owner' or 'admin' role. Credit usage is tracked and limited based on your subscription plan.
          </AlertDescription>
        </Alert>
      </div>

      <section className="mb-12">
        <h2 id="overview" className="text-2xl font-semibold mb-4">AI Copilot Overview</h2>
        <p className="text-muted-foreground mb-6">
          The AI Copilot API provides intelligent automation and insights for your CRM. Powered by OpenAI, it analyzes your data to provide lead scoring, suggestions, and conversational assistance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Lead Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI analyzes opportunities to generate priority scores and actionable recommendations.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Smart Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get proactive suggestions for follow-ups, connections, and next best actions.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Chat Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Conversational AI that understands your CRM context and provides insights.
              </p>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Credit Usage:</strong> Each AI request consumes credits from your monthly quota (credits are dollar-based, 100 cents = $1.00). Monitor usage via the <code>/api/auth/user</code> endpoint which returns <code>creditUsageThisMonth</code> and <code>creditQuotaLimit</code> in cents.
          </AlertDescription>
        </Alert>
      </section>

      <section className="mb-16">
        <h2 id="endpoints" className="text-2xl font-semibold mb-6">API Endpoints</h2>

        <APIEndpoint
          method="POST"
          path="/api/crm/ai/lead-score"
          title="Generate Lead Score"
          description="Analyze an opportunity and generate an AI-powered lead score with actionable insights."
          requiresAuth={true}
          roles={['enterprise_owner', 'admin']}
          bodyParameters={[
            {
              name: 'enterpriseId',
              type: 'string',
              required: true,
              description: 'Enterprise ID',
              example: 'ent_123abc',
            },
            {
              name: 'personId',
              type: 'string',
              required: false,
              description: 'Contact person ID',
              example: 'person_456def',
            },
          ]}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const response = await fetch('/api/crm/ai/lead-score', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    enterpriseId: 'ent_123abc',
    personId: 'person_456def'
  })
});

const score = await response.json();
console.log(\`Lead Score: \${score.score}/100\`);
console.log('Factors:', score.factors);
console.log('Next Steps:', score.nextSteps);`,
            },
          ]}
          responses={[
            {
              status: 200,
              description: "Lead score generated successfully",
              example: leadScoreResponse,
            },
            {
              status: 404,
              description: "Enterprise not found",
              example: { message: "Enterprise not found" },
            },
            {
              status: 429,
              description: "Credit quota exceeded",
              example: { message: "Insufficient AI credits" },
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="GET"
          path="/api/crm/ai/suggestions"
          title="Get AI Suggestions"
          description="Receive proactive AI-generated suggestions for your CRM activities."
          requiresAuth={true}
          roles={['enterprise_owner', 'admin']}
          queryParameters={[
            {
              name: 'limit',
              type: 'integer',
              required: false,
              description: 'Number of suggestions',
              default: '5',
              example: '10',
            },
          ]}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const response = await fetch('/api/crm/ai/suggestions?limit=10', {
  credentials: 'include'
});

const data = await response.json();
console.log('Suggestions:', data.suggestions);
console.log('Insights:', data.insights);

// Display high priority suggestions
const highPriority = data.suggestions.filter(s => s.priority === 'high');
highPriority.forEach(suggestion => {
  console.log(\`⚡ \${suggestion.title}\`);
  console.log(\`   Action: \${suggestion.suggestedAction}\`);
});`,
            },
          ]}
          responses={[
            {
              status: 200,
              description: "AI suggestions generated",
              example: suggestionsResponse,
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="POST"
          path="/api/crm/ai/chat"
          title="Chat with AI Copilot"
          description="Have a conversation with the AI assistant about your CRM data and get contextual insights."
          requiresAuth={true}
          roles={['enterprise_owner', 'admin']}
          bodyParameters={[
            {
              name: 'message',
              type: 'string',
              required: true,
              description: 'Your message to the AI',
              example: 'Which opportunities should I focus on this week?',
            },
            {
              name: 'conversationId',
              type: 'string',
              required: false,
              description: 'Conversation ID for context',
              example: 'conv_789ghi',
            },
          ]}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const response = await fetch('/api/crm/ai/chat', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Which opportunities should I focus on this week?',
    conversationId: 'conv_789ghi' // Optional: maintain conversation context
  })
});

const chat = await response.json();
console.log('AI Response:', chat.response);
console.log('Related Entities:', chat.relatedEntities);
console.log('Suggested Actions:', chat.suggestedActions);`,
            },
          ]}
          responses={[
            {
              status: 200,
              description: "AI response generated",
              example: chatResponse,
            },
          ]}
        />
      </section>

      <section className="mb-12">
        <h2 id="best-practices" className="text-2xl font-semibold mb-6">Best Practices</h2>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Monitor Credit Usage</h4>
            <CodeBlock language="javascript">
{`// Check remaining credits before making AI requests
const userResponse = await fetch('/api/auth/user', {
  credentials: 'include'
});
const user = await userResponse.json();

const usedDollars = (user.creditUsageThisMonth / 100).toFixed(2);
const limitDollars = (user.creditQuotaLimit / 100).toFixed(2);
console.log(\`Used: $\${usedDollars} / $\${limitDollars}\`);

if (user.creditUsageThisMonth >= user.creditQuotaLimit * 0.9) {
  console.warn('Approaching credit limit - consider topping up');
}`}
            </CodeBlock>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Handle Rate Limits</h4>
            <CodeBlock language="javascript">
{`// Implement retry logic for rate limits
async function getAISuggestions(retries = 3) {
  try {
    const response = await fetch('/api/crm/ai/suggestions', {
      credentials: 'include'
    });
    
    if (response.status === 429) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return getAISuggestions(retries - 1);
      }
      throw new Error('Insufficient AI credits');
    }
    
    return await response.json();
  } catch (error) {
    console.error('AI request failed:', error);
    throw error;
  }
}`}
            </CodeBlock>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Cache AI Responses</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Cache AI-generated insights to reduce credit usage for frequently accessed data.
            </p>
            <CodeBlock language="javascript">
{`// Simple caching strategy
const aiCache = new Map();

async function getCachedLeadScore(enterpriseId, personId) {
  const cacheKey = \`\${enterpriseId}-\${personId}\`;
  
  // Check cache (valid for 1 hour)
  const cached = aiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.data;
  }
  
  // Fetch fresh score
  const response = await fetch('/api/crm/ai/lead-score', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enterpriseId, personId })
  });
  
  const data = await response.json();
  
  // Update cache
  aiCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}`}
            </CodeBlock>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 id="usage-limits" className="text-2xl font-semibold mb-6">Usage Limits by Plan</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="text-left py-3 px-4">Plan</th>
                <th className="text-left py-3 px-4">Monthly Credit Limit</th>
                <th className="text-left py-3 px-4">Rate Limit</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4">Free</td>
                <td className="py-3 px-4">$0.10 AI credits</td>
                <td className="py-3 px-4">10 requests/hour</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">CRM Pro</td>
                <td className="py-3 px-4">$42 AI credits</td>
                <td className="py-3 px-4">50 requests/hour</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Build Pro Bundle</td>
                <td className="py-3 px-4">$88.11 AI credits</td>
                <td className="py-3 px-4">100 requests/hour</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
        <div className="flex gap-3">
          <Link href="/docs/examples">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" data-testid="link-examples">
              View Code Examples
            </button>
          </Link>
          <Link href="/docs/api">
            <button className="px-4 py-2 border rounded-md hover:bg-muted" data-testid="link-api-overview">
              API Overview
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
