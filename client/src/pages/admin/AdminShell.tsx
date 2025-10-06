import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link, Route, Switch } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu, Star, Database, MessageSquare, Puzzle } from "lucide-react";
import { useState } from "react";
import FeaturedEnterprises from "./FeaturedEnterprises";

const adminNavSections = [
  {
    title: "Content Management",
    links: [
      {
        href: "/admin/featured-enterprises",
        label: "Featured Enterprises",
        icon: Star,
      },
    ],
  },
  {
    title: "Platform Tools",
    links: [
      {
        href: "/admin/database",
        label: "Database",
        icon: Database,
      },
      {
        href: "/admin/chat",
        label: "AI Chat",
        icon: MessageSquare,
      },
      {
        href: "/admin/integrations",
        label: "Integrations",
        icon: Puzzle,
      },
    ],
  },
];

function AdminSidebar() {
  const [location] = useLocation();

  return (
    <ScrollArea className="h-full py-6">
      <div className="space-y-6 px-3">
        {adminNavSections.map((section, index) => (
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
                      aria-current={isActive ? "page" : undefined}
                      data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
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

function AdminMobileSidebar() {
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
          <SheetTitle className="px-6 text-lg font-semibold">Admin Panel</SheetTitle>
        </div>
        <Separator />
        <AdminSidebar />
      </SheetContent>
    </Sheet>
  );
}

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6">{description}</p>
      <div className="bg-muted/30 rounded-lg p-6">
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  );
}

export default function AdminShell() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="admin-shell-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    setLocation("/");
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card" data-testid="admin-sidebar">
        <div className="flex flex-col w-full">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <p className="text-sm text-muted-foreground">Platform management</p>
          </div>
          <AdminSidebar />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden border-b bg-card p-4 flex items-center gap-4" data-testid="admin-mobile-header">
          <AdminMobileSidebar />
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto" data-testid="admin-content">
          <Switch>
            <Route path="/admin/featured-enterprises">
              <FeaturedEnterprises />
            </Route>
            <Route path="/admin/database">
              <PlaceholderPage
                title="Database Admin"
                description="Manage database tables, records, and configurations"
              />
            </Route>
            <Route path="/admin/chat">
              <PlaceholderPage
                title="AI Chat Admin"
                description="Monitor and manage AI chat interactions"
              />
            </Route>
            <Route path="/admin/integrations">
              <PlaceholderPage
                title="Integrations Management"
                description="Configure and manage platform integrations"
              />
            </Route>
            <Route path="/admin">
              <FeaturedEnterprises />
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}
