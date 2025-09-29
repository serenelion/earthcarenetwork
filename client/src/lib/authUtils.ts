import { User } from "@shared/schema";

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export type UserRole = "visitor" | "member" | "enterprise_owner" | "admin";

/**
 * Check if a user has any of the required roles
 */
export function hasRole(user: User | null | undefined, requiredRoles: UserRole[]): boolean {
  if (!user || !user.role) {
    return requiredRoles.includes("visitor");
  }
  
  return requiredRoles.includes(user.role as UserRole);
}

/**
 * Check if a user has a specific role
 */
export function hasSpecificRole(user: User | null | undefined, requiredRole: UserRole): boolean {
  if (!user || !user.role) {
    return requiredRole === "visitor";
  }
  
  return user.role === requiredRole;
}

/**
 * Get the highest priority role for navigation purposes
 * Admin > Enterprise Owner > Member > Visitor
 */
export function getPrimaryRole(user: User | null | undefined): UserRole {
  if (!user || !user.role) {
    return "visitor";
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
    case "enterprise_owner":
      return "/enterprise/dashboard";
    case "member":
      return "/member/dashboard";
    default:
      return "/";
  }
}

/**
 * Get appropriate unauthorized redirect path
 */
export function getUnauthorizedRedirectPath(user: User | null | undefined): string {
  if (!user) {
    return "/member-benefits"; // Encourage non-users to become members
  }
  
  const role = getPrimaryRole(user);
  
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "enterprise_owner":
      return "/enterprise/dashboard";
    case "member":
      return "/member/dashboard";
    default:
      return "/";
  }
}

/**
 * Role hierarchy check - higher roles include lower role permissions
 */
export function hasRoleOrHigher(user: User | null | undefined, minRole: UserRole): boolean {
  if (!user || !user.role) {
    return minRole === "visitor";
  }
  
  const userRole = user.role as UserRole;
  const roleHierarchy: UserRole[] = ["visitor", "member", "enterprise_owner", "admin"];
  
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const minRoleIndex = roleHierarchy.indexOf(minRole);
  
  return userRoleIndex >= minRoleIndex;
}