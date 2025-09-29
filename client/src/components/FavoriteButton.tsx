import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  enterpriseId: string;
  enterpriseName?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export default function FavoriteButton({
  enterpriseId,
  enterpriseName = "enterprise",
  variant = "ghost",
  size = "md",
  showLabel = false,
  className
}: FavoriteButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if enterprise is favorited
  const { data: favoriteStatus, isLoading: isCheckingStatus } = useQuery({
    queryKey: ["/api/enterprises", enterpriseId, "favorite-status"],
    queryFn: async (): Promise<{ isFavorited: boolean }> => {
      const response = await fetch(`/api/enterprises/${enterpriseId}/favorite-status`);
      if (!response.ok) throw new Error("Failed to check favorite status");
      return response.json();
    },
    enabled: isAuthenticated && !!enterpriseId,
    retry: false,
  });

  const isFavorited = favoriteStatus?.isFavorited || false;

  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/favorites", { enterpriseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises", enterpriseId, "favorite-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/stats"] });
      
      toast({
        title: "Added to favorites",
        description: `${enterpriseName} has been added to your favorites.`,
      });
    },
    onError: (error) => {
      console.error("Error adding favorite:", error);
      toast({
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/favorites/${enterpriseId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises", enterpriseId, "favorite-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/stats"] });
      
      toast({
        title: "Removed from favorites",
        description: `${enterpriseName} has been removed from your favorites.`,
      });
    },
    onError: (error) => {
      console.error("Error removing favorite:", error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to save favorites.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has member access
    if (user?.membershipStatus === 'free' || user?.role === 'visitor') {
      toast({
        title: "Member feature",
        description: "Favorites are available to members only. Upgrade to save your favorite enterprises.",
        variant: "destructive",
      });
      return;
    }

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  const isLoading = isCheckingStatus || addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        "relative transition-all duration-200 hover:scale-105",
        isAnimating && "animate-pulse",
        className
      )}
      data-testid={`button-favorite-${enterpriseId}`}
      title={isFavorited ? `Remove ${enterpriseName} from favorites` : `Add ${enterpriseName} to favorites`}
    >
      <Heart
        className={cn(
          iconSizes[size],
          "transition-all duration-200",
          isFavorited 
            ? "fill-red-500 text-red-500" 
            : "text-muted-foreground hover:text-red-400",
          isLoading && "animate-pulse",
          isAnimating && "scale-125"
        )}
        data-testid={`icon-heart-${enterpriseId}`}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
          <div className="h-3 w-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {showLabel && (
        <span className="sr-only">
          {isFavorited ? "Remove from favorites" : "Add to favorites"}
        </span>
      )}
    </Button>
  );
}

// Alternative compact version for use in tight spaces
export function CompactFavoriteButton({ 
  enterpriseId, 
  enterpriseName,
  className 
}: Pick<FavoriteButtonProps, "enterpriseId" | "enterpriseName" | "className">) {
  return (
    <FavoriteButton
      enterpriseId={enterpriseId}
      enterpriseName={enterpriseName}
      variant="ghost"
      size="sm"
      className={cn("h-6 w-6", className)}
    />
  );
}

// Version with text label for dashboard use
export function LabeledFavoriteButton({ 
  enterpriseId, 
  enterpriseName,
  className 
}: Pick<FavoriteButtonProps, "enterpriseId" | "enterpriseName" | "className">) {
  return (
    <FavoriteButton
      enterpriseId={enterpriseId}
      enterpriseName={enterpriseName}
      variant="outline"
      size="md"
      showLabel={true}
      className={className}
    />
  );
}