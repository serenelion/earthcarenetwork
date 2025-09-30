import { useState } from "react";
import { Route, Switch, useLocation, Link } from "wouter";
import PageLayout from "@/components/layouts/PageLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Building,
  Users,
  TrendingUp,
  CheckSquare,
  BarChart3,
  Sparkles,
  Upload,
  Menu,
  ChevronRight,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import Dashboard from "@/pages/Dashboard";
import People from "@/pages/People";
import Opportunities from "@/pages/Opportunities";
import Tasks from "@/pages/Tasks";
import Copilot from "@/pages/Copilot";
import BulkImport from "@/pages/BulkImport";
import CRMEnterprises from "@/pages/crm/CRMEnterprises";

const Reports = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Reports</h2>
    <p className="text-muted-foreground">Analytics and reporting features coming soon...</p>
  </div>
);

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  links: NavLink[];
}

const navSections: NavSection[] = [
  {
    title: "Manage",
    links: [
      { href: "/crm", label: "Dashboard", icon: LayoutDashboard },
      { href: "/crm/enterprises", label: "Enterprises", icon: Building },
      { href: "/crm/people", label: "People", icon: Users },
      { href: "/crm/opportunities", label: "Opportunities", icon: TrendingUp },
      { href: "/crm/tasks", label: "Tasks", icon: CheckSquare },
    ],
  },
  {
    title: "Insights",
    links: [
      { href: "/crm/reports", label: "Reports", icon: BarChart3 },
      { href: "/crm/copilot", label: "Copilot", icon: Sparkles },
    ],
  },
  {
    title: "Operations",
    links: [
      { href: "/crm/bulk-import", label: "Bulk Import", icon: Upload },
    ],
  },
];

function CrmSidebar() {
  const [location] = useLocation();

  return (
    <ScrollArea className="h-full py-6">
      <div className="space-y-6 px-3">
        {navSections.map((section, index) => (
          <div key={section.title}>
            {index > 0 && <Separator className="mb-4" />}
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              {section.links.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.href;
                
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-secondary text-secondary-foreground"
                      )}
                      data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function MobileCrmSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          data-testid="mobile-menu-trigger"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="py-4">
          <h2 className="px-6 text-lg font-semibold">CRM Navigation</h2>
        </div>
        <Separator />
        <CrmSidebar />
      </SheetContent>
    </Sheet>
  );
}

function CrmBreadcrumbs() {
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

export default function CrmShell() {
  return (
    <PageLayout
      title="CRM"
      description="Customer Relationship Management"
      showSidebar={false}
      headerActions={<MobileCrmSidebar />}
    >
      <div className="flex flex-col h-full">
        <CrmBreadcrumbs />
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 border-r border-border bg-card" data-testid="crm-sidebar">
            <CrmSidebar />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto" data-testid="crm-main-content">
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
          </main>
        </div>
      </div>
    </PageLayout>
  );
}
