import { useLocation } from "wouter";
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
import AddEnterprise from "@/pages/crm/AddEnterprise";

const Reports = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Reports</h2>
    <p className="text-muted-foreground">Analytics and reporting features coming soon...</p>
  </div>
);

export default function CrmShell() {
  const [location] = useLocation();
  
  // Determine which component to render based on the current route
  let PageComponent = Dashboard; // default
  
  if (location.includes('/add-enterprise')) {
    PageComponent = AddEnterprise;
  } else if (location.includes('/enterprises')) {
    PageComponent = CRMEnterprises;
  } else if (location.includes('/people')) {
    PageComponent = People;
  } else if (location.includes('/opportunities')) {
    PageComponent = Opportunities;
  } else if (location.includes('/tasks')) {
    PageComponent = Tasks;
  } else if (location.includes('/reports')) {
    PageComponent = Reports;
  } else if (location.includes('/pledge-dashboard')) {
    PageComponent = PledgeDashboard;
  } else if (location.includes('/copilot')) {
    PageComponent = Copilot;
  } else if (location.includes('/bulk-import')) {
    PageComponent = BulkImport;
  } else if (location.includes('/seeding')) {
    PageComponent = EnterpriseSeeding;
  }
  
  return (
    <EnterpriseAccessGuard>
      <CrmLayout>
        <PageComponent />
      </CrmLayout>
    </EnterpriseAccessGuard>
  );
}
