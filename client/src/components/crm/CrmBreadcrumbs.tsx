import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LayoutDashboard, ChevronRight, Globe } from "lucide-react";

export default function CrmBreadcrumbs() {
  const [location] = useLocation();

  const getSectionName = () => {
    if (location === '/crm') return 'Dashboard';
    if (location.startsWith('/crm/enterprises')) return 'Enterprises';
    if (location.startsWith('/crm/people')) return 'People';
    if (location.startsWith('/crm/opportunities')) return 'Opportunities';
    if (location.startsWith('/crm/tasks')) return 'Tasks';
    if (location.startsWith('/crm/reports')) return 'Reports';
    if (location.startsWith('/crm/copilot')) return 'Copilot';
    if (location.startsWith('/crm/bulk-import')) return 'Bulk Import';
    return 'Dashboard';
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
      <Breadcrumb data-testid="crm-breadcrumbs">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/crm" className="flex items-center gap-1">
                <LayoutDashboard className="h-4 w-4" />
                CRM
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {location !== '/crm' && (
            <>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{getSectionName()}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <Button
        variant="ghost"
        size="sm"
        asChild
        data-testid="quick-switch-to-directory"
      >
        <Link href="/enterprises" className="flex items-center gap-1">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">View Public Directory</span>
        </Link>
      </Button>
    </div>
  );
}
