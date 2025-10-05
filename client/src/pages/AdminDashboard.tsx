import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Building2, FileText, Settings, BarChart3, AlertTriangle, Database } from "lucide-react";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { adminFlow } from "@/lib/onboardingFlows";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isFlowComplete } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin && !isFlowComplete('admin')) {
      setShowOnboarding(true);
    }
  }, [isAdmin, isFlowComplete]);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="admin-dashboard-title">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground" data-testid="admin-dashboard-subtitle">
          Welcome, {user?.firstName || 'Admin'}! Monitor and manage the Earth Care Network platform.
        </p>
        <Badge variant="destructive" className="mt-2" data-testid="admin-role-badge">
          Administrator
        </Badge>
      </div>

      {/* System Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4" data-testid="system-overview-title">
          System Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-total-users">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-total-enterprises">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Enterprises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Listed enterprises</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-pending-applications">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-system-alerts">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">0</div>
              <p className="text-xs text-muted-foreground">Active alerts</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Onboarding Checklist */}
      {isAdmin && !isFlowComplete('admin') && (
        <div className="mb-8">
          <OnboardingChecklist
            flowKey="admin"
            steps={adminFlow.steps}
            title="Admin Dashboard Guide"
            description="Master platform administration and moderation tools"
          />
        </div>
      )}

      {/* Admin Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card data-testid="card-user-management">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" data-testid="button-manage-users">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        {/* Enterprise Management */}
        <Card data-testid="card-enterprise-management">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Enterprise Management
            </CardTitle>
            <CardDescription>
              Review and manage enterprise listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" data-testid="button-manage-enterprises">
              Manage Enterprises
            </Button>
          </CardContent>
        </Card>

        {/* Partner Applications */}
        <Card data-testid="card-partner-applications">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Partner Applications
            </CardTitle>
            <CardDescription>
              Review and process partnership applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" data-testid="button-review-applications">
              Review Applications
            </Button>
          </CardContent>
        </Card>

        {/* Analytics & Reports */}
        <Card data-testid="card-analytics">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Analytics & Reports
            </CardTitle>
            <CardDescription>
              View platform analytics and generate reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-view-analytics">
              View Analytics
            </Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card data-testid="card-system-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure platform settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-system-settings">
              Manage Settings
            </Button>
          </CardContent>
        </Card>

        {/* Security & Monitoring */}
        <Card data-testid="card-security">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>
              Monitor security and system health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-security-monitoring">
              Security Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4" data-testid="system-health-title">
          System Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="card-database-status">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" data-testid="database-status">Healthy</Badge>
            </CardContent>
          </Card>
          
          <Card data-testid="card-api-status">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                API Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" data-testid="api-status">Operational</Badge>
            </CardContent>
          </Card>
          
          <Card data-testid="card-alerts-status">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" data-testid="alerts-status">No Issues</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4" data-testid="quick-actions-title">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Button data-testid="button-bulk-import">
            Bulk Import Data
          </Button>
          <Button variant="outline" data-testid="button-export-data">
            Export Data
          </Button>
          <Button variant="outline" data-testid="button-send-notification">
            Send Notification
          </Button>
          <Button variant="outline" data-testid="button-backup-system">
            Backup System
          </Button>
        </div>
      </div>

      {/* Admin Onboarding Modal */}
      {isAdmin && (
        <OnboardingModal
          flowKey="admin"
          steps={adminFlow.steps}
          isOpen={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}