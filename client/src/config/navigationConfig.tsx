import { 
  Home, 
  Heart, 
  UserCircle, 
  Shield, 
  FileText, 
  Users, 
  Settings, 
  Crown, 
  ArrowRightLeft,
  LayoutDashboard,
  Book,
  Building2
} from "lucide-react";
import { UserRole } from "@/lib/authUtils";

/**
 * Interface for a navigation link item
 */
export interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ElementType;
  testId: string;
}

/**
 * Interface for a navigation dropdown menu
 */
export interface NavDropdownMenu {
  label: string;
  icon?: React.ElementType;
  testId: string;
  items: NavLinkItem[];
}

/**
 * Public navigation links accessible to everyone (visitors and authenticated users)
 */
export const publicNavLinks: NavLinkItem[] = [
  {
    href: "/docs",
    label: "Docs",
    icon: Book,
    testId: "nav-docs"
  },
  {
    href: "/enterprises",
    label: "Directory",
    icon: Home,
    testId: "nav-directory"
  }
];

/**
 * Member navigation dropdown menu items
 * Accessible to users with 'member', 'enterprise_owner', or 'admin' roles
 */
export const memberNavItems: NavLinkItem[] = [
  {
    href: "/member/dashboard",
    label: "Dashboard",
    icon: Home,
    testId: "nav-member-dashboard"
  },
  {
    href: "/my-enterprise",
    label: "My Enterprise",
    icon: Building2,
    testId: "nav-my-enterprise"
  },
  {
    href: "/favorites",
    label: "Favorites",
    icon: Heart,
    testId: "nav-favorites"
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle,
    testId: "nav-profile"
  }
];

/**
 * Admin navigation dropdown menu items
 * Accessible only to users with 'admin' role
 */
export const adminNavItems: NavLinkItem[] = [
  {
    href: "/admin/dashboard",
    label: "Admin Panel",
    icon: Shield,
    testId: "nav-admin-dashboard"
  },
  {
    href: "/admin/partner-applications",
    label: "Partner Applications",
    icon: FileText,
    testId: "nav-admin-applications"
  },
  {
    href: "/admin/enterprise-claiming",
    label: "Enterprise Claiming",
    icon: Crown,
    testId: "nav-admin-enterprise-claiming"
  },
  {
    href: "/admin/opportunity-transfers",
    label: "Opportunity Transfers",
    icon: ArrowRightLeft,
    testId: "nav-admin-opportunity-transfers"
  },
  {
    href: "/admin/users",
    label: "Manage Users",
    icon: Users,
    testId: "nav-admin-users"
  },
  {
    href: "/admin/settings",
    label: "System Settings",
    icon: Settings,
    testId: "nav-admin-settings"
  }
];

/**
 * CRM navigation link
 * Accessible to users with 'enterprise_owner' or 'admin' roles
 */
export const crmNavLink: NavLinkItem = {
  href: "/crm",
  label: "CRM",
  icon: LayoutDashboard,
  testId: "nav-crm-link"
};

/**
 * Get navigation items based on user role
 * @param role - The user's role
 * @returns Object containing available navigation items for the role
 */
export function getNavigationForRole(role: UserRole) {
  const hasPublic = true;
  const hasMember = ["member", "enterprise_owner", "admin"].includes(role);
  const hasCRM = ["enterprise_owner", "admin"].includes(role);
  const hasAdmin = role === "admin";

  return {
    publicLinks: hasPublic ? publicNavLinks : [],
    memberMenu: hasMember ? memberNavItems : null,
    crmLink: hasCRM ? crmNavLink : null,
    adminMenu: hasAdmin ? adminNavItems : null
  };
}
