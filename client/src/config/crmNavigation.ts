import {
  LayoutDashboard,
  Building,
  Users,
  TrendingUp,
  CheckSquare,
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

export function getCrmNavSections(enterpriseId: string): NavSection[] {
  return [
    {
      title: "Manage",
      links: [
        { href: `/crm/${enterpriseId}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
        { href: `/crm/${enterpriseId}/enterprises`, label: "Enterprises", icon: Building },
        { href: `/crm/${enterpriseId}/people`, label: "People", icon: Users },
        { href: `/crm/${enterpriseId}/opportunities`, label: "Opportunities", icon: TrendingUp },
        { href: `/crm/${enterpriseId}/tasks`, label: "Tasks", icon: CheckSquare },
      ],
    },
    {
      title: "Insights",
      links: [
        { href: `/crm/${enterpriseId}/copilot`, label: "Copilot", icon: Sparkles },
      ],
    },
    {
      title: "Operations",
      links: [
        { href: `/crm/${enterpriseId}/bulk-import`, label: "Bulk Import", icon: Upload },
        { href: `/crm/${enterpriseId}/seeding`, label: "Enterprise Seeding", icon: Sprout },
      ],
    },
  ];
}
