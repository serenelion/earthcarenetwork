import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Users,
  Building2,
  Zap,
  CreditCard,
  Star,
  Database,
  Puzzle,
  Activity,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AdminStats {
  totalUsers: number;
  totalEnterprises: number;
  totalAiTokens: number;
  activeSubscriptions: number;
  subscriptionStats: {
    total: number;
    byPlan: Record<string, number>;
    byStatus: Record<string, number>;
    totalMrr: number;
    churnRate: number;
  };
}

interface AuditLog {
  id: string;
  userId: string;
  enterpriseId?: string;
  actionType: string;
  tableName?: string;
  recordId?: string;
  changes?: any;
  metadata?: any;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

const actionTypeLabels: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  feature: "Featured",
  unfeature: "Unfeatured",
  export: "Exported",
  import: "Imported",
  configure_tool: "Configured",
  test_integration: "Tested",
  bulk_operation: "Bulk Operation",
};

const actionTypeColors: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  feature: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  unfeature: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  export: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  import: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  configure_tool: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  test_integration: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  bulk_operation: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  testId,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  description?: string;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`${testId}-value`}>
          {value.toLocaleString()}
        </div>
        {(trend || description) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: AuditLog }) {
  const getActivityDescription = () => {
    const action = actionTypeLabels[activity.actionType] || activity.actionType;
    const table = activity.tableName || "record";
    const metadata = activity.metadata as any;

    if (metadata?.action) {
      return `${metadata.action.replace(/_/g, " ")}`;
    }

    return `${action} ${table}`;
  };

  return (
    <div
      className="flex items-start gap-3 py-3 border-b last:border-0"
      data-testid={`activity-${activity.id}`}
    >
      <div className="mt-0.5">
        <Activity className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant="secondary"
            className={actionTypeColors[activity.actionType] || ""}
          >
            {actionTypeLabels[activity.actionType] || activity.actionType}
          </Badge>
          {!activity.success && (
            <Badge variant="destructive">Failed</Badge>
          )}
        </div>
        <p className="text-sm text-foreground" data-testid={`activity-description-${activity.id}`}>
          {getActivityDescription()}
        </p>
        {activity.tableName && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Table: {activity.tableName}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span data-testid={`activity-time-${activity.id}`}>
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  testId,
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
  testId: string;
}) {
  return (
    <Link href={href}>
      <Card
        className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
        data-testid={testId}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {description}
              </CardDescription>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<{
    activities: AuditLog[];
  }>({
    queryKey: ["/api/admin/activity"],
  });

  return (
    <div className="p-8" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="dashboard-title">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground" data-testid="dashboard-description">
            Platform overview and quick actions
          </p>
        </div>

        {/* System Statistics */}
        <div>
          <h2 className="text-xl font-semibold mb-4" data-testid="section-stats">
            System Statistics
          </h2>
          {statsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="stats-loading">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="stats-cards">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={Users}
                description="Platform users"
                testId="stat-total-users"
              />
              <StatCard
                title="Total Enterprises"
                value={stats.totalEnterprises}
                icon={Building2}
                description="Directory entries"
                testId="stat-total-enterprises"
              />
              <StatCard
                title="AI Tokens Used"
                value={stats.totalAiTokens}
                icon={Zap}
                description="Total AI usage"
                testId="stat-ai-tokens"
              />
              <StatCard
                title="Active Subscriptions"
                value={stats.activeSubscriptions}
                icon={CreditCard}
                description="Paying customers"
                testId="stat-active-subscriptions"
              />
            </div>
          ) : (
            <p className="text-muted-foreground" data-testid="stats-error">
              Failed to load statistics
            </p>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold mb-4" data-testid="section-activity">
            Recent Activity
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Latest Actions</CardTitle>
              <CardDescription>Recent platform events and admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3" data-testid="activity-loading">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : activityData && activityData.activities.length > 0 ? (
                <div data-testid="activity-list">
                  {activityData.activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8" data-testid="activity-empty">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4" data-testid="section-quick-actions">
            Quick Actions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="quick-actions-grid">
            <QuickActionCard
              title="Featured Enterprises"
              description="Manage featured directory entries"
              icon={Star}
              href="/admin/featured-enterprises"
              testId="action-featured-enterprises"
            />
            <QuickActionCard
              title="Database Management"
              description="View and manage database tables"
              icon={Database}
              href="/admin/database"
              testId="action-database"
            />
            <QuickActionCard
              title="Integrations"
              description="Configure external integrations"
              icon={Puzzle}
              href="/admin/integrations"
              testId="action-integrations"
            />
            <QuickActionCard
              title="AI Chat Assistant"
              description="Interact with admin AI tools"
              icon={Zap}
              href="/admin/chat"
              testId="action-ai-chat"
            />
            <QuickActionCard
              title="View Users"
              description="Manage platform users"
              icon={Users}
              href="/admin/database?table=users"
              testId="action-view-users"
            />
            <QuickActionCard
              title="AI Usage Logs"
              description="View AI token consumption"
              icon={Activity}
              href="/admin/database?table=ai_usage_logs"
              testId="action-ai-logs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
