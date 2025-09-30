import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Plus,
  Search,
  MapPin,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle,
  Users,
  Filter,
} from "lucide-react";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import SearchBar from "@/components/SearchBar";
import FavoriteButton from "@/components/FavoriteButton";
import { insertEnterpriseSchema, type Enterprise, type InsertEnterprise } from "@shared/schema";

const categories = [
  { value: "land_projects", label: "Land Projects" },
  { value: "capital_sources", label: "Capital Sources" },
  { value: "open_source_tools", label: "Open Source Tools" },
  { value: "network_organizers", label: "Network Organizers" },
];

const categoryColors = {
  land_projects: "bg-green-100 text-green-800",
  capital_sources: "bg-yellow-100 text-yellow-800",
  open_source_tools: "bg-blue-100 text-blue-800",
  network_organizers: "bg-purple-100 text-purple-800",
};

export default function Enterprises() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEnterprise, setEditingEnterprise] = useState<Enterprise | null>(null);

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

  const form = useForm<InsertEnterprise>({
    resolver: zodResolver(insertEnterpriseSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "land_projects",
      location: "",
      website: "",
      contactEmail: "",
      tags: [],
      isVerified: false,
      followerCount: 0,
    },
  });

  const { data: enterprises = [], isLoading, error: enterprisesError } = useQuery({
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

  // Handle enterprises error
  useEffect(() => {
    if (enterprisesError && isUnauthorizedError(enterprisesError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [enterprisesError, toast]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertEnterprise) => {
      return apiRequest("POST", "/api/crm/enterprises", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/stats"] });
      toast({
        title: "Success",
        description: "Enterprise created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create enterprise",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertEnterprise> }) => {
      return apiRequest("PUT", `/api/crm/enterprises/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
      toast({
        title: "Success",
        description: "Enterprise updated successfully",
      });
      setIsDialogOpen(false);
      setEditingEnterprise(null);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update enterprise",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/crm/enterprises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/stats"] });
      toast({
        title: "Success",
        description: "Enterprise deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete enterprise",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const handleSubmit = (data: InsertEnterprise) => {
    const processedData = {
      ...data,
      tags: data.tags || [],
    };

    if (editingEnterprise) {
      updateMutation.mutate({ id: editingEnterprise.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const handleEdit = (enterprise: Enterprise) => {
    setEditingEnterprise(enterprise);
    form.reset({
      name: enterprise.name,
      description: enterprise.description || "",
      category: enterprise.category,
      location: enterprise.location || "",
      website: enterprise.website || "",
      contactEmail: enterprise.contactEmail || "",
      tags: enterprise.tags || [],
      isVerified: enterprise.isVerified || false,
      followerCount: enterprise.followerCount || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this enterprise?")) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingEnterprise(null);
    form.reset();
    setIsDialogOpen(true);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1">
          {/* Mobile Header */}
          <div className="md:hidden bg-card border-b border-border p-4">
            <div className="flex items-center justify-between">
              <MobileMenuButton />
              <div className="flex items-center space-x-2">
                <Building className="text-primary text-lg" />
                <span className="font-bold text-foreground font-lato">Enterprises</span>
              </div>
              <div className="w-10"></div>
            </div>
          </div>
          
          <div className="p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-6 md:h-8 bg-muted rounded mb-4 w-48 md:w-64"></div>
              <div className="h-24 md:h-32 bg-muted rounded mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 md:h-64 bg-muted rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1">
        {/* Mobile Header */}
        <div className="md:hidden bg-card border-b border-border">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <MobileMenuButton />
              <div className="flex items-center space-x-2">
                <Building className="text-primary text-lg" />
                <span className="text-base font-bold text-foreground font-lato">Enterprises</span>
              </div>
              <div className="w-10"></div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setLocation("/directory")}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                data-testid="button-public-view"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Public Directory
              </Button>
              <Button
                onClick={openCreateDialog}
                size="sm"
                className="flex-1 text-xs"
                data-testid="button-create-enterprise"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Enterprise
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-lato">Enterprises</h1>
              <p className="text-muted-foreground">Manage regenerative enterprise directory</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setLocation("/directory")}
                variant="outline"
                data-testid="button-public-view"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public Directory
              </Button>
              <Button onClick={openCreateDialog} data-testid="button-create-enterprise">
                <Plus className="w-4 h-4 mr-2" />
                Add Enterprise
              </Button>
            </div>
          </div>
          
          {/* Mobile Title */}
          <div className="md:hidden mb-4">
            <p className="text-sm text-muted-foreground">Manage regenerative enterprise directory</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-lato text-base md:text-lg">
                  {editingEnterprise ? "Edit Enterprise" : "Create New Enterprise"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Enterprise Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter enterprise name"
                            className="text-sm"
                            {...field}
                            data-testid="input-enterprise-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-sm" data-testid="select-enterprise-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the enterprise mission and activities"
                            className="min-h-[80px] md:min-h-[100px] text-sm"
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-enterprise-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City, Country"
                              className="text-sm"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-enterprise-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Website</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com"
                              className="text-sm"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-enterprise-website"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Contact Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contact@example.com"
                            className="text-sm"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-enterprise-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto text-sm"
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel-enterprise"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="w-full sm:w-auto text-sm"
                      data-testid="button-save-enterprise"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Saving..."
                        : editingEnterprise
                        ? "Update Enterprise"
                        : "Create Enterprise"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
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
                  <SelectTrigger className="w-48" data-testid="filter-category">
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
                    Clear Filter
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
                  : "Get started by adding your first enterprise"}
              </p>
              <Button onClick={openCreateDialog} data-testid="button-add-first-enterprise">
                <Plus className="w-4 h-4 mr-2" />
                Add Enterprise
              </Button>
            </CardContent>
          </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {enterprises.map((enterprise) => {
                const categoryClass = categoryColors[enterprise.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800";
                const categoryLabel = categories.find(c => c.value === enterprise.category)?.label || enterprise.category;

                return (
                  <Card key={enterprise.id} className="overflow-hidden hover:shadow-lg transition-shadow touch-manipulation" data-testid={`enterprise-card-${enterprise.id}`}>
                    {/* Header */}
                    <div className="h-24 md:h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
                      <div className="text-2xl md:text-4xl text-primary/30">
                        {enterprise.category === 'land_projects' && '🌱'}
                        {enterprise.category === 'capital_sources' && '💰'}
                        {enterprise.category === 'open_source_tools' && '🔧'}
                        {enterprise.category === 'network_organizers' && '🌐'}
                      </div>
                      {/* Favorite Button - Top Left */}
                      <div className="absolute top-2 left-2">
                        <FavoriteButton
                          enterpriseId={enterprise.id}
                          enterpriseName={enterprise.name}
                          variant="ghost"
                          size="sm"
                          className="bg-white/80 hover:bg-white/90 backdrop-blur-sm shadow-sm"
                        />
                      </div>
                      
                      {/* Admin Actions - Top Right */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 md:p-2 touch-manipulation bg-white/80 hover:bg-white/90 backdrop-blur-sm"
                          onClick={() => handleEdit(enterprise)}
                          data-testid={`button-edit-${enterprise.id}`}
                        >
                          <Edit className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 md:p-2 touch-manipulation text-destructive hover:text-destructive bg-white/80 hover:bg-white/90 backdrop-blur-sm"
                          onClick={() => handleDelete(enterprise.id)}
                          data-testid={`button-delete-${enterprise.id}`}
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <Badge className={`${categoryClass} text-xs md:text-sm font-medium flex-shrink-0`}>
                          {categoryLabel}
                        </Badge>
                        {enterprise.location && (
                          <div className="flex items-center text-muted-foreground text-xs md:text-sm min-w-0">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{enterprise.location}</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base md:text-xl font-semibold mb-2 text-foreground font-lato line-clamp-2">
                        {enterprise.name}
                      </h3>

                      <p className="text-muted-foreground mb-3 md:mb-4 line-clamp-2 md:line-clamp-3 text-xs md:text-sm">
                        {enterprise.description || "No description available"}
                      </p>

                      <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
                        <div className="flex flex-wrap gap-1 md:gap-2 min-w-0">
                          {enterprise.isVerified && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                              <span className="hidden sm:inline">Verified</span>
                              <span className="sm:hidden">✓</span>
                            </Badge>
                          )}
                          {enterprise.followerCount != null && enterprise.followerCount > 0 && (
                            <Badge variant="outline" className="text-muted-foreground text-xs">
                              <Users className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                              <span className="hidden sm:inline">{enterprise.followerCount} Followers</span>
                              <span className="sm:hidden">{enterprise.followerCount}</span>
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-1">
                          <FavoriteButton
                            enterpriseId={enterprise.id}
                            enterpriseName={enterprise.name}
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                          />
                          {enterprise.website && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5 md:p-2 touch-manipulation flex-shrink-0"
                              onClick={() => window.open(enterprise.website!, "_blank")}
                              data-testid={`button-visit-${enterprise.id}`}
                            >
                              <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {enterprise.tags && enterprise.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {enterprise.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {enterprise.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{enterprise.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                </Card>
              );
            })}
          </div>
          )}
      </main>
    </div>
  );
}
