import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import ProtectedRoute, { AdminOnlyRoute, EnterpriseOrAdminRoute, MemberOrHigherRoute, AuthenticatedRoute } from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";
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
import Favorites from "@/pages/Favorites";
import AdminPartnerApplications from "@/pages/AdminPartnerApplications";
import EnterpriseDetail from "@/pages/EnterpriseDetail";
import AdminEnterpriseClaiming from "@/pages/AdminEnterpriseClaiming";
import AdminOpportunityTransfers from "@/pages/AdminOpportunityTransfers";
import ClaimEnterprise from "@/pages/ClaimEnterprise";
import ClaimProfile from "@/pages/ClaimProfile";
import Pricing from "@/pages/Pricing";
import SubscriptionDashboard from "@/pages/SubscriptionDashboard";
import NotFound from "@/pages/not-found";
import Search from "@/pages/Search";
// Documentation imports
import DocsLayout from "@/components/docs/DocsLayout";
import DocsHome from "@/pages/docs/DocsHome";
import GettingStarted from "@/pages/docs/GettingStarted";
import APIOverview from "@/pages/docs/APIOverview";
import EnterprisesAPI from "@/pages/docs/EnterprisesAPI";
// CRM Shell
import CrmShell from "@/pages/crm/CrmShell";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main>
        <Switch>
          {/* Public routes - accessible to all */}
          <Route path="/" component={Landing} />
          <Route path="/search" component={Search} />
          <Route path="/partners" component={Partners} />
          <Route path="/member-benefits" component={MemberBenefits} />
          <Route path="/claim-enterprise" component={ClaimEnterprise} />
          <Route path="/claim-enterprise/:enterpriseId/:contactId" component={ClaimEnterprise} />
          <Route path="/claim-profile" component={ClaimProfile} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/plans" component={Pricing} />
          
          {/* Documentation routes - accessible to all */}
          <Route path="/docs*">
            <DocsLayout />
          </Route>
          
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
          
          <Route path="/admin/opportunity-transfers">
            <AdminOnlyRoute>
              <AdminOpportunityTransfers />
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
              <CrmShell />
            </EnterpriseOrAdminRoute>
          </Route>
          <Route path="/crm/:rest*">
            <EnterpriseOrAdminRoute>
              <CrmShell />
            </EnterpriseOrAdminRoute>
          </Route>
          
          {/* Member and higher routes */}
          <Route path="/dashboard">
            <AuthenticatedRoute>
              <Dashboard />
            </AuthenticatedRoute>
          </Route>
          
          {/* Directory routes - accessible to all */}
          <Route path="/enterprises/:id" component={EnterpriseDetail} />
          <Route path="/enterprises" component={Enterprises} />
          <Route path="/directory/land-projects" component={Enterprises} />
          <Route path="/directory/capital-sources" component={Enterprises} />
          <Route path="/directory/open-source-tools" component={Enterprises} />
          <Route path="/directory/network-organizers" component={Enterprises} />
          
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
          
          {/* Subscription routes */}
          <Route path="/subscription/dashboard">
            <AuthenticatedRoute>
              <SubscriptionDashboard />
            </AuthenticatedRoute>
          </Route>

          <Route path="/subscription/success">
            <AuthenticatedRoute>
              <div className="p-8 text-center max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-green-600 mb-4">Subscription Successful!</h1>
                <p className="text-muted-foreground mb-8">
                  Welcome to your new subscription. You now have access to all the features of your plan.
                </p>
                <div className="space-x-4">
                  <Button asChild>
                    <Link href="/subscription/dashboard">View Dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/crm">Start Using CRM</Link>
                  </Button>
                </div>
              </div>
            </AuthenticatedRoute>
          </Route>

          <Route path="/subscription/canceled">
            <AuthenticatedRoute>
              <div className="p-8 text-center max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Subscription Canceled</h1>
                <p className="text-muted-foreground mb-8">
                  Your subscription process was canceled. No charges were made.
                </p>
                <div className="space-x-4">
                  <Button asChild>
                    <Link href="/pricing">View Plans</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Return to Dashboard</Link>
                  </Button>
                </div>
              </div>
            </AuthenticatedRoute>
          </Route>

          {/* Member-specific routes */}
          <Route path="/favorites">
            <MemberOrHigherRoute>
              <Favorites />
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
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SubscriptionProvider>
        <FavoritesProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </FavoritesProvider>
      </SubscriptionProvider>
    </QueryClientProvider>
  );
}

export default App;
