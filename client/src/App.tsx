import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute, { AdminOnlyRoute, EnterpriseOrAdminRoute, MemberOrHigherRoute, AuthenticatedRoute } from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import MemberDashboard from "@/pages/MemberDashboard";
import EnterpriseOwnerDashboard from "@/pages/EnterpriseOwnerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Enterprises from "@/pages/Enterprises";
import People from "@/pages/People";
import Opportunities from "@/pages/Opportunities";
import Tasks from "@/pages/Tasks";
import Copilot from "@/pages/Copilot";
import BulkImport from "@/pages/BulkImport";
import Settings from "@/pages/Settings";
import Partners from "@/pages/Partners";
import MemberBenefits from "@/pages/MemberBenefits";
import PartnerApplication from "@/pages/PartnerApplication";
import AdminPartnerApplications from "@/pages/AdminPartnerApplications";
import AdminEnterpriseClaiming from "@/pages/AdminEnterpriseClaiming";
import ClaimEnterprise from "@/pages/ClaimEnterprise";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main>
        <Switch>
          {/* Public routes - accessible to all */}
          <Route path="/" component={Landing} />
          <Route path="/partners" component={Partners} />
          <Route path="/member-benefits" component={MemberBenefits} />
          <Route path="/partner-application" component={PartnerApplication} />
          <Route path="/claim-enterprise" component={ClaimEnterprise} />
          <Route path="/claim-enterprise/:enterpriseId/:contactId" component={ClaimEnterprise} />
          
          {/* Role-specific dashboard routes */}
          <Route path="/member/dashboard">
            <MemberOrHigherRoute>
              <MemberDashboard />
            </MemberOrHigherRoute>
          </Route>
          
          <Route path="/enterprise/dashboard">
            <EnterpriseOrAdminRoute>
              <EnterpriseOwnerDashboard />
            </EnterpriseOrAdminRoute>
          </Route>
          
          <Route path="/admin/dashboard">
            <AdminOnlyRoute>
              <AdminDashboard />
            </AdminOnlyRoute>
          </Route>
          
          {/* Admin-only routes */}
          <Route path="/admin/partner-applications">
            <AdminOnlyRoute>
              <AdminPartnerApplications />
            </AdminOnlyRoute>
          </Route>
          
          <Route path="/admin/enterprise-claiming">
            <AdminOnlyRoute>
              <AdminEnterpriseClaiming />
            </AdminOnlyRoute>
          </Route>
          
          <Route path="/admin/users">
            <AdminOnlyRoute>
              <div className="p-8">
                <h1 className="text-2xl font-bold">User Management</h1>
                <p>Coming soon...</p>
              </div>
            </AdminOnlyRoute>
          </Route>
          
          <Route path="/admin/settings">
            <AdminOnlyRoute>
              <div className="p-8">
                <h1 className="text-2xl font-bold">System Settings</h1>
                <p>Coming soon...</p>
              </div>
            </AdminOnlyRoute>
          </Route>
          
          {/* Enterprise Owner and Admin routes */}
          <Route path="/enterprise/management">
            <EnterpriseOrAdminRoute>
              <div className="p-8">
                <h1 className="text-2xl font-bold">Enterprise Management</h1>
                <p>Coming soon...</p>
              </div>
            </EnterpriseOrAdminRoute>
          </Route>
          
          <Route path="/crm">
            <EnterpriseOrAdminRoute>
              <div className="p-8">
                <h1 className="text-2xl font-bold">CRM Dashboard</h1>
                <p>Coming soon...</p>
              </div>
            </EnterpriseOrAdminRoute>
          </Route>
          
          {/* Member and higher routes */}
          <Route path="/dashboard">
            <AuthenticatedRoute>
              <Dashboard />
            </AuthenticatedRoute>
          </Route>
          
          <Route path="/directory*" component={Landing} />
          
          <Route path="/enterprises">
            <AuthenticatedRoute>
              <Enterprises />
            </AuthenticatedRoute>
          </Route>
          
          <Route path="/people">
            <AuthenticatedRoute>
              <People />
            </AuthenticatedRoute>
          </Route>
          
          <Route path="/opportunities">
            <EnterpriseOrAdminRoute>
              <Opportunities />
            </EnterpriseOrAdminRoute>
          </Route>
          
          <Route path="/tasks">
            <AuthenticatedRoute>
              <Tasks />
            </AuthenticatedRoute>
          </Route>
          
          <Route path="/copilot">
            <AuthenticatedRoute>
              <Copilot />
            </AuthenticatedRoute>
          </Route>
          
          <Route path="/bulk-import">
            <AdminOnlyRoute>
              <BulkImport />
            </AdminOnlyRoute>
          </Route>
          
          <Route path="/settings*">
            <AuthenticatedRoute>
              <Settings />
            </AuthenticatedRoute>
          </Route>
          
          {/* Member-specific routes */}
          <Route path="/favorites">
            <MemberOrHigherRoute>
              <div className="p-8">
                <h1 className="text-2xl font-bold">My Favorites</h1>
                <p>Coming soon...</p>
              </div>
            </MemberOrHigherRoute>
          </Route>
          
          <Route path="/profile">
            <MemberOrHigherRoute>
              <div className="p-8">
                <h1 className="text-2xl font-bold">My Profile</h1>
                <p>Coming soon...</p>
              </div>
            </MemberOrHigherRoute>
          </Route>
          
          {/* Placeholder routes for future features */}
          <Route path="/analytics">
            <EnterpriseOrAdminRoute>
              <div className="p-8">
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p>Coming soon...</p>
              </div>
            </EnterpriseOrAdminRoute>
          </Route>
          
          <Route path="/maps">
            <AuthenticatedRoute>
              <div className="p-8">
                <h1 className="text-2xl font-bold">Maps API</h1>
                <p>Coming soon...</p>
              </div>
            </AuthenticatedRoute>
          </Route>
          
          {/* 404 Route */}
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
