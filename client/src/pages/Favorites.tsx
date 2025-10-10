import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  Search,
  Filter,
  Grid3X3,
  List,
  MapPin,
  ExternalLink,
  Calendar,
  StickyNote,
  Sparkles,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "land_projects", label: "Land Projects" },
  { value: "capital_sources", label: "Capital Sources" },
  { value: "open_source_tools", label: "Open Source Tools" },
  { value: "network_organizers", label: "Network Organizers" },
  { value: "homes_that_heal", label: "Homes that Heal" },
  { value: "landscapes_that_nourish", label: "Landscapes that Nourish" },
  { value: "lifelong_learning_providers", label: "Lifelong Learning" },
];

const categoryColors = {
  land_projects: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  capital_sources: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  open_source_tools: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  network_organizers: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  homes_that_heal: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
  landscapes_that_nourish: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  lifelong_learning_providers: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};

export default function Favorites() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const {
    favorites,
    favoriteStats,
    isLoadingFavorites,
    favoritesError,
    favoritesByCategory,
  } = useFavorites();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter favorites based on search and category
  const filteredFavorites = useMemo(() => {
    let filtered = favorites;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(fav => fav.enterprise.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fav => 
        fav.enterprise.name.toLowerCase().includes(query) ||
        fav.enterprise.description?.toLowerCase().includes(query) ||
        fav.enterprise.location?.toLowerCase().includes(query) ||
        fav.notes?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [favorites, selectedCategory, searchQuery]);

  // Loading skeleton
  if (isLoadingFavorites) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (favoritesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Favorites</CardTitle>
            <CardDescription>
              There was an issue loading your favorites. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <div className="container mx-auto px-4 py-8" data-testid="favorites-page">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground" data-testid="favorites-title">
              My Favorites
            </h1>
          </div>
          <p className="text-muted-foreground mb-4" data-testid="favorites-description">
            Your saved enterprises and organizations from the Earth Care Network.
          </p>
          
          {/* Stats */}
          {favoriteStats && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span data-testid="favorites-total-count">
                <strong>{favoriteStats.total}</strong> favorites
              </span>
              {favoriteStats.total > 0 && (
                <span>
                  across <strong>{Object.keys(favoriteStats.byCategory).length}</strong> categories
                </span>
              )}
            </div>
          )}
        </div>

        {/* Empty State */}
        {favorites.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No Favorites Yet</CardTitle>
              <CardDescription className="mb-6 max-w-md mx-auto">
                Start exploring the Earth Care Network directory and save enterprises that interest you. 
                Click the heart icon on any enterprise card to add it to your favorites.
              </CardDescription>
              <Link href="/enterprises">
                <Button data-testid="button-browse-enterprises">
                  Browse Enterprises
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters and Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search favorites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-favorites"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48" data-testid="select-category-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="border rounded-md p-1 flex">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    data-testid="button-grid-view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    data-testid="button-list-view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground" data-testid="search-results-count">
                {filteredFavorites.length === favorites.length
                  ? `${favorites.length} favorites`
                  : `${filteredFavorites.length} of ${favorites.length} favorites`}
              </p>
            </div>

            {/* No Results */}
            {filteredFavorites.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <CardTitle className="text-lg mb-2">No Matches Found</CardTitle>
                  <CardDescription>
                    Try adjusting your search terms or category filter.
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Favorites Grid/List */
              <div className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              )}>
                {filteredFavorites.map((favorite) => (
                  <Card 
                    key={favorite.id} 
                    className={cn(
                      "group hover:shadow-lg transition-all duration-200 relative",
                      viewMode === "list" && "flex flex-row"
                    )}
                    data-testid={`card-favorite-${favorite.enterpriseId}`}
                  >
                    <div className="absolute top-3 right-3 z-10">
                      <FavoriteButton
                        enterpriseId={favorite.enterpriseId}
                        enterpriseName={favorite.enterprise.name}
                        size="sm"
                      />
                    </div>

                    <CardHeader className={cn(viewMode === "list" && "flex-1")}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-lg leading-tight pr-8">
                          <Link href={`/enterprises/${favorite.enterpriseId}`}>
                            <span className="hover:text-primary transition-colors cursor-pointer">
                              {favorite.enterprise.name}
                            </span>
                          </Link>
                        </CardTitle>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="secondary" 
                          className={categoryColors[favorite.enterprise.category as keyof typeof categoryColors]}
                        >
                          {categories.find(c => c.value === favorite.enterprise.category)?.label}
                        </Badge>
                        {favorite.enterprise.isVerified && (
                          <Badge variant="outline" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>

                      {favorite.enterprise.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          {favorite.enterprise.location}
                        </div>
                      )}

                      <CardDescription className="line-clamp-2">
                        {favorite.enterprise.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className={cn("pt-0", viewMode === "list" && "flex-shrink-0")}>
                      {favorite.notes && (
                        <div className="bg-muted p-3 rounded-md mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <StickyNote className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Your Note</span>
                          </div>
                          <p className="text-sm">{favorite.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Added {new Date(favorite.createdAt).toLocaleDateString()}
                        </div>
                        
                        <div className="flex gap-2">
                          {favorite.enterprise.website && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(favorite.enterprise.website, '_blank')}
                              data-testid={`button-visit-${favorite.enterpriseId}`}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Visit
                            </Button>
                          )}
                          <Link href={`/enterprises/${favorite.enterpriseId}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-view-${favorite.enterpriseId}`}
                            >
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
  );
}