import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  MapPin,
  Users,
  Filter,
  X,
  Sprout,
} from "lucide-react";
import SearchBar from "@/components/SearchBar";
import PledgeAffirmationModal from "@/components/PledgeAffirmationModal";
import { insertEnterpriseSchema, type Enterprise, type InsertEnterprise, type EarthCarePledge } from "@shared/schema";

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

function PledgeIndicator({ enterpriseId }: { enterpriseId: string }) {
  const { data: pledgeData } = useQuery<{ pledge: EarthCarePledge } | null>({
    queryKey: ["/api/enterprises", enterpriseId, "pledge"],
    queryFn: async () => {
      const response = await fetch(`/api/enterprises/${enterpriseId}/pledge`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  if (pledgeData?.pledge?.status === 'affirmed') {
    return (
      <Sprout className="w-4 h-4 text-green-600 flex-shrink-0" data-testid="indicator-pledge-affirmed" />
    );
  }

  return null;
}

export default function CRMEnterprises() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEnterprise, setEditingEnterprise] = useState<Enterprise | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pledgeModalOpen, setPledgeModalOpen] = useState(false);
  const [selectedEnterpriseForPledge, setSelectedEnterpriseForPledge] = useState<Enterprise | null>(null);

  const form = useForm<InsertEnterprise>({
    resolver: zodResolver(insertEnterpriseSchema),
    defaultValues: {
      name: "",
      category: "land_projects",
      description: "",
      website: "",
      location: "",
      isVerified: false,
      tags: [],
      imageUrl: "",
      followerCount: 0,
      contactEmail: "",
      sourceUrl: "",
    },
  });

  const { data: enterprises = [], isLoading } = useQuery({
    queryKey: ["/api/enterprises", categoryFilter, searchQuery],
    queryFn: async (): Promise<Enterprise[]> => {
      const params = new URLSearchParams();
      if (categoryFilter) params.append("category", categoryFilter);
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "100");

      const response = await fetch(`/api/enterprises?${params}`);
      if (!response.ok) throw new Error("Failed to fetch enterprises");
      return response.json();
    },
    retry: false,
  });

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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create enterprise",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertEnterprise }) => {
      return apiRequest("PUT", `/api/crm/enterprises/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/stats"] });
      toast({
        title: "Success",
        description: "Enterprise updated successfully",
      });
      setIsDialogOpen(false);
      setEditingEnterprise(null);
      form.reset();
    },
    onError: () => {
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
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete enterprise",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    setEditingEnterprise(null);
    form.reset({
      name: "",
      category: "land_projects",
      description: "",
      website: "",
      location: "",
      isVerified: false,
      tags: [],
      imageUrl: "",
      followerCount: 0,
      contactEmail: "",
      sourceUrl: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (enterprise: Enterprise) => {
    setEditingEnterprise(enterprise);
    form.reset({
      name: enterprise.name,
      category: enterprise.category,
      description: enterprise.description || "",
      website: enterprise.website || "",
      location: enterprise.location || "",
      isVerified: enterprise.isVerified || false,
      tags: enterprise.tags || [],
      imageUrl: enterprise.imageUrl || "",
      followerCount: enterprise.followerCount || 0,
      contactEmail: enterprise.contactEmail || "",
      sourceUrl: enterprise.sourceUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleManagePledge = (enterprise: Enterprise) => {
    setSelectedEnterpriseForPledge(enterprise);
    setPledgeModalOpen(true);
  };

  const onSubmit = (data: InsertEnterprise) => {
    const processedData = {
      ...data,
      tags: typeof data.tags === 'string' 
        ? (data.tags as string).split(',').map(t => t.trim()).filter(Boolean)
        : data.tags || [],
    };

    if (editingEnterprise) {
      updateMutation.mutate({ id: editingEnterprise.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const filteredEnterprises = enterprises.filter(enterprise => {
    const matchesSearch = !searchQuery || 
      enterprise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (enterprise.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || enterprise.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const { data: selectedPledgeData } = useQuery<{ pledge: EarthCarePledge } | null>({
    queryKey: ["/api/enterprises", selectedEnterpriseForPledge?.id, "pledge"],
    queryFn: async () => {
      if (!selectedEnterpriseForPledge) return null;
      const response = await fetch(`/api/enterprises/${selectedEnterpriseForPledge.id}/pledge`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!selectedEnterpriseForPledge,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Building className="w-8 h-8 text-primary" />
            Enterprise Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage enterprises in the CRM system
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-enterprise">
          <Plus className="w-4 h-4 mr-2" />
          Create Enterprise
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
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
              <Select 
                value={categoryFilter || "all"} 
                onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}
              >
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
              {categoryFilter && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCategoryFilter(null)}
                  data-testid="button-clear-filter"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Enterprises ({filteredEnterprises.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredEnterprises.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No enterprises found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter
                  ? "Try adjusting your search or filters"
                  : "Create your first enterprise to get started"}
              </p>
              {!searchQuery && !categoryFilter && (
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Enterprise
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnterprises.map((enterprise) => {
                    const categoryClass = categoryColors[enterprise.category as keyof typeof categoryColors];
                    const categoryLabel = categories.find(c => c.value === enterprise.category)?.label;
                    
                    return (
                      <TableRow key={enterprise.id} data-testid={`row-enterprise-${enterprise.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center flex-shrink-0">
                              <Building className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground truncate flex items-center gap-1">
                                {enterprise.name}
                                {enterprise.isVerified && (
                                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                )}
                                <PledgeIndicator enterpriseId={enterprise.id} />
                              </div>
                              {enterprise.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-xs">
                                  {enterprise.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryClass}>
                            {categoryLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {enterprise.location ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{enterprise.location}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {enterprise.followerCount != null && enterprise.followerCount > 0 ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span>{enterprise.followerCount.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {enterprise.tags && enterprise.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {enterprise.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {enterprise.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{enterprise.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {enterprise.isVerified ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManagePledge(enterprise)}
                              data-testid="button-manage-pledge"
                              title="Manage Earth Care Pledge"
                            >
                              <Sprout className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(enterprise)}
                              data-testid={`button-edit-${enterprise.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(enterprise.id)}
                              data-testid={`button-delete-${enterprise.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEnterprise ? "Edit Enterprise" : "Create Enterprise"}
            </DialogTitle>
            <DialogDescription>
              {editingEnterprise 
                ? "Update the enterprise information below"
                : "Fill in the details to create a new enterprise"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enterprise name" 
                        {...field} 
                        data-testid="input-name"
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
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enterprise description"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com" 
                          {...field}
                          value={field.value || ""}
                          data-testid="input-website"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="City, Country" 
                          {...field}
                          value={field.value || ""}
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="contact@example.com" 
                          type="email"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-contact-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="followerCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follower Count</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-follower-count"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/logo.png"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-logo-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Original source URL"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-source-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="sustainability, renewable energy, carbon neutral (comma-separated)"
                        {...field}
                        value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        data-testid="input-tags"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Verified Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Mark this enterprise as verified
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                        data-testid="switch-verified"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingEnterprise(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the enterprise
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  deleteMutation.mutate(deleteConfirmId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-delete-confirm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pledge Affirmation Modal */}
      {selectedEnterpriseForPledge && (
        <PledgeAffirmationModal
          enterpriseId={selectedEnterpriseForPledge.id}
          enterpriseName={selectedEnterpriseForPledge.name}
          existingPledge={selectedPledgeData?.pledge}
          open={pledgeModalOpen}
          onOpenChange={setPledgeModalOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/enterprises", selectedEnterpriseForPledge.id, "pledge"] });
            setPledgeModalOpen(false);
            setSelectedEnterpriseForPledge(null);
          }}
        />
      )}
    </div>
  );
}
