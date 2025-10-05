import { Route, Switch } from "wouter";
import CrmLayout from "@/components/crm/CrmLayout";
import EnterpriseAccessGuard from "@/components/guards/EnterpriseAccessGuard";
import Dashboard from "@/pages/crm/Dashboard";
import People from "@/pages/crm/People";
import Opportunities from "@/pages/crm/Opportunities";
import Tasks from "@/pages/crm/Tasks";
import Copilot from "@/pages/crm/Copilot";
import BulkImport from "@/pages/crm/BulkImport";
import CRMEnterprises from "@/pages/crm/CRMEnterprises";
import EnterpriseSeeding from "@/pages/crm/EnterpriseSeeding";
import PledgeDashboard from "@/pages/crm/PledgeDashboard";

const Reports = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Reports</h2>
    <p className="text-muted-foreground">Analytics and reporting features coming soon...</p>
  </div>
);

export default function CrmShell() {
  return (
    <EnterpriseAccessGuard>
      <CrmLayout>
        <Switch>
          <Route path="/crm/:enterpriseId/enterprises" component={CRMEnterprises} />
          <Route path="/crm/:enterpriseId/people" component={People} />
          <Route path="/crm/:enterpriseId/opportunities" component={Opportunities} />
          <Route path="/crm/:enterpriseId/tasks" component={Tasks} />
          <Route path="/crm/:enterpriseId/reports" component={Reports} />
          <Route path="/crm/:enterpriseId/pledge-dashboard" component={PledgeDashboard} />
          <Route path="/crm/:enterpriseId/copilot" component={Copilot} />
          <Route path="/crm/:enterpriseId/bulk-import" component={BulkImport} />
          <Route path="/crm/:enterpriseId/seeding" component={EnterpriseSeeding} />
          <Route path="/crm/:enterpriseId/dashboard" component={Dashboard} />
          <Route path="/crm/:enterpriseId" component={Dashboard} />
        </Switch>
      </CrmLayout>
    </EnterpriseAccessGuard>
  );
}
