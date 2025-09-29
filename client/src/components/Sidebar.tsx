import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  Handshake, 
  CheckSquare, 
  Bot, 
  BarChart3, 
  Download, 
  Map,
  ExternalLink,
  Menu,
  X,
  Settings
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

interface MobileMenuButtonProps {
  className?: string;
}

const navigationItems = [
  {
    title: "Core CRM",
    items: [
      { 
        title: "Dashboard", 
        href: "/", 
        icon: LayoutDashboard 
      },
      { 
        title: "Enterprises", 
        href: "/enterprises", 
        icon: Building 
      },
      { 
        title: "People", 
        href: "/people", 
        icon: Users 
      },
      { 
        title: "Opportunities", 
        href: "/opportunities", 
        icon: Handshake 
      },
      { 
        title: "Tasks", 
        href: "/tasks", 
        icon: CheckSquare 
      },
    ]
  },
  {
    title: "Intelligence",
    items: [
      { 
        title: "EarthCare Copilot", 
        href: "/copilot", 
        icon: Bot 
      },
      { 
        title: "Analytics", 
        href: "/analytics", 
        icon: BarChart3 
      },
    ]
  },
  {
    title: "Integrations",
    items: [
      { 
        title: "Bulk Import", 
        href: "/bulk-import", 
        icon: Download 
      },
      { 
        title: "Maps API", 
        href: "/maps", 
        icon: Map 
      },
    ]
  },
  {
    title: "Workspace",
    items: [
      { 
        title: "Settings", 
        href: "/settings", 
        icon: Settings 
      },
    ]
  }
];

// Sidebar content component - shared between desktop and mobile
function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const [location] = useLocation();

  return (
    <nav className="p-4 space-y-6 h-full">
      {navigationItems.map((section) => (
        <div key={section.title}>
          <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3">
            {section.title}
          </div>
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium touch-manipulation",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground active:bg-sidebar-accent/30"
                  )}
                  data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* External Links */}
      <div className="border-t border-sidebar-border pt-4">
        <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3">
          External Tools
        </div>
        <div className="space-y-1">
          <a
            href="https://thespatialnetwork.net"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground active:bg-sidebar-accent/30 touch-manipulation"
            data-testid="nav-spatial-network"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Spatial Network</span>
          </a>
          <a
            href="https://terra-lux.org/terraluxtech/"
            target="_blank"
            rel="noopener noreferrer" 
            className="flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground active:bg-sidebar-accent/30 touch-manipulation"
            data-testid="nav-terralux"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">TerraLux Tech</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

// Mobile menu button component for reuse
export function MobileMenuButton({ className }: MobileMenuButtonProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("md:hidden", className)}
          data-testid="button-mobile-menu"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 bg-sidebar border-sidebar-border">
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <SheetTitle className="text-left text-sidebar-foreground font-lato">
            Earth Network CRM
          </SheetTitle>
        </SheetHeader>
        <SidebarContent onItemClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// Main Sidebar component
export default function Sidebar({ className }: SidebarProps) {
  const isMobile = useIsMobile();

  // On mobile, return null (sidebar is handled by MobileMenuButton)
  if (isMobile) {
    return null;
  }

  // Desktop sidebar
  return (
    <aside className={cn("hidden md:flex w-64 bg-sidebar min-h-screen border-r border-sidebar-border flex-col", className)}>
      <SidebarContent />
    </aside>
  );
}
