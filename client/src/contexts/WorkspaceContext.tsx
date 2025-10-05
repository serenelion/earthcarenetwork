import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Enterprise, InsertEnterprise } from "@shared/schema";
import type { TeamMemberRole } from "@/lib/api";

export interface UserEnterprise extends Pick<Enterprise, 'id' | 'name' | 'category' | 'isVerified' | 'imageUrl'> {
  role: TeamMemberRole;
}

interface WorkspaceContextValue {
  currentEnterprise: UserEnterprise | null;
  userEnterprises: UserEnterprise[];
  isLoading: boolean;
  switchEnterprise: (enterpriseId: string) => void;
  hasRole: (minRole: TeamMemberRole) => boolean;
  createEnterprise: (data: InsertEnterprise) => Promise<Enterprise>;
  refreshEnterprises: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const STORAGE_KEY = "currentEnterpriseId";

const roleHierarchy: Record<TeamMemberRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentEnterprise, setCurrentEnterprise] = useState<UserEnterprise | null>(null);
  const [, setLocation] = useLocation();

  const { data: userEnterprises = [], isLoading } = useQuery<UserEnterprise[]>({
    queryKey: ["/api/crm/user/enterprises"],
    queryFn: async () => {
      const response = await fetch("/api/crm/user/enterprises");
      if (!response.ok) {
        throw new Error("Failed to fetch user enterprises");
      }
      return response.json();
    },
  });

  // Initialize current enterprise on mount or when enterprises load
  useEffect(() => {
    if (!isLoading && userEnterprises.length > 0 && !currentEnterprise) {
      // Try to load saved enterprise from localStorage
      const savedEnterpriseId = localStorage.getItem(STORAGE_KEY);
      
      let enterpriseToSet: UserEnterprise | null = null;
      
      if (savedEnterpriseId) {
        // Check if saved enterprise is still accessible
        const savedEnterprise = userEnterprises.find(e => e.id === savedEnterpriseId);
        if (savedEnterprise) {
          enterpriseToSet = savedEnterprise;
        }
      }
      
      // If no saved enterprise or it's not accessible, use first available
      if (!enterpriseToSet) {
        enterpriseToSet = userEnterprises[0];
      }
      
      setCurrentEnterprise(enterpriseToSet);
      localStorage.setItem(STORAGE_KEY, enterpriseToSet.id);
    }
  }, [userEnterprises, isLoading, currentEnterprise]);

  const switchEnterprise = (enterpriseId: string) => {
    const enterprise = userEnterprises.find(e => e.id === enterpriseId);
    if (!enterprise) {
      console.error("Enterprise not found:", enterpriseId);
      return;
    }

    // Update current enterprise
    setCurrentEnterprise(enterprise);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, enterpriseId);
    
    // Invalidate all CRM queries to refetch data for new enterprise
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const queryKey = query.queryKey;
        // Invalidate queries that are related to CRM data
        return Array.isArray(queryKey) && 
               (queryKey.some(key => typeof key === 'string' && key.includes('/api/crm')));
      }
    });
    
    // Navigate to dashboard of new enterprise
    setLocation(`/crm/${enterpriseId}/dashboard`);
  };

  const hasRole = (minRole: TeamMemberRole): boolean => {
    if (!currentEnterprise) return false;
    
    const currentRoleLevel = roleHierarchy[currentEnterprise.role];
    const requiredRoleLevel = roleHierarchy[minRole];
    
    return currentRoleLevel >= requiredRoleLevel;
  };

  const createEnterprise = async (data: InsertEnterprise): Promise<Enterprise> => {
    try {
      const response = await apiRequest('POST', '/api/crm/enterprises', data);
      const enterprise = await response.json();
      
      // Invalidate queries to refresh the user's enterprises list
      await queryClient.invalidateQueries({ queryKey: ['/api/crm/user/enterprises'] });
      
      // Navigate to the new enterprise dashboard
      setLocation(`/crm/${enterprise.id}/dashboard`);
      
      return enterprise;
    } catch (error) {
      console.error("Error creating enterprise:", error);
      throw error;
    }
  };

  const refreshEnterprises = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/crm/user/enterprises'] });
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentEnterprise,
        userEnterprises,
        isLoading,
        switchEnterprise,
        hasRole,
        createEnterprise,
        refreshEnterprises,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
