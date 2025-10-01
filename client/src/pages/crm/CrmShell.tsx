import { Route, Switch } from "wouter";
import CrmLayout from "@/components/crm/CrmLayout";
import Dashboard from "@/pages/crm/Dashboard";
import People from "@/pages/crm/People";
import Opportunities from "@/pages/crm/Opportunities";
import Tasks from "@/pages/crm/Tasks";
import Copilot from "@/pages/crm/Copilot";
import BulkImport from "@/pages/crm/BulkImport";
import CRMEnterprises from "@/pages/crm/CRMEnterprises";

const Reports = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Reports</h2>
    <p className="text-muted-foreground">Analytics and reporting features coming soon...</p>
  </div>
);

export default function CrmShell() {
  return (
    <CrmLayout>
      <Switch>
        <Route path="/crm/enterprises" component={CRMEnterprises} />
        <Route path="/crm/people" component={People} />
        <Route path="/crm/opportunities" component={Opportunities} />
        <Route path="/crm/tasks" component={Tasks} />
        <Route path="/crm/reports" component={Reports} />
        <Route path="/crm/copilot" component={Copilot} />
        <Route path="/crm/bulk-import" component={BulkImport} />
        <Route path="/crm" component={Dashboard} />
      </Switch>
    </CrmLayout>
  );
}
