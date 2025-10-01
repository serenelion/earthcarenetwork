import PageLayout from "@/components/layouts/PageLayout";
import CrmSidebar from "./CrmSidebar";
import CrmMobileSidebar from "./CrmMobileSidebar";
import CrmBreadcrumbs from "./CrmBreadcrumbs";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout
      title="CRM"
      description="Customer Relationship Management"
      showSidebar={false}
      headerActions={<CrmMobileSidebar />}
    >
      <div className="flex flex-col h-full">
        <CrmBreadcrumbs />
        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden md:block w-64 border-r border-border bg-card" data-testid="crm-sidebar">
            <CrmSidebar />
          </aside>
          <main className="flex-1 overflow-auto" data-testid="crm-main-content">
            {children}
          </main>
        </div>
      </div>
    </PageLayout>
  );
}
