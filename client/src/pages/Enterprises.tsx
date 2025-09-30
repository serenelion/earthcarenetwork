import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Search,
  MapPin,
  ExternalLink,
  CheckCircle,
  Users,
  Filter,
  Sparkles,
} from "lucide-react";
import SearchBar from "@/components/SearchBar";
import FavoriteButton from "@/components/FavoriteButton";
import { type Enterprise } from "@shared/schema";

const categories = [
  { value: "land_projects", label: "Land Projects" },
  { value: "capital_sources", label: "Capital Sources" },
  { value: "open_source_tools", label: "Open Source Tools" },
  { value: "network_organizers", label: "Network Organizers" },
];

const categoryColors = {
  land_projects: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  capital_sources: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  open_source_tools: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  network_organizers: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export default function Enterprises() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Detect category from URL path (/directory/:category)
  useEffect(() => {
    const categoryMap: Record<string, string> = {
      '/directory/land-projects': 'land_projects',
      '/directory/capital-sources': 'capital_sources',
      '/directory/open-source-tools': 'open_source_tools',
      '/directory/network-organizers': 'network_organizers',
    };
    
    const categoryFromUrl = categoryMap[location];
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    } else if (location === '/enterprises') {
      // Clear category filter when navigating back to main directory
      setSelectedCategory(null);
    }
  }, [location]);

  const { data: enterprises = [], isLoading } = useQuery({
    queryKey: ["/api/enterprises", selectedCategory, searchQuery],
    queryFn: async (): Promise<Enterprise[]> => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");

      const response = await fetch(`/api/enterprises?${params}`);
      if (!response.ok) throw new Error("Failed to fetch enterprises");
      return response.json();
    },
    retry: false,
  });

  const getCategoryLabel = () => {
    if (!selectedCategory) return "Directory";
    const category = categories.find(c => c.value === selectedCategory);
    return category?.label || "Directory";
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Building className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-lato">
              {getCategoryLabel()}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {selectedCategory 
              ? `Explore ${categories.find(c => c.value === selectedCategory)?.label.toLowerCase()} in our regenerative network`
              : "Discover regenerative enterprises, projects, and organizations"
            }
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  data-testid="search-enterprises"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}>
                  <SelectTrigger className="w-full md:w-56" data-testid="filter-category">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategory && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCategory(null)}
                    data-testid="button-clear-filter"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enterprises Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : enterprises.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No enterprises found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory
                  ? "Try adjusting your search or filters"
                  : "Check back soon as we add more enterprises to the directory"}
              </p>
              {(searchQuery || selectedCategory) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(null);
                  }}
                  data-testid="button-reset-filters"
                >
                  Reset Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enterprises.map((enterprise) => {
              const categoryClass = categoryColors[enterprise.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800";
              const categoryLabel = categories.find(c => c.value === enterprise.category)?.label || enterprise.category;

              return (
                <Card 
                  key={enterprise.id} 
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 group" 
                  data-testid={`enterprise-card-${enterprise.id}`}
                >
                  {/* Header with Favorite */}
                  <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-b">
                    <div className="absolute top-3 right-3">
                      <FavoriteButton 
                        enterpriseId={enterprise.id} 
                        enterpriseName={enterprise.name}
                        size="sm"
                      />
                    </div>
                    
                    <div className="flex items-start gap-3 pr-8">
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {enterprise.name}
                          </h3>
                          {enterprise.isVerified && (
                            <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" data-testid={`verified-${enterprise.id}`} />
                          )}
                        </div>
                        <Badge className={`${categoryClass} text-xs`}>
                          {categoryLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-6">
                    {enterprise.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {enterprise.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      {enterprise.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{enterprise.location}</span>
                        </div>
                      )}
                      
                      {enterprise.followerCount != null && enterprise.followerCount > 0 && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{enterprise.followerCount.toLocaleString()} followers</span>
                        </div>
                      )}
                    </div>

                    {enterprise.tags && enterprise.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {enterprise.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {enterprise.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{enterprise.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        asChild
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        data-testid={`view-details-${enterprise.id}`}
                      >
                        <Link href={`/enterprises/${enterprise.id}`}>
                          <Sparkles className="w-4 h-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                      
                      {enterprise.website && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          data-testid={`visit-website-${enterprise.id}`}
                        >
                          <a
                            href={enterprise.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && enterprises.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {enterprises.length} {enterprises.length === 1 ? 'enterprise' : 'enterprises'}
            {selectedCategory && ` in ${categories.find(c => c.value === selectedCategory)?.label}`}
          </div>
        )}
      </main>
    </div>
  );
}
