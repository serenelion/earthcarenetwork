import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import ProtectedRoute, { AdminOnlyRoute, EnterpriseOrAdminRoute, MemberOrHigherRoute, AuthenticatedRoute } from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
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
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import NotFound from "@/pages/not-found";
import Search from "@/pages/Search";
import TeamManagement from "@/pages/TeamManagement";
import AcceptInvitation from "@/pages/AcceptInvitation";
import MyEnterprise from "@/pages/MyEnterprise";
import DreamingSessions from "@/pages/DreamingSessions";
// Documentation imports
import DocsLayout from "@/components/docs/DocsLayout";
import DocsHome from "@/pages/docs/DocsHome";
import GettingStarted from "@/pages/docs/GettingStarted";
import APIOverview from "@/pages/docs/APIOverview";
import EnterprisesAPI from "@/pages/docs/EnterprisesAPI";
import AuthenticationAPI from "@/pages/docs/AuthenticationAPI";
import PeopleAPI from "@/pages/docs/PeopleAPI";
import OpportunitiesAPI from "@/pages/docs/OpportunitiesAPI";
import TasksAPI from "@/pages/docs/TasksAPI";
import SearchAPI from "@/pages/docs/SearchAPI";
import AICopilotAPI from "@/pages/docs/AICopilotAPI";
import ExamplesPage from "@/pages/docs/ExamplesPage";
// CRM Shell
import CrmShell from "@/pages/crm/CrmShell";
// Admin Shell
import AdminShell from "@/pages/admin/AdminShell";

