import {
  LayoutDashboard,
  Building,
  Users,
  TrendingUp,
  CheckSquare,
  BarChart3,
  Sparkles,
  Upload,
  Sprout,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

export interface NavSection {
  title: string;
  links: NavLink[];
}

export const crmNavSections: NavSection[] = [
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
      { href: "/crm/pledge-dashboard", label: "Pledge Dashboard", icon: TrendingUp },
      { href: "/crm/copilot", label: "Copilot", icon: Sparkles },
    ],
  },
  {
    title: "Operations",
    links: [
      { href: "/crm/bulk-import", label: "Bulk Import", icon: Upload },
      { href: "/crm/seeding", label: "Enterprise Seeding", icon: Sprout },
    ],
  },
];
