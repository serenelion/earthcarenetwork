import { useAuth } from "@/hooks/useAuth";
import { hasRole, getUnauthorizedRedirectPath, UserRole } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { User } from "@shared/schema";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
  fallbackPath?: string;
  loadingComponent?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles, 
  fallbackPath,
  loadingComponent 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Check if user has required role
    if (!hasRole(user, requiredRoles)) {
      const redirectPath = fallbackPath || getUnauthorizedRedirectPath(user);
      setLocation(redirectPath);
    }
  }, [user, isLoading, requiredRoles, fallbackPath, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen" data-testid="protected-route-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has required role
  if (!hasRole(user, requiredRoles)) {
    // Return null while redirecting to prevent flash of unauthorized content
    return null;
  }

  return <>{children}</>;
}

// Convenience components for common role combinations
export function AdminOnlyRoute({ children, fallbackPath }: { children: React.ReactNode; fallbackPath?: string }) {
  return (
    <ProtectedRoute requiredRoles={["admin"]} fallbackPath={fallbackPath}>
      {children}
    </ProtectedRoute>
  );
}

export function CrmProOrAdminRoute({ children, fallbackPath }: { children: React.ReactNode; fallbackPath?: string }) {
  return (
    <ProtectedRoute requiredRoles={["crm_pro", "admin"]} fallbackPath={fallbackPath}>
      {children}
    </ProtectedRoute>
  );
}

export function AuthenticatedRoute({ children, fallbackPath }: { children: React.ReactNode; fallbackPath?: string }) {
  return (
    <ProtectedRoute requiredRoles={["free", "crm_pro", "admin"]} fallbackPath={fallbackPath || "/member-benefits"}>
      {children}
    </ProtectedRoute>
  );
}

// Legacy aliases for backwards compatibility during migration
export const EnterpriseOrAdminRoute = CrmProOrAdminRoute;
export const MemberOrHigherRoute = AuthenticatedRoute;