import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
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
  ExternalLink
} from "lucide-react";

interface SidebarProps {
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
  }
];

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside className={cn("w-64 bg-sidebar min-h-screen border-r border-sidebar-border", className)}>
      <nav className="p-4 space-y-6">
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
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
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
              className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              data-testid="nav-spatial-network"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Spatial Network</span>
            </a>
            <a
              href="https://terra-lux.org/terraluxtech/"
              target="_blank"
              rel="noopener noreferrer" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              data-testid="nav-terralux"
            >
              <ExternalLink className="w-4 h-4" />
              <span>TerraLux Tech</span>
            </a>
          </div>
        </div>
      </nav>
    </aside>
  );
}
