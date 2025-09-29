import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Users, Target, BarChart3, Settings } from "lucide-react";

export default function EnterpriseOwnerDashboard() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8" data-testid="enterprise-owner-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="enterprise-owner-dashboard-title">
          Enterprise Management
        </h1>
        <p className="text-muted-foreground" data-testid="enterprise-owner-dashboard-subtitle">
          Welcome, {user?.firstName || 'Enterprise Owner'}! Manage your enterprise and explore growth opportunities.
        </p>
        <Badge variant="default" className="mt-2" data-testid="enterprise-owner-role-badge">
          Enterprise Owner
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* My Enterprise */}
        <Card data-testid="card-my-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              My Enterprise
            </CardTitle>
            <CardDescription>
              Manage your enterprise profile and information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" data-testid="button-manage-enterprise">
              Manage Enterprise
            </Button>
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card data-testid="card-opportunities">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Opportunities
            </CardTitle>
            <CardDescription>
              Track and manage business opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground mb-2">0</div>
            <p className="text-sm text-muted-foreground">Active opportunities</p>
            <Button variant="outline" className="w-full mt-4" data-testid="button-view-opportunities">
              View All
            </Button>
          </CardContent>
        </Card>

        {/* Performance Analytics */}
        <Card data-testid="card-performance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Performance
            </CardTitle>
            <CardDescription>
              Enterprise metrics and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-view-analytics">
              View Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Growth Tracker */}
        <Card data-testid="card-growth">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Growth Tracker
            </CardTitle>
            <CardDescription>
              Monitor your enterprise growth and milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary mb-2">$0</div>
            <p className="text-sm text-muted-foreground">Total value tracked</p>
          </CardContent>
        </Card>

        {/* Team Management */}
        <Card data-testid="card-team">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team
            </CardTitle>
            <CardDescription>
              Manage your enterprise team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground mb-2">0</div>
            <p className="text-sm text-muted-foreground">Team members</p>
            <Button variant="outline" className="w-full mt-4" data-testid="button-manage-team">
              Manage Team
            </Button>
          </CardContent>
        </Card>

        {/* Enterprise Settings */}
        <Card data-testid="card-enterprise-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Settings
            </CardTitle>
            <CardDescription>
              Configure enterprise preferences and integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-enterprise-settings">
              Manage Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4" data-testid="recent-activity-title">
          Recent Activity
        </h2>
        <Card data-testid="card-recent-activity">
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">No recent activity to display</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4" data-testid="quick-actions-title">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Button data-testid="button-create-opportunity">
            Create Opportunity
          </Button>
          <Button variant="outline" data-testid="button-update-profile">
            Update Profile
          </Button>
          <Button variant="outline" data-testid="button-view-network">
            View Network
          </Button>
          <Button variant="outline" data-testid="button-access-crm">
            Access CRM
          </Button>
        </div>
      </div>
    </div>
  );
}