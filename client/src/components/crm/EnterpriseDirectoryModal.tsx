import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Building,
  MapPin,
  ExternalLink,
  X,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Enterprise } from "@shared/schema";

const categoryColors = {
  land_projects: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  capital_sources: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  open_source_tools: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  network_organizers: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const categoryLabels = {
  land_projects: "Land Project",
  capital_sources: "Capital Source",
  open_source_tools: "Open Source Tool",
  network_organizers: "Network Organizer",
};

interface EnterpriseDirectoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (enterprise: Enterprise) => void;
  selectedEnterpriseId?: string | null;
}

export default function EnterpriseDirectoryModal({
  open,
  onOpenChange,
  onSelect,
  selectedEnterpriseId,
}: EnterpriseDirectoryModalProps) {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const { data: enterprises = [], isLoading } = useQuery({
    queryKey: ["/api/enterprises"],
    queryFn: async (): Promise<Enterprise[]> => {
      const response = await fetch("/api/enterprises?limit=500");
      if (!response.ok) throw new Error("Failed to fetch enterprises");
      return response.json();
    },
    enabled: isAuthenticated && open,
    retry: false,
  });

  const locations = useMemo(() => {
    const uniqueLocations = Array.from(
      new Set(enterprises.filter(e => e.location).map(e => e.location!))
    );
    return uniqueLocations.sort();
  }, [enterprises]);

  const filteredEnterprises = useMemo(() => {
    let filtered = enterprises;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (enterprise) =>
          enterprise.name.toLowerCase().includes(query) ||
          enterprise.description?.toLowerCase().includes(query) ||
          enterprise.location?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter(
        (enterprise) => enterprise.category === categoryFilter
      );
    }

    if (selectedLocation && selectedLocation !== "all") {
      filtered = filtered.filter(
        (enterprise) => enterprise.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    return filtered;
  }, [enterprises, searchQuery, categoryFilter, selectedLocation]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setCategoryFilter("all");
      setSelectedLocation("all");
      setFocusedIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || filteredEnterprises.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredEnterprises.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const enterprise = filteredEnterprises[focusedIndex];
        if (enterprise) {
          handleSelect(enterprise);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredEnterprises, focusedIndex]);

  const handleSelect = (enterprise: Enterprise) => {
    onSelect(enterprise);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setSelectedLocation("all");
  };

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || selectedLocation !== "all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold font-lato">
            Select Enterprise
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-enterprise-search"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48" data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="land_projects">Land Projects</SelectItem>
                  <SelectItem value="capital_sources">Capital Sources</SelectItem>
                  <SelectItem value="open_source_tools">Open Source Tools</SelectItem>
                  <SelectItem value="network_organizers">Network Organizers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Location:</span>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-48" data-testid="select-location-filter">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                data-testid="button-clear-filters"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground" data-testid="text-result-count">
              Showing {filteredEnterprises.length} of {enterprises.length} enterprises
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-16 w-full mb-3" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEnterprises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No enterprises found
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {hasActiveFilters
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "No enterprises are available in the directory."}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="mt-4"
                  data-testid="button-clear-filters-empty"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEnterprises.map((enterprise, index) => (
                <Card
                  key={enterprise.id}
                  className={cn(
                    "transition-all duration-200 cursor-pointer hover:shadow-md hover:border-primary/50",
                    selectedEnterpriseId === enterprise.id && "border-primary ring-2 ring-primary/20",
                    focusedIndex === index && "ring-2 ring-primary/50"
                  )}
                  data-testid={`card-enterprise-${enterprise.id}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                        {enterprise.name}
                      </h3>
                      
                      {enterprise.category && (
                        <Badge
                          className={cn(
                            "text-xs",
                            categoryColors[enterprise.category as keyof typeof categoryColors]
                          )}
                          data-testid={`badge-category-${enterprise.id}`}
                        >
                          {categoryLabels[enterprise.category as keyof typeof categoryLabels]}
                        </Badge>
                      )}
                    </div>

                    {enterprise.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{enterprise.location}</span>
                      </div>
                    )}

                    {enterprise.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {enterprise.description}
                      </p>
                    )}

                    {enterprise.website && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <a
                          href={enterprise.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="line-clamp-1 hover:underline hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {enterprise.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => handleSelect(enterprise)}
                      variant={selectedEnterpriseId === enterprise.id ? "default" : "outline"}
                      data-testid={`button-select-enterprise-${enterprise.id}`}
                    >
                      {selectedEnterpriseId === enterprise.id ? "Selected" : "Select"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
