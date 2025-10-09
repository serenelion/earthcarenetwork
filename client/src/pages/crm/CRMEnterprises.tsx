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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  MessageSquare,
  Users,
  DollarSign,
  User,
} from "lucide-react";
import SearchBar from "@/components/SearchBar";
import UpgradePrompt from "@/components/UpgradePrompt";
import { insertCrmWorkspaceEnterpriseSchema, insertCrmWorkspacePersonSchema, insertCrmWorkspaceOpportunitySchema, type CrmWorkspaceEnterprise, type InsertCrmWorkspaceEnterprise, type CrmWorkspacePerson, type CrmWorkspaceEnterprisePerson, type InsertCrmWorkspaceEnterprisePerson, type InsertCrmWorkspacePerson, type InsertCrmWorkspaceOpportunity } from "@shared/schema";
import { format } from "date-fns";
import EntityDrawer from "@/components/crm/EntityDrawer";

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

const relationshipTypes = [
  { value: "employee", label: "Employee" },
  { value: "consultant", label: "Consultant" },
  { value: "contractor", label: "Contractor" },
  { value: "board_member", label: "Board Member" },
  { value: "advisor", label: "Advisor" },
  { value: "partner", label: "Partner" },
  { value: "vendor", label: "Vendor" },
  { value: "other", label: "Other" },
];

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
  const [notesEnterpriseId, setNotesEnterpriseId] = useState<string | null>(null);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [connectionsDialogOpen, setConnectionsDialogOpen] = useState(false);
  const [selectedEnterpriseForConnections, setSelectedEnterpriseForConnections] = useState<CrmWorkspaceEnterprise | null>(null);
  const [newConnectionPersonId, setNewConnectionPersonId] = useState<string>("");
  const [newConnectionRelationshipType, setNewConnectionRelationshipType] = useState<string>("employee");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEntityType, setDrawerEntityType] = useState<"opportunity" | "person" | "enterprise">("enterprise");
  const [drawerEntityId, setDrawerEntityId] = useState<string>("");
  const [quickActionPersonDialogOpen, setQuickActionPersonDialogOpen] = useState(false);
  const [quickActionOpportunityDialogOpen, setQuickActionOpportunityDialogOpen] = useState(false);
  const [quickActionPrefilledData, setQuickActionPrefilledData] = useState<any>(null);

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

  const personForm = useForm<InsertCrmWorkspacePerson>({
    resolver: zodResolver(insertCrmWorkspacePersonSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      workspaceEnterpriseId: "",
      linkedinUrl: "",
      notes: "",
      workspaceId: enterpriseId,
    },
  });

  const opportunityForm = useForm<InsertCrmWorkspaceOpportunity>({
    resolver: zodResolver(insertCrmWorkspaceOpportunitySchema),
    defaultValues: {
      title: "",
      description: "",
      value: 0,
      status: "lead",
      probability: 0,
      workspaceEnterpriseId: "",
      workspacePersonId: "",
      notes: "",
      workspaceId: enterpriseId,
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

  // Get user's team memberships to check workspace role
  const { data: userMemberships = [] } = useQuery({
    queryKey: ["/api/my-enterprises"],
    queryFn: async () => {
      const response = await fetch("/api/my-enterprises");
      if (!response.ok) throw new Error("Failed to fetch user memberships");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Get user's role in current workspace
  const userRole = userMemberships.find((m: any) => m.enterprise?.id === enterpriseId)?.role;

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

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises", notesEnterpriseId, "notes"],
    queryFn: async () => {
      if (!notesEnterpriseId) return [];
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/enterprises/${notesEnterpriseId}/notes`);
      if (!response.ok) throw new Error("Failed to fetch notes");
      return response.json();
    },
    enabled: !!notesEnterpriseId,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (body: string) => {
      return apiRequest("POST", `/api/crm/${enterpriseId}/workspace/enterprises/${notesEnterpriseId}/notes`, { body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises", notesEnterpriseId, "notes"] });
      setNewNoteBody("");
      toast({
        title: "Success",
        description: "Note created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return apiRequest("DELETE", `/api/crm/${enterpriseId}/workspace/enterprises/${notesEnterpriseId}/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises", notesEnterpriseId, "notes"] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    },
  });

  const { data: workspacePeople = [] } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "people"],
    queryFn: async (): Promise<CrmWorkspacePerson[]> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/people?limit=200`);
      if (!response.ok) throw new Error("Failed to fetch workspace people");
      return response.json();
    },
    enabled: !!enterpriseId,
    retry: false,
  });

  const { data: allOpportunities = [] } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "opportunities"],
    queryFn: async () => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/opportunities?limit=500`);
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
    enabled: !!enterpriseId,
    retry: false,
  });

  const { data: enterpriseConnections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "enterprise-people-connections", "enterprise", selectedEnterpriseForConnections?.id],
    queryFn: async (): Promise<CrmWorkspaceEnterprisePerson[]> => {
      if (!selectedEnterpriseForConnections) return [];
      const params = new URLSearchParams({ enterpriseId: selectedEnterpriseForConnections.id });
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/enterprise-people-connections?${params}`);
      if (!response.ok) throw new Error("Failed to fetch connections");
      return response.json();
    },
    enabled: !!selectedEnterpriseForConnections && !!enterpriseId,
    retry: false,
  });

  const createConnectionMutation = useMutation({
    mutationFn: async (data: InsertCrmWorkspaceEnterprisePerson) => {
      return apiRequest("POST", `/api/crm/${enterpriseId}/workspace/enterprise-people-connections`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "enterprise-people-connections"] });
      toast({
        title: "Success",
        description: "Connection created successfully",
      });
      setNewConnectionPersonId("");
      setNewConnectionRelationshipType("employee");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create connection",
        variant: "destructive",
      });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      return apiRequest("DELETE", `/api/crm/${enterpriseId}/workspace/enterprise-people-connections/${connectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "enterprise-people-connections"] });
      toast({
        title: "Success",
        description: "Connection removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove connection",
        variant: "destructive",
      });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      return apiRequest("PATCH", `/api/crm/${enterpriseId}/workspace/enterprise-people-connections/${connectionId}`, {
        isPrimary: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "enterprise-people-connections"] });
      toast({
        title: "Success",
        description: "Primary connection updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update primary connection",
        variant: "destructive",
      });
    },
  });

  const createPersonMutation = useMutation({
    mutationFn: async (data: InsertCrmWorkspacePerson) => {
      return apiRequest("POST", `/api/crm/${enterpriseId}/workspace/people`, data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "people"] });
      toast({ title: "Success", description: "Person created successfully" });
      setQuickActionPersonDialogOpen(false);
      personForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create person", variant: "destructive" });
    },
  });

  const createOpportunityMutation = useMutation({
    mutationFn: async (data: InsertCrmWorkspaceOpportunity) => {
      return apiRequest("POST", `/api/crm/${enterpriseId}/workspace/opportunities`, data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "opportunities"] });
      toast({ title: "Success", description: "Opportunity created successfully" });
      setQuickActionOpportunityDialogOpen(false);
      opportunityForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create opportunity", variant: "destructive" });
    },
  });

  const handleQuickAddPerson = (prefilledData: any) => {
    personForm.reset({ ...personForm.getValues(), workspaceEnterpriseId: prefilledData.workspaceEnterpriseId || "" });
    setQuickActionPersonDialogOpen(true);
  };

  const handleQuickAddOpportunity = (prefilledData: any) => {
    opportunityForm.reset({ ...opportunityForm.getValues(), workspaceEnterpriseId: prefilledData.workspaceEnterpriseId || "" });
    setQuickActionOpportunityDialogOpen(true);
  };

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

  const handleOpenDrawer = (type: "opportunity" | "person" | "enterprise", id: string) => {
    setDrawerEntityType(type);
    setDrawerEntityId(id);
    setDrawerOpen(true);
  };

  const handleDrawerNavigate = (type: "opportunity" | "person" | "enterprise", id: string) => {
    setDrawerEntityType(type);
    setDrawerEntityId(id);
  };

  const handleCreateConnection = () => {
    if (!selectedEnterpriseForConnections || !newConnectionPersonId) {
      toast({
        title: "Error",
        description: "Please select a person",
        variant: "destructive",
      });
      return;
    }

    createConnectionMutation.mutate({
      workspaceId: enterpriseId,
      workspaceEnterpriseId: selectedEnterpriseForConnections.id,
      workspacePersonId: newConnectionPersonId,
      relationshipType: newConnectionRelationshipType as any,
      isPrimary: enterpriseConnections.length === 0,
    });
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
                              onClick={() => handleOpenDrawer("enterprise", enterprise.id)}
                              data-testid={`button-view-${enterprise.id}`}
                            >
                              <Building className="w-4 h-4 mr-1.5" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEnterpriseForConnections(enterprise);
                                setConnectionsDialogOpen(true);
                              }}
                              disabled={isFreeUser}
                              data-testid={`button-connections-${enterprise.id}`}
                              title="Manage people connections"
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNotesEnterpriseId(enterprise.id)}
                              disabled={isFreeUser}
                              data-testid={`button-notes-${enterprise.id}`}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(enterprise)}
                              disabled={isFreeUser}
                              data-testid={`button-edit-${enterprise.id}`}
                            >
                              <Edit className="w-4 h-4" />
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
                      const peopleCount = workspacePeople.filter(p => p.workspaceEnterpriseId === enterprise.id).length;
                      const enterpriseOpportunities = allOpportunities.filter(o => o.workspaceEnterpriseId === enterprise.id);
                      const opportunityCount = enterpriseOpportunities.length;
                      const totalValue = enterpriseOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
                      
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
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {peopleCount > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200" data-testid={`badge-people-${enterprise.id}`}>
                                            <User className="w-3 h-3 mr-1" />
                                            {peopleCount} {peopleCount === 1 ? 'contact' : 'contacts'}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{peopleCount} contact{peopleCount === 1 ? '' : 's'} at this enterprise</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {opportunityCount > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200" data-testid={`badge-opportunities-${enterprise.id}`}>
                                            <DollarSign className="w-3 h-3 mr-1" />
                                            {opportunityCount} {opportunityCount === 1 ? 'opp' : 'opps'}
                                            {totalValue > 0 && ` • $${totalValue.toLocaleString()}`}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{opportunityCount} opportunit{opportunityCount === 1 ? 'y' : 'ies'} • Total value: ${totalValue.toLocaleString()}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
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
                                onClick={() => handleOpenDrawer("enterprise", enterprise.id)}
                                data-testid={`button-view-${enterprise.id}`}
                              >
                                <Building className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEnterpriseForConnections(enterprise);
                                  setConnectionsDialogOpen(true);
                                }}
                                disabled={isFreeUser}
                                data-testid={`button-connections-${enterprise.id}`}
                                title={isFreeUser ? "Upgrade to CRM Pro to manage connections" : "Manage people connections"}
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setNotesEnterpriseId(enterprise.id)}
                                disabled={isFreeUser}
                                data-testid={`button-notes-${enterprise.id}`}
                                title={isFreeUser ? "Upgrade to CRM Pro to view notes" : "View notes"}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
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

      {/* Notes Dialog */}
      <Dialog open={!!notesEnterpriseId} onOpenChange={() => setNotesEnterpriseId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enterprise Notes</DialogTitle>
            <DialogDescription>
              {workspaceEnterprises.find(e => e.id === notesEnterpriseId)?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Create Note Form */}
            <div className="space-y-2">
              <Textarea
                placeholder="Write a note..."
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-new-note"
              />
              <Button
                onClick={() => {
                  if (newNoteBody.trim()) {
                    createNoteMutation.mutate(newNoteBody);
                  }
                }}
                disabled={!newNoteBody.trim() || createNoteMutation.isPending}
                data-testid="button-create-note"
              >
                {createNoteMutation.isPending ? "Adding..." : "Add Note"}
              </Button>
            </div>

            {/* Notes List */}
            <ScrollArea className="h-[400px] pr-4">
              {notesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notes yet. Add your first note above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note: any) => (
                    <Card key={note.id} data-testid={`note-${note.id}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <p className="text-sm text-foreground whitespace-pre-wrap">{note.body}</p>
                            <div className="text-xs text-muted-foreground">
                              {note.author && (
                                <span>
                                  {note.author.firstName} {note.author.lastName}
                                </span>
                              )}
                              {note.createdAt && (
                                <span> • {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                              )}
                            </div>
                          </div>
                          {(note.authorId === user?.id || userRole === 'admin' || userRole === 'owner') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNoteMutation.mutate(note.id)}
                              disabled={deleteNoteMutation.isPending}
                              data-testid={`button-delete-note-${note.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* People Connections Dialog */}
      <Dialog open={connectionsDialogOpen} onOpenChange={setConnectionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              People Connected to {selectedEnterpriseForConnections?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* List of current connections */}
            <ScrollArea className="h-[300px]">
              {connectionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Loading connections...</p>
                </div>
              ) : enterpriseConnections.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No people connections yet</p>
                </div>
              ) : (
                enterpriseConnections.map((connection) => {
                  const person = workspacePeople.find(p => p.id === connection.workspacePersonId);
                  const relationshipLabel = relationshipTypes.find(r => r.value === connection.relationshipType)?.label;
                  
                  return (
                    <Card key={connection.id} className="mb-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{person ? `${person.firstName} ${person.lastName}` : "Unknown Person"}</p>
                              {connection.isPrimary && (
                                <Badge variant="default" data-testid={`badge-primary-${connection.id}`}>
                                  <Link2 className="w-3 h-3 mr-1" />
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{relationshipLabel || connection.relationshipType}</p>
                          </div>
                          <div className="flex gap-2">
                            {!connection.isPrimary && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPrimaryMutation.mutate(connection.id)}
                                disabled={setPrimaryMutation.isPending || isFreeUser}
                                data-testid={`button-set-primary-${connection.id}`}
                              >
                                Set as Primary
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteConnectionMutation.mutate(connection.id)}
                              disabled={deleteConnectionMutation.isPending || isFreeUser}
                              data-testid={`button-remove-connection-${connection.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </ScrollArea>

            {/* Add new connection form */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Add Connection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Person</label>
                  <Select 
                    value={newConnectionPersonId} 
                    onValueChange={setNewConnectionPersonId}
                    disabled={isFreeUser}
                  >
                    <SelectTrigger data-testid="select-person">
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspacePeople
                        .filter(p => !enterpriseConnections.some(c => c.workspacePersonId === p.id))
                        .map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.firstName} {person.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Relationship Type</label>
                  <Select 
                    value={newConnectionRelationshipType} 
                    onValueChange={setNewConnectionRelationshipType}
                    disabled={isFreeUser}
                  >
                    <SelectTrigger data-testid="select-relationship-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConnectionsDialogOpen(false);
                    setNewConnectionPersonId("");
                    setNewConnectionRelationshipType("employee");
                  }}
                  data-testid="button-cancel-connection"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateConnection}
                  disabled={!newConnectionPersonId || createConnectionMutation.isPending || isFreeUser}
                  data-testid="button-add-connection"
                >
                  {createConnectionMutation.isPending ? "Adding..." : "Add Connection"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entity Drawer */}
      {/* Quick Action Dialogs */}
      <Dialog open={quickActionPersonDialogOpen} onOpenChange={setQuickActionPersonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Person</DialogTitle></DialogHeader>
          <Form {...personForm}>
            <form onSubmit={personForm.handleSubmit(data => createPersonMutation.mutate({...data, workspaceId: enterpriseId}))} className="space-y-4">
              <FormField control={personForm.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={personForm.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setQuickActionPersonDialogOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={quickActionOpportunityDialogOpen} onOpenChange={setQuickActionOpportunityDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Opportunity</DialogTitle></DialogHeader>
          <Form {...opportunityForm}>
            <form onSubmit={opportunityForm.handleSubmit(data => createOpportunityMutation.mutate({...data, workspaceId: enterpriseId}))} className="space-y-4">
              <FormField control={opportunityForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={opportunityForm.control} name="value" render={({ field }) => (<FormItem><FormLabel>Value</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setQuickActionOpportunityDialogOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entityType={drawerEntityType}
        entityId={drawerEntityId}
        onEdit={() => {
          const enterprise = workspaceEnterprises.find(e => e.id === drawerEntityId);
          if (enterprise) {
            setDrawerOpen(false);
            handleEdit(enterprise);
          }
        }}
        onDelete={() => {
          setDrawerOpen(false);
          handleDelete(drawerEntityId);
        }}
        onNavigate={handleDrawerNavigate}
        onAddPerson={handleQuickAddPerson}
        onAddOpportunity={handleQuickAddOpportunity}
      />
    </div>
  );
}
