import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
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
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Building,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Filter,
  X,
  Lock,
  Shield,
  Link2,
  Database,
  Unlink,
  Info,
} from "lucide-react";
import SearchBar from "@/components/SearchBar";
import UpgradePrompt from "@/components/UpgradePrompt";
import { insertCrmWorkspaceEnterpriseSchema, type CrmWorkspaceEnterprise, type InsertCrmWorkspaceEnterprise } from "@shared/schema";

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

const relationshipStages = [
  { value: "cold", label: "Cold" },
  { value: "warm", label: "Warm" },
  { value: "hot", label: "Hot" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const relationshipStageColors = {
  cold: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  warm: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hot: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function CRMEnterprises() {
  const { toast } = useToast();
  const { user } = useAuth();
  const params = useParams<{ enterpriseId: string }>();
  const { currentEnterprise } = useWorkspace();
  const enterpriseId = params.enterpriseId || currentEnterprise?.id || '';
  const [, navigate] = useLocation();
  const { userSubscription } = useSubscription();
  const isFreeUser = userSubscription?.currentPlanType === 'free';
  const isAdmin = user?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [relationshipFilter, setRelationshipFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEnterprise, setEditingEnterprise] = useState<CrmWorkspaceEnterprise | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const form = useForm<InsertCrmWorkspaceEnterprise>({
    resolver: zodResolver(insertCrmWorkspaceEnterpriseSchema),
    defaultValues: {
      workspaceId: enterpriseId,
      name: "",
      category: "land_projects",
      description: "",
      website: "",
      location: "",
      contactEmail: "",
      tags: [],
      relationshipStage: undefined,
      ownerNotes: "",
    },
  });

  const { data: workspaceEnterprises = [], isLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises"],
    queryFn: async (): Promise<CrmWorkspaceEnterprise[]> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/enterprises`);
      if (!response.ok) throw new Error("Failed to fetch workspace enterprises");
      return response.json();
    },
    enabled: !!enterpriseId,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertCrmWorkspaceEnterprise }) => {
      return apiRequest("PUT", `/api/crm/${enterpriseId}/workspace/enterprises/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "stats"] });
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
      return apiRequest("DELETE", `/api/crm/${enterpriseId}/workspace/enterprises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "stats"] });
      toast({
        title: "Success",
        description: "Enterprise removed from workspace",
      });
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove enterprise",
        variant: "destructive",
      });
    },
  });

  const handleAddEnterprise = () => {
    navigate(`/crm/${enterpriseId}/add-enterprise`);
  };

  const handleEdit = (enterprise: CrmWorkspaceEnterprise) => {
    setEditingEnterprise(enterprise);
    form.reset({
      workspaceId: enterprise.workspaceId,
      directoryEnterpriseId: enterprise.directoryEnterpriseId || undefined,
      name: enterprise.name,
      category: enterprise.category,
      description: enterprise.description || "",
      website: enterprise.website || "",
      location: enterprise.location || "",
      contactEmail: enterprise.contactEmail || "",
      tags: enterprise.tags || [],
      relationshipStage: enterprise.relationshipStage || undefined,
      ownerNotes: enterprise.ownerNotes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const onSubmit = (data: InsertCrmWorkspaceEnterprise) => {
    const processedData = {
      ...data,
      tags: typeof data.tags === 'string' 
        ? (data.tags as string).split(',').map(t => t.trim()).filter(Boolean)
        : data.tags || [],
    };

    if (editingEnterprise) {
      updateMutation.mutate({ id: editingEnterprise.id, data: processedData });
    }
  };

  const filteredEnterprises = workspaceEnterprises.filter(enterprise => {
    const matchesSearch = !searchQuery || 
      enterprise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (enterprise.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || enterprise.category === categoryFilter;
    const matchesRelationship = !relationshipFilter || enterprise.relationshipStage === relationshipFilter;
    return matchesSearch && matchesCategory && matchesRelationship;
  });

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  const getRelationshipLabel = (value: string | null | undefined) => {
    if (!value) return null;
    return relationshipStages.find(r => r.value === value)?.label || value;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Building className="w-8 h-8 text-primary" />
              Workspace Enterprises
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700" data-testid="badge-workspace-mode">
                    <Database className="h-3 w-3 mr-1" />
                    Workspace View
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Viewing enterprises tracked in your CRM workspace</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground mt-1">
            Track and manage enterprise relationships in your CRM
          </p>
        </div>
        <Button onClick={handleAddEnterprise} disabled={isFreeUser} data-testid="button-add-enterprise">
          {isFreeUser && <Lock className="w-4 h-4 mr-2" />}
          <Plus className="w-4 h-4 mr-2" />
          Add Enterprise
        </Button>
      </div>

      {/* Upgrade Prompt for Free Users */}
      {isFreeUser && (
        <div className="mb-6">
          <UpgradePrompt
            feature="enterprise management"
            title="Unlock Full Enterprise Management"
            benefits={[
              "Track unlimited enterprises in your workspace",
              "Link enterprises to directory profiles",
              "Advanced relationship stage tracking",
              "Custom notes and CRM fields",
              "Bulk enterprise operations",
            ]}
          />
        </div>
      )}

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
            <div className="flex gap-2 flex-wrap">
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
              <Select 
                value={relationshipFilter || "all"} 
                onValueChange={(value) => setRelationshipFilter(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full md:w-56" data-testid="filter-relationship">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {relationshipStages.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(categoryFilter || relationshipFilter) && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setCategoryFilter(null);
                    setRelationshipFilter(null);
                  }}
                  data-testid="button-clear-filters"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enterprises List */}
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
                {searchQuery || categoryFilter || relationshipFilter
                  ? "Try adjusting your search or filters"
                  : "Add your first enterprise to start tracking relationships"}
              </p>
              {!searchQuery && !categoryFilter && !relationshipFilter && (
                <Button onClick={handleAddEnterprise} disabled={isFreeUser}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Enterprise
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {filteredEnterprises.map((enterprise) => {
                  const categoryClass = categoryColors[enterprise.category as keyof typeof categoryColors];
                  const categoryLabel = getCategoryLabel(enterprise.category);
                  const relationshipLabel = getRelationshipLabel(enterprise.relationshipStage);
                  const relationshipClass = enterprise.relationshipStage ? relationshipStageColors[enterprise.relationshipStage as keyof typeof relationshipStageColors] : "";
                  const isLinked = !!enterprise.directoryEnterpriseId;
                  
                  return (
                    <Card key={enterprise.id} className="touch-manipulation" data-testid={`card-enterprise-${enterprise.id}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center flex-shrink-0">
                                <Building className="w-5 h-5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate">{enterprise.name}</span>
                                  {isLinked ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Linked to directory enterprise</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : null}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  <Badge className={categoryClass}>
                                    {categoryLabel}
                                  </Badge>
                                  {isLinked ? (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                                      <Link2 className="w-3 h-3 mr-1" />
                                      Linked
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300">
                                      Workspace Only
                                    </Badge>
                                  )}
                                  {relationshipLabel && (
                                    <Badge className={relationshipClass}>
                                      {relationshipLabel}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {enterprise.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {enterprise.description}
                            </p>
                          )}
                          
                          {enterprise.ownerNotes && (
                            <div className="text-sm bg-muted/50 p-2 rounded">
                              <span className="font-medium">Notes: </span>
                              <span className="text-muted-foreground">{enterprise.ownerNotes}</span>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                            {enterprise.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{enterprise.location}</span>
                              </div>
                            )}
                          </div>
                          
                          {enterprise.tags && enterprise.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
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
                          
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEdit(enterprise)}
                              disabled={isFreeUser}
                              data-testid={`button-edit-${enterprise.id}`}
                            >
                              <Edit className="w-4 h-4 mr-1.5" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(enterprise.id)}
                              disabled={isFreeUser}
                              data-testid={`button-delete-${enterprise.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Link Status</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnterprises.map((enterprise) => {
                      const categoryClass = categoryColors[enterprise.category as keyof typeof categoryColors];
                      const categoryLabel = getCategoryLabel(enterprise.category);
                      const relationshipLabel = getRelationshipLabel(enterprise.relationshipStage);
                      const relationshipClass = enterprise.relationshipStage ? relationshipStageColors[enterprise.relationshipStage as keyof typeof relationshipStageColors] : "";
                      const isLinked = !!enterprise.directoryEnterpriseId;
                      
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
                                  {isLinked && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Link2 className="w-4 h-4 text-blue-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Linked to directory enterprise</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                                {enterprise.ownerNotes && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px] cursor-help">
                                          {enterprise.ownerNotes}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>{enterprise.ownerNotes}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
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
                            {isLinked ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                                <Link2 className="w-3 h-3 mr-1" />
                                Linked
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300">
                                Workspace Only
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {relationshipLabel ? (
                              <Badge className={relationshipClass}>
                                {relationshipLabel}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {enterprise.location ? (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">{enterprise.location}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {enterprise.tags && enterprise.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {enterprise.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {enterprise.tags.length > 2 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="secondary" className="text-xs cursor-help">
                                          +{enterprise.tags.length - 2}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                          {enterprise.tags.slice(2).map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(enterprise)}
                                disabled={isFreeUser}
                                data-testid={`button-edit-${enterprise.id}`}
                                title={isFreeUser ? "Upgrade to CRM Pro to edit" : undefined}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(enterprise.id)}
                                disabled={isFreeUser}
                                data-testid={`button-delete-${enterprise.id}`}
                                title={isFreeUser ? "Upgrade to CRM Pro to delete" : undefined}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workspace Enterprise</DialogTitle>
            <DialogDescription>
              Update the enterprise information and relationship details
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
                name="relationshipStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Stage</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-relationship-stage">
                          <SelectValue placeholder="Select a relationship stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {relationshipStages.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
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

              <FormField
                control={form.control}
                name="ownerNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Private Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Your private notes about this enterprise relationship"
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-owner-notes"
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

              {editingEnterprise?.directoryEnterpriseId && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This enterprise is linked to a directory profile. Some fields are synced from the directory.
                  </AlertDescription>
                </Alert>
              )}

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
                  disabled={updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {updateMutation.isPending ? "Saving..." : "Update Enterprise"}
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
              This will remove the enterprise from your workspace. This action cannot be undone.
              {workspaceEnterprises.find(e => e.id === deleteConfirmId)?.directoryEnterpriseId && (
                <span className="block mt-2 text-muted-foreground">
                  Note: The enterprise will still exist in the public directory.
                </span>
              )}
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
              Remove from Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
