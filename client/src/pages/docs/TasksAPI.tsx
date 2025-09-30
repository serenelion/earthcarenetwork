import { FileText, Shield } from 'lucide-react';
import { Link } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import APIEndpoint from '@/components/docs/APIEndpoint';
import TableOfContents from '@/components/docs/TableOfContents';

export default function TasksAPI() {
  const taskBodyParams = [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: 'Task title',
      example: 'Follow up with client about proposal',
    },
    {
      name: 'description',
      type: 'string',
      required: false,
      description: 'Detailed task description',
      example: 'Discuss timeline and budget requirements',
    },
    {
      name: 'status',
      type: 'string',
      required: false,
      description: 'Current status',
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      example: 'pending',
    },
    {
      name: 'priority',
      type: 'string',
      required: false,
      description: 'Task priority',
      enum: ['low', 'medium', 'high', 'urgent'],
      example: 'high',
    },
    {
      name: 'assigneeId',
      type: 'string',
      required: false,
      description: 'Assigned user ID',
      example: 'user_123abc',
    },
    {
      name: 'relatedEntityType',
      type: 'string',
      required: false,
      description: 'Related entity type',
      enum: ['enterprise', 'person', 'opportunity'],
      example: 'opportunity',
    },
    {
      name: 'relatedEntityId',
      type: 'string',
      required: false,
      description: 'Related entity ID',
      example: 'opp_456def',
    },
    {
      name: 'dueDate',
      type: 'string',
      required: false,
      description: 'Due date (ISO 8601)',
      example: '2024-06-15',
    },
  ];

  const taskResponse = {
    id: "task_123abc456def789",
    title: "Follow up with client about proposal",
    description: "Discuss timeline and budget requirements",
    status: "pending",
    priority: "high",
    assigneeId: "user_123abc",
    relatedEntityType: "opportunity",
    relatedEntityId: "opp_456def",
    dueDate: "2024-06-15",
    createdAt: "2024-05-01T10:30:00Z",
    updatedAt: "2024-05-10T14:22:00Z"
  };

  return (
    <div className="max-w-4xl relative" data-testid="tasks-api-page">
      <div className="hidden xl:block fixed right-8 top-1/2 transform -translate-y-1/2 w-64">
        <TableOfContents />
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Tasks API</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-6">
          Project management and task tracking. Organize work, set priorities, and track progress across your team.
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <Badge variant="secondary">5 endpoints</Badge>
          <Badge variant="secondary">Task Management</Badge>
          <Badge variant="secondary">Entity Relations</Badge>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Authentication Required:</strong> All task endpoints require authentication.
          </AlertDescription>
        </Alert>
      </div>

      <section className="mb-16">
        <h2 id="endpoints" className="text-2xl font-semibold mb-6">API Endpoints</h2>

        <APIEndpoint
          method="GET"
          path="/api/crm/tasks"
          title="List Tasks"
          description="Retrieve all tasks with optional filtering."
          requiresAuth={true}
          queryParameters={[
            { name: 'search', type: 'string', required: false, description: 'Search by title', example: 'follow up' },
            { name: 'limit', type: 'integer', required: false, description: 'Results limit', default: '50', example: '20' },
            { name: 'offset', type: 'integer', required: false, description: 'Pagination offset', default: '0', example: '0' },
          ]}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const response = await fetch('/api/crm/tasks?limit=10', {
  credentials: 'include'
});

const tasks = await response.json();
console.log(\`Found \${tasks.length} tasks\`);`,
            },
          ]}
          responses={[
            {
              status: 200,
              description: "List of tasks",
              example: [taskResponse],
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="POST"
          path="/api/crm/tasks"
          title="Create Task"
          description="Create a new task."
          requiresAuth={true}
          bodyParameters={taskBodyParams}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const newTask = {
  title: "Prepare contract documents",
  description: "Draft and review final contract",
  status: "pending",
  priority: "urgent",
  relatedEntityType: "opportunity",
  relatedEntityId: "opp_123abc",
  dueDate: "2024-06-01"
};

const response = await fetch('/api/crm/tasks', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newTask)
});

const task = await response.json();
console.log('Created task:', task.id);`,
            },
          ]}
          responses={[
            {
              status: 201,
              description: "Task created successfully",
              example: taskResponse,
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="PUT"
          path="/api/crm/tasks/:id"
          title="Update Task"
          description="Update an existing task."
          requiresAuth={true}
          parameters={[
            { name: 'id', type: 'string', required: true, description: 'Task ID', example: 'task_123abc456def789' }
          ]}
          bodyParameters={taskBodyParams.map(p => ({ ...p, required: false }))}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const updates = {
  status: "completed",
  description: "Contract finalized and sent to client"
};

const response = await fetch('/api/crm/tasks/task_123abc456def789', {
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
              description: "Task updated successfully",
              example: taskResponse,
            },
          ]}
          className="mb-12"
        />

        <APIEndpoint
          method="DELETE"
          path="/api/crm/tasks/:id"
          title="Delete Task"
          description="Permanently delete a task."
          requiresAuth={true}
          parameters={[
            { name: 'id', type: 'string', required: true, description: 'Task ID', example: 'task_123abc456def789' }
          ]}
          examples={[
            {
              language: 'javascript',
              label: 'JavaScript',
              code: `const response = await fetch('/api/crm/tasks/task_123abc456def789', {
  method: 'DELETE',
  credentials: 'include'
});

if (response.ok) {
  console.log('Task deleted');
}`,
            },
          ]}
          responses={[
            {
              status: 204,
              description: "Task deleted successfully",
              example: {},
            },
          ]}
        />
      </section>

      <section className="mb-12">
        <h2 id="schema" className="text-2xl font-semibold mb-6">Task Schema</h2>
        <div className="bg-muted/30 border rounded-lg p-6">
          <pre className="text-sm font-mono overflow-x-auto">
            <code className="language-json">
{JSON.stringify({
  id: "string (UUID)",
  title: "string (required)",
  description: "string (optional)",
  status: "enum: pending | in_progress | completed | cancelled",
  priority: "enum: low | medium | high | urgent",
  assigneeId: "string (optional)",
  relatedEntityType: "enum: enterprise | person | opportunity (optional)",
  relatedEntityId: "string (optional)",
  dueDate: "string ISO 8601 (optional)",
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
          <Link href="/docs/api/search">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" data-testid="link-search-api">
              Search API
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
