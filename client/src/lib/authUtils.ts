import { User } from "@shared/schema";

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export type UserRole = "free" | "crm_pro" | "admin";

/**
 * Check if a user has any of the required roles
 */
export function hasRole(user: User | null | undefined, requiredRoles: UserRole[]): boolean {
  if (!user || !user.role) {
    return false; // Unauthenticated users have no role
  }
  
  return requiredRoles.includes(user.role as UserRole);
}

/**
 * Check if a user has a specific role
 */
export function hasSpecificRole(user: User | null | undefined, requiredRole: UserRole): boolean {
  if (!user || !user.role) {
    return false; // Unauthenticated users have no role
  }
  
  return user.role === requiredRole;
}

/**
 * Get the highest priority role for navigation purposes
 * Admin > CRM Pro > Free
 */
export function getPrimaryRole(user: User | null | undefined): UserRole | null {
  if (!user || !user.role) {
    return null;
  }
  
  return user.role as UserRole;
}

/**
 * Get appropriate redirect path based on user role
 */
export function getDefaultRedirectPath(user: User | null | undefined): string {
  const role = getPrimaryRole(user);
  
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "crm_pro":
    case "free":
      return "/crm"; // All authenticated users can access CRM
    default:
      return "/";
  }
}

/**
 * Get appropriate unauthorized redirect path
 */
export function getUnauthorizedRedirectPath(user: User | null | undefined): string {
  if (!user) {
    return "/member-benefits"; // Encourage non-users to sign up
  }
  
  const role = getPrimaryRole(user);
  
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "crm_pro":
    case "free":
      return "/crm"; // All authenticated users can access CRM
    default:
      return "/";
  }
}

/**
 * Role hierarchy check - higher roles include lower role permissions
 */
export function hasRoleOrHigher(user: User | null | undefined, minRole: UserRole): boolean {
  if (!user || !user.role) {
    return false; // Unauthenticated users have no role
  }
  
  const userRole = user.role as UserRole;
  const roleHierarchy: UserRole[] = ["free", "crm_pro", "admin"];
  
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const minRoleIndex = roleHierarchy.indexOf(minRole);
  
  return userRoleIndex >= minRoleIndex;
}