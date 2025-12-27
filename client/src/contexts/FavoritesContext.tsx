import { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { UserFavorite, Enterprise } from "@shared/schema";
import { fetchWithGateway } from "@/lib/apiGateway";

// Types for favorites context
interface FavoriteStats {
  total: number;
  byCategory: Record<string, number>;
}

interface FavoriteWithEnterprise extends UserFavorite {
  enterprise: Enterprise;
}

interface FavoritesContextType {
  // Data
  favorites: FavoriteWithEnterprise[];
  favoriteStats: FavoriteStats | undefined;
  favoriteIds: Set<string>;
  
  // Loading states
  isLoadingFavorites: boolean;
  isLoadingStats: boolean;
  
  // Error states
  favoritesError: Error | null;
  statsError: Error | null;
  
  // Helper functions
  isFavorited: (enterpriseId: string) => boolean;
  getFavoriteByEnterpriseId: (enterpriseId: string) => FavoriteWithEnterprise | undefined;
  refreshFavorites: () => void;
  
  // Quick access data
  recentFavorites: FavoriteWithEnterprise[];
  favoritesByCategory: Record<string, FavoriteWithEnterprise[]>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: React.ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user has access to favorites (member-only feature)
  const hasAccess = isAuthenticated && 
    user?.membershipStatus !== 'free' && 
    user?.role !== 'visitor';

  // Fetch user's favorites
  const {
    data: favorites = [],
    isLoading: isLoadingFavorites,
    error: favoritesError,
    refetch: refetchFavorites
  } = useQuery({
    queryKey: ["/api/favorites"],
    queryFn: async (): Promise<FavoriteWithEnterprise[]> => {
      const response = await fetchWithGateway("/api/favorites");
      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }
      return response.json();
    },
    enabled: hasAccess,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch favorites statistics
  const {
    data: favoriteStats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["/api/favorites/stats"],
    queryFn: async (): Promise<FavoriteStats> => {
      const response = await fetchWithGateway("/api/favorites/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch favorites stats");
      }
      return response.json();
    },
    enabled: hasAccess,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create a Set of favorite enterprise IDs for quick lookup
  const favoriteIds = new Set(favorites.map(fav => fav.enterpriseId));

  // Helper function to check if an enterprise is favorited
  const isFavorited = (enterpriseId: string): boolean => {
    return favoriteIds.has(enterpriseId);
  };

  // Helper function to get a favorite by enterprise ID
  const getFavoriteByEnterpriseId = (enterpriseId: string): FavoriteWithEnterprise | undefined => {
    return favorites.find(fav => fav.enterpriseId === enterpriseId);
  };

  // Function to refresh favorites data
  const refreshFavorites = () => {
    refetchFavorites();
    queryClient.invalidateQueries({ queryKey: ["/api/favorites/stats"] });
  };

  // Compute recent favorites (last 10, sorted by creation date)
  const recentFavorites = favorites
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  // Group favorites by category
  const favoritesByCategory = favorites.reduce((acc, favorite) => {
    const category = favorite.enterprise.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(favorite);
    return acc;
  }, {} as Record<string, FavoriteWithEnterprise[]>);

  // Auto-refresh favorites when user logs in or membership changes
  useEffect(() => {
    if (hasAccess) {
      refreshFavorites();
    }
  }, [hasAccess, user?.membershipStatus]);

  const contextValue: FavoritesContextType = {
    // Data
    favorites,
    favoriteStats,
    favoriteIds,
    
    // Loading states
    isLoadingFavorites,
    isLoadingStats,
    
    // Error states
    favoritesError: favoritesError as Error | null,
    statsError: statsError as Error | null,
    
    // Helper functions
    isFavorited,
    getFavoriteByEnterpriseId,
    refreshFavorites,
    
    // Quick access data
    recentFavorites,
    favoritesByCategory,
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

// Custom hook to use the favorites context
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}

// Helper hook to check if a specific enterprise is favorited
export function useIsFavorited(enterpriseId: string) {
  const { isFavorited, isLoadingFavorites } = useFavorites();
  return {
    isFavorited: isFavorited(enterpriseId),
    isLoading: isLoadingFavorites,
  };
}

// Helper hook to get favorite stats
export function useFavoriteStats() {
  const { favoriteStats, isLoadingStats, statsError } = useFavorites();
  return {
    stats: favoriteStats,
    isLoading: isLoadingStats,
    error: statsError,
  };
}

// Helper hook for recent favorites
export function useRecentFavorites(limit = 5) {
  const { recentFavorites, isLoadingFavorites } = useFavorites();
  return {
    recentFavorites: recentFavorites.slice(0, limit),
    isLoading: isLoadingFavorites,
  };
}