function PlaceholderDocPage({ title, description, testId }: { title: string; description: string; testId: string }) {
  return (
    <DocsLayout>
      <div className="max-w-4xl" data-testid={testId}>
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-xl text-muted-foreground mb-6">{description}</p>
        <div className="bg-muted/30 rounded-lg p-6">
          <p>Documentation coming soon...</p>
        </div>
      </div>
    </DocsLayout>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScrollToTop />
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
          <Route path="/claim-profile/:enterpriseId" component={ClaimProfile} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/plans" component={Pricing} />
          <Route path="/dreaming-sessions" component={DreamingSessions} />
          
          {/* Documentation routes - accessible to all */}
          <Route path="/docs">
            <DocsLayout>
              <DocsHome />
            </DocsLayout>
          </Route>
          
          {/* Getting Started Guides */}
          <Route path="/docs/guides/getting-started">
            <DocsLayout>
              <GettingStarted />
            </DocsLayout>
          </Route>
          <Route path="/docs/guides/authentication">
            <PlaceholderDocPage 
              title="Authentication" 
              description="Learn how to authenticate with the Earth Care Network API using Replit Auth."
              testId="auth-guide-page"
            />
          </Route>
          <Route path="/docs/guides/first-api-call">
            <PlaceholderDocPage 
              title="First API Call" 
              description="Make your first request to the Earth Care Network API."
              testId="first-api-call-page"
            />
          </Route>
          
          {/* Integration Guides */}
          <Route path="/docs/guides/enterprise-directory">
            <PlaceholderDocPage 
              title="Enterprise Directory Integration" 
              description="Build a searchable enterprise directory with filters and categories."
              testId="enterprise-directory-guide-page"
            />
          </Route>
          <Route path="/docs/guides/contact-management">
            <PlaceholderDocPage 
              title="Contact Management Integration" 
              description="Implement comprehensive contact and relationship management."
              testId="contact-management-guide-page"
            />
          </Route>
          <Route path="/docs/guides/crm-workflow">
            <PlaceholderDocPage 
              title="CRM Workflow Setup" 
              description="Implement opportunity management and pipeline tracking."
              testId="crm-workflow-guide-page"
            />
          </Route>
          <Route path="/docs/guides/search-integration">
            <PlaceholderDocPage 
              title="Search Integration" 
              description="Implement global search across enterprises, people, and opportunities."
              testId="search-integration-guide-page"
            />
          </Route>
          <Route path="/docs/guides/ai-copilot">
            <PlaceholderDocPage 
              title="AI Copilot Integration" 
              description="Add intelligent lead scoring and suggestions to your application."
              testId="ai-copilot-guide-page"
            />
          </Route>
          
          {/* API Reference */}
          <Route path="/docs/api">
            <DocsLayout>
              <APIOverview />
            </DocsLayout>
          </Route>
          <Route path="/docs/api/authentication">
            <DocsLayout>
              <AuthenticationAPI />
            </DocsLayout>
          </Route>
          <Route path="/docs/api/enterprises">
            <DocsLayout>
              <EnterprisesAPI />
            </DocsLayout>
          </Route>
          <Route path="/docs/api/people">
            <DocsLayout>
              <PeopleAPI />
            </DocsLayout>
          </Route>
          <Route path="/docs/api/opportunities">
            <DocsLayout>
              <OpportunitiesAPI />
            </DocsLayout>
          </Route>
          <Route path="/docs/api/tasks">
            <DocsLayout>
              <TasksAPI />
            </DocsLayout>
          </Route>
          <Route path="/docs/api/search">
            <DocsLayout>
              <SearchAPI />
            </DocsLayout>
          </Route>
          <Route path="/docs/api/ai-copilot">
            <DocsLayout>
              <AICopilotAPI />
            </DocsLayout>
          </Route>
          
          {/* Code Examples */}
          <Route path="/docs/examples">
            <DocsLayout>
              <ExamplesPage />
            </DocsLayout>
          </Route>
          <Route path="/docs/examples/javascript">
            <DocsLayout>
              <ExamplesPage />
            </DocsLayout>
          </Route>
          <Route path="/docs/examples/python">
            <DocsLayout>
              <ExamplesPage />
            </DocsLayout>
          </Route>
          <Route path="/docs/examples/curl">
            <DocsLayout>
              <ExamplesPage />
            </DocsLayout>
          </Route>
          <Route path="/docs/examples/react">
            <DocsLayout>
              <ExamplesPage />
            </DocsLayout>
          </Route>
          
          {/* Tools & Resources */}
          <Route path="/docs/tools/api-explorer">
            <PlaceholderDocPage 
              title="API Explorer" 
              description="Interactive tool to explore and test all API endpoints."
              testId="api-explorer-page"
            />
          </Route>
          <Route path="/docs/tools/postman-collection">
            <PlaceholderDocPage 
              title="Postman Collection" 
              description="Download our comprehensive Postman collection for API testing."
              testId="postman-collection-page"
            />
          </Route>
          <Route path="/docs/reference/errors">
            <PlaceholderDocPage 
              title="Error Codes Reference" 
              description="Complete reference of API error codes and troubleshooting guide."
              testId="error-codes-page"
            />
          </Route>
          <Route path="/docs/reference/rate-limits">
            <PlaceholderDocPage 
              title="Rate Limits" 
              description="API rate limiting policies, quotas, and best practices."
              testId="rate-limits-page"
            />
          </Route>
          <Route path="/docs/reference/webhooks">
            <PlaceholderDocPage 
              title="Webhooks" 
              description="Real-time event notifications and webhook configuration."
              testId="webhooks-page"
            />
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
          
          {/* Admin Panel Routes */}
          <Route path="/admin/featured-enterprises">
            <AdminOnlyRoute>
              <AdminShell />
            </AdminOnlyRoute>
          </Route>
          
          <Route path="/admin/database">
            <AdminOnlyRoute>
              <AdminShell />
            </AdminOnlyRoute>
          </Route>
          
          <Route path="/admin/chat">
            <AdminOnlyRoute>
              <AdminShell />
            </AdminOnlyRoute>
          </Route>
          
          <Route path="/admin/integrations">
            <AdminOnlyRoute>
              <AdminShell />
            </AdminOnlyRoute>
          </Route>
          
          <Route path="/admin">
            <AdminOnlyRoute>
              <AdminShell />
            </AdminOnlyRoute>
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
              <AdminShell />
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
          
          {/* CRM Routes */}
          <Route path="/crm/:enterpriseId/add-enterprise">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm/:enterpriseId/enterprises">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm/:enterpriseId/people">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm/:enterpriseId/opportunities">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm/:enterpriseId/tasks">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm/:enterpriseId/reports">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm/:enterpriseId/pledge-dashboard">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm/:enterpriseId/copilot">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm/:enterpriseId/bulk-import">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm/:enterpriseId/seeding">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm/:enterpriseId/dashboard">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm/:enterpriseId">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          <Route path="/crm">
            <AuthenticatedRoute>
              <WorkspaceProvider>
                <CrmShell />
              </WorkspaceProvider>
            </AuthenticatedRoute>
          </Route>
          
          {/* Member and higher routes */}
          <Route path="/dashboard">
            <AuthenticatedRoute>
              <Dashboard />
            </AuthenticatedRoute>
          </Route>
          
          <Route path="/my-enterprise">
            <AuthenticatedRoute>
              <MyEnterprise />
            </AuthenticatedRoute>
          </Route>
          
          {/* Directory routes - accessible to all */}
          <Route path="/enterprises/:id/team">
            <AuthenticatedRoute>
              <TeamManagement />
            </AuthenticatedRoute>
          </Route>
          <Route path="/enterprises/:id" component={EnterpriseDetail} />
          <Route path="/enterprises" component={Enterprises} />
          <Route path="/directory/land-projects" component={Enterprises} />
          <Route path="/directory/capital-sources" component={Enterprises} />
          <Route path="/directory/open-source-tools" component={Enterprises} />
          <Route path="/directory/network-organizers" component={Enterprises} />
          
          {/* Team invitation routes */}
          <Route path="/team/invitations/accept/:token" component={AcceptInvitation} />
          
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
              <SubscriptionSuccess />
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
      <OnboardingProvider>
        <SubscriptionProvider>
          <FavoritesProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </FavoritesProvider>
        </SubscriptionProvider>
      </OnboardingProvider>
    </QueryClientProvider>
  );
}

export default App;
