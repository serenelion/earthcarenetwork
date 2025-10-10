import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Progress } from "@/components/ui/progress";
import {
  Handshake,
  Plus,
  Search,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Building,
  User,
  Filter,
  Lightbulb,
  TrendingUp,
  ExternalLink,
  Download,
  Mail,
  Briefcase,
  MapPin,
  ChevronsUpDown,
  Check,
  Lock,
  Info,
  Shield,
  Users,
  ListTodo,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import SearchBar from "@/components/SearchBar";
import UpgradePrompt from "@/components/UpgradePrompt";
import { insertCrmWorkspaceOpportunitySchema, insertCrmWorkspaceTaskSchema, type CrmWorkspaceOpportunity, type InsertCrmWorkspaceOpportunity, type CrmWorkspaceEnterprise, type CrmWorkspacePerson, type InsertCrmWorkspaceTask } from "@shared/schema";
import EntityDrawer from "@/components/crm/EntityDrawer";
import EnterpriseSelector from "@/components/crm/EnterpriseSelector";
import ClickableEntityLink from "@/components/crm/ClickableEntityLink";
const opportunityStatuses = [
  { value: "lead", label: "Lead", color: "bg-gray-100 text-gray-800" },
  { value: "qualified", label: "Qualified", color: "bg-blue-100 text-blue-800" },
  { value: "proposal", label: "Proposal", color: "bg-yellow-100 text-yellow-800" },
  { value: "negotiation", label: "Negotiation", color: "bg-orange-100 text-orange-800" },
  { value: "closed_won", label: "Closed Won", color: "bg-green-100 text-green-800" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-100 text-red-800" },
];

const categoryColors = {
  land_projects: "bg-green-100 text-green-800",
  capital_sources: "bg-yellow-100 text-yellow-800", 
  open_source_tools: "bg-blue-100 text-blue-800",
  network_organizers: "bg-purple-100 text-purple-800",
  homes_that_heal: "bg-rose-100 text-rose-800",
  landscapes_that_nourish: "bg-emerald-100 text-emerald-800",
  lifelong_learning_providers: "bg-indigo-100 text-indigo-800",
};

const categoryLabels = {
  land_projects: "Land Project",
  capital_sources: "Capital Source",
  open_source_tools: "Open Source Tool", 
  network_organizers: "Network Organizer",
  homes_that_heal: "Homes that Heal",
  landscapes_that_nourish: "Landscapes that Nourish",
  lifelong_learning_providers: "Lifelong Learning",
};

export default function Opportunities() {
  const { enterpriseId } = useParams<{ enterpriseId: string }>();
  const { toast } = useToast();
  const { userSubscription } = useSubscription();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isFreeUser = userSubscription?.currentPlanType === 'free' && user?.role !== 'admin';
  const isAdmin = user?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<CrmWorkspaceOpportunity | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewingOpportunity, setViewingOpportunity] = useState<CrmWorkspaceOpportunity | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEntityType, setDrawerEntityType] = useState<"opportunity" | "person" | "enterprise">("opportunity");
  const [drawerEntityId, setDrawerEntityId] = useState<string>("");
  const [quickActionTaskDialogOpen, setQuickActionTaskDialogOpen] = useState(false);

  const form = useForm<InsertCrmWorkspaceOpportunity>({
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

  const taskForm = useForm<InsertCrmWorkspaceTask>({
    resolver: zodResolver(insertCrmWorkspaceTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: "",
      workspaceOpportunityId: "",
      workspacePersonId: "",
      workspaceEnterpriseId: "",
      workspaceId: enterpriseId,
    },
  });

  const { data: opportunities = [], isLoading, error: opportunitiesError } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "opportunities", searchQuery],
    queryFn: async (): Promise<CrmWorkspaceOpportunity[]> => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");

      const response = await fetch(`/api/crm/${enterpriseId}/workspace/opportunities?${params}`);
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
    enabled: isAuthenticated && !!enterpriseId,
    retry: false,
  });

  // Handle opportunities error
  useEffect(() => {
    if (opportunitiesError && isUnauthorizedError(opportunitiesError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [opportunitiesError, toast]);

  const { data: workspaceEnterprises = [] } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises"],
    queryFn: async (): Promise<CrmWorkspaceEnterprise[]> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/enterprises?limit=200`);
      if (!response.ok) throw new Error("Failed to fetch workspace enterprises");
      return response.json();
    },
    enabled: isAuthenticated && !!enterpriseId,
    retry: false,
  });

  const { data: people = [] } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "people"],
    queryFn: async (): Promise<CrmWorkspacePerson[]> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/people?limit=200`);
      if (!response.ok) throw new Error("Failed to fetch people");
      return response.json();
    },
    enabled: isAuthenticated && !!enterpriseId,
    retry: false,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "tasks"],
    queryFn: async () => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/tasks?limit=500`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: isAuthenticated && !!enterpriseId,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCrmWorkspaceOpportunity) => {
      return apiRequest("POST", `/api/crm/${enterpriseId}/workspace/opportunities`, data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "opportunities"] });
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "stats"] });
      toast({
        title: "Success",
        description: "Opportunity created successfully",
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
        description: "Failed to create opportunity",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCrmWorkspaceOpportunity> }) => {
      return apiRequest("PUT", `/api/crm/${enterpriseId}/workspace/opportunities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "opportunities"] });
      toast({
        title: "Success",
        description: "Opportunity updated successfully",
      });
      setIsDialogOpen(false);
      setEditingOpportunity(null);
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
        description: "Failed to update opportunity",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/crm/${enterpriseId}/workspace/opportunities/${id}`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "opportunities"] });
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "stats"] });
      toast({
        title: "Success",
        description: "Opportunity deleted successfully",
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
        description: "Failed to delete opportunity",
        variant: "destructive",
      });
    },
  });

  const generateLeadScoreMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      const opportunity = opportunities.find(o => o.id === opportunityId);
      if (!opportunity) throw new Error("Opportunity not found");

      return apiRequest("POST", `/api/crm/${enterpriseId}/ai/lead-score`, {
        workspaceEnterpriseId: opportunity.workspaceEnterpriseId,
        workspacePersonId: opportunity.workspacePersonId,
        opportunityId: opportunityId,
      });
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "opportunities"] });
      toast({
        title: "Success",
        description: "AI lead score generated successfully",
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
        description: "Failed to generate lead score",
        variant: "destructive",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertCrmWorkspaceTask) => {
      return apiRequest("POST", `/api/crm/${enterpriseId}/workspace/tasks`, data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "tasks"] });
      toast({ title: "Success", description: "Task created successfully" });
      setQuickActionTaskDialogOpen(false);
      taskForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    },
  });

  const handleQuickAddTask = (prefilledData: any) => {
    taskForm.reset({
      ...taskForm.getValues(),
      workspaceOpportunityId: prefilledData.workspaceOpportunityId || "",
      workspacePersonId: prefilledData.workspacePersonId || "",
      workspaceEnterpriseId: prefilledData.workspaceEnterpriseId || "",
    });
    setQuickActionTaskDialogOpen(true);
  };

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

  const handleSubmit = (data: InsertCrmWorkspaceOpportunity) => {
    const processedData = {
      ...data,
      value: data.value ? data.value * 100 : 0, // Convert to cents
      workspaceId: enterpriseId,
      workspaceEnterpriseId: data.workspaceEnterpriseId || null,
      workspacePersonId: data.workspacePersonId || null,
      expectedCloseDate: data.expectedCloseDate || null,
    };

    if (editingOpportunity) {
      updateMutation.mutate({ id: editingOpportunity.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
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

  const handleEdit = (opportunity: CrmWorkspaceOpportunity) => {
    setEditingOpportunity(opportunity);
    form.reset({
      title: opportunity.title,
      description: opportunity.description || "",
      value: opportunity.value ? opportunity.value / 100 : 0, // Convert from cents
      status: opportunity.status,
      probability: opportunity.probability || 0,
      workspaceEnterpriseId: opportunity.workspaceEnterpriseId || "",
      workspacePersonId: opportunity.workspacePersonId || "",
      expectedCloseDate: opportunity.expectedCloseDate || null,
      notes: opportunity.notes || "",
      workspaceId: enterpriseId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this opportunity?")) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingOpportunity(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/crm/opportunities/export', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to export opportunities');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `opportunities-export-${timestamp}.csv`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Opportunities exported successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
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
        description: "Failed to export opportunities",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredOpportunities = statusFilter
    ? opportunities.filter(opportunity => opportunity.status === statusFilter)
    : opportunities;


  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground font-lato">Opportunities</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {isAdmin ? (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700" data-testid="badge-admin-mode">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin Mode
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" data-testid="badge-team-member">
                      <Users className="h-3 w-3 mr-1" />
                      Team Member
                    </Badge>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isAdmin ? "You have global access to edit any opportunity" : "You can edit opportunities where you're a member"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground">Track deals and partnership opportunities</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportCSV} 
            disabled={isExporting || isFreeUser}
            data-testid="button-export-csv"
            title={isFreeUser ? "Upgrade to CRM Pro to export" : undefined}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} disabled={isFreeUser} data-testid="button-create-opportunity">
                {isFreeUser && <Lock className="w-4 h-4 mr-2" />}
                <Plus className="w-4 h-4 mr-2" />
                Add Opportunity
              </Button>
            </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-lato">
                  {editingOpportunity ? "Edit Opportunity" : "Create New Opportunity"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What's this opportunity about?</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Partnership with Green Energy Co-op, Grant application for community fund"
                            {...field}
                            data-testid="input-opportunity-title"
                          />
                        </FormControl>
                        <FormDescription>
                          Give this opportunity a clear, memorable title
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tell us more about this opportunity</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What makes this exciting? What value could it bring to your mission..."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-opportunity-description"
                          />
                        </FormControl>
                        <FormDescription>
                          Describe the potential and what success looks like
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Potential value ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 50000"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-opportunity-value"
                            />
                          </FormControl>
                          <FormDescription>
                            Estimated financial impact
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current stage</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-opportunity-status">
                                <SelectValue placeholder="Where is this?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {opportunityStatuses.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Track where this is in your pipeline
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="probability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How likely? (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="e.g., 75"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-opportunity-probability"
                            />
                          </FormControl>
                          <FormDescription>
                            Chance of success (0-100%)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="workspaceEnterpriseId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Which enterprise is this with?</FormLabel>
                          <FormControl>
                            <EnterpriseSelector
                              value={field.value}
                              onChange={field.onChange}
                              workspaceEnterprises={workspaceEnterprises}
                              enterpriseId={enterpriseId}
                            />
                          </FormControl>
                          <FormDescription>
                            Link to the related enterprise
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workspacePersonId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Who's your main contact?</FormLabel>
                          <Popover open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={contactPopoverOpen}
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  data-testid="select-opportunity-contact"
                                >
                                  {field.value
                                    ? (() => {
                                        const person = people.find((p) => p.id === field.value);
                                        return person ? `${person.firstName} ${person.lastName}` : "Choose contact...";
                                      })()
                                    : field.value === null
                                    ? "No Contact"
                                    : "Choose contact..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search contacts..." />
                                <CommandList>
                                  <CommandEmpty>No contact found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="none"
                                      onSelect={() => {
                                        form.setValue("workspacePersonId", null);
                                        setContactPopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === null ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      No Contact
                                    </CommandItem>
                                    {people.map((person) => {
                                      const enterprise = workspaceEnterprises.find(e => e.id === person.workspaceEnterpriseId);
                                      const displayName = `${person.firstName} ${person.lastName}`;
                                      const searchValue = enterprise 
                                        ? `${displayName} ${enterprise.name}`
                                        : displayName;
                                      
                                      return (
                                        <CommandItem
                                          key={person.id}
                                          value={searchValue}
                                          onSelect={() => {
                                            form.setValue("workspacePersonId", person.id);
                                            setContactPopoverOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              person.id === field.value ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span>{displayName}</span>
                                            {enterprise && (
                                              <span className="text-xs text-muted-foreground">
                                                {enterprise.name}
                                              </span>
                                            )}
                                          </div>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Connect to the key person for this opportunity
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="expectedCloseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>When do you expect to close this?</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : String(field.value).split('T')[0]) : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            data-testid="input-opportunity-close-date"
                          />
                        </FormControl>
                        <FormDescription>
                          Target date to seal the deal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your notes and strategy</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Track conversations, next steps, key insights, or things to remember..."
                            className="min-h-[80px]"
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-opportunity-notes"
                          />
                        </FormControl>
                        <FormDescription>
                          Keep important details about this opportunity here
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel-opportunity"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-opportunity"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Saving..."
                        : editingOpportunity
                        ? "Update Opportunity"
                        : "Create Opportunity"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Upgrade Prompt for Free Users */}
        {isFreeUser && (
          <div className="mb-6">
            <UpgradePrompt
              feature="opportunity management"
              title="Unlock Unlimited Opportunities"
              benefits={[
                "Create and track unlimited opportunities",
                "AI-powered lead scoring and insights",
                "Export opportunities to CSV",
                "Advanced filtering and analytics",
                "Priority email support",
              ]}
            />
          </div>
        )}

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  data-testid="search-opportunities"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
                  <SelectTrigger className="w-48" data-testid="filter-status">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {opportunityStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {statusFilter && (
                  <Button
                    variant="outline"
                    onClick={() => setStatusFilter(null)}
                    data-testid="button-clear-status-filter"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Opportunities ({filteredOpportunities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="text-center py-12">
                <Handshake className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery || statusFilter
                    ? "No matches yet"
                    : "Your pipeline awaits!"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter
                    ? "Try adjusting your filters or search"
                    : "Create your first opportunity and watch your impact grow."}
                </p>
                {!searchQuery && !statusFilter && (
                  <Button onClick={openCreateDialog} data-testid="button-add-first-opportunity">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Opportunity
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-3">
                  {filteredOpportunities.map((opportunity) => {
                    const enterprise = workspaceEnterprises.find(e => e.id === opportunity.workspaceEnterpriseId);
                    const contact = people.find(p => p.id === opportunity.workspacePersonId);
                    const status = opportunityStatuses.find(s => s.value === opportunity.status);

                    return (
                      <Card key={opportunity.id} className="touch-manipulation" data-testid={`card-opportunity-${opportunity.id}`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-foreground truncate">
                                  {opportunity.title}
                                </h3>
                                {opportunity.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {opportunity.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5">
                              {status && (
                                <Badge className={`text-xs ${status.color}`}>
                                  {status.label}
                                </Badge>
                              )}
                              {enterprise && enterprise.category && (
                                <Badge className={`text-xs ${categoryColors[enterprise.category as keyof typeof categoryColors]}`}>
                                  {categoryLabels[enterprise.category as keyof typeof categoryLabels]}
                                </Badge>
                              )}
                            </div>

                            {enterprise && (
                              <ClickableEntityLink
                                type="enterprise"
                                id={enterprise.id}
                                name={enterprise.name}
                                onClick={handleOpenDrawer}
                                showTooltip={false}
                                className="w-fit"
                              />
                            )}

                            {contact && (
                              <ClickableEntityLink
                                type="person"
                                id={contact.id}
                                name={`${contact.firstName} ${contact.lastName}`}
                                onClick={handleOpenDrawer}
                                showTooltip={false}
                                className="w-fit"
                              />
                            )}

                            {opportunity.value && opportunity.value > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="font-medium">
                                  ${(opportunity.value / 100).toLocaleString()}
                                </span>
                              </div>
                            )}

                            {opportunity.probability !== null && opportunity.probability > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Probability</span>
                                  <span className="font-medium">{opportunity.probability}%</span>
                                </div>
                                <Progress value={opportunity.probability} className="h-2" />
                              </div>
                            )}

                            {opportunity.aiScore && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    AI Score
                                  </span>
                                  <span className="font-medium">{opportunity.aiScore}/100</span>
                                </div>
                                <Progress value={opportunity.aiScore} className="h-2" />
                              </div>
                            )}

                            {opportunity.aiInsights && (
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                <strong>AI Insights:</strong> {opportunity.aiInsights}
                              </div>
                            )}

                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleOpenDrawer("opportunity", opportunity.id)}
                                data-testid={`button-view-${opportunity.id}`}
                              >
                                <ExternalLink className="w-4 h-4 mr-1.5" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleEdit(opportunity)}
                                disabled={isFreeUser}
                                data-testid={`button-edit-${opportunity.id}`}
                              >
                                <Edit className="w-4 h-4 mr-1.5" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(opportunity.id)}
                                disabled={isFreeUser}
                                data-testid={`button-delete-${opportunity.id}`}
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
                        <TableHead>Opportunity</TableHead>
                        <TableHead>Enterprise</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Probability</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOpportunities.map((opportunity) => {
                        const enterprise = workspaceEnterprises.find(e => e.id === opportunity.workspaceEnterpriseId);
                        const contact = people.find(p => p.id === opportunity.workspacePersonId);
                        const status = opportunityStatuses.find(s => s.value === opportunity.status);
                        const taskCount = allTasks.filter(t => t.workspaceOpportunityId === opportunity.id).length;

                        return (
                          <TableRow key={opportunity.id} data-testid={`row-opportunity-${opportunity.id}`}>
                            <TableCell>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate">
                                  {opportunity.title}
                                </div>
                                {opportunity.description && (
                                  <div className="text-xs text-muted-foreground truncate max-w-xs">
                                    {opportunity.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {opportunity.aiScore && (
                                    <div className="flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3 text-purple-600" />
                                      <span className="text-xs text-muted-foreground">
                                        AI Score: {opportunity.aiScore}/100
                                      </span>
                                    </div>
                                  )}
                                  {taskCount > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200" data-testid={`badge-tasks-${opportunity.id}`}>
                                            <ListTodo className="w-3 h-3 mr-1" />
                                            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{taskCount} task{taskCount === 1 ? '' : 's'} for this opportunity</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {enterprise ? (
                                <div className="min-w-0 space-y-1">
                                  <ClickableEntityLink
                                    type="enterprise"
                                    id={enterprise.id}
                                    name={enterprise.name}
                                    onClick={handleOpenDrawer}
                                  />
                                  <div className="flex items-center gap-1 flex-wrap ml-2">
                                    {enterprise.category && (
                                      <Badge className={`text-xs ${categoryColors[enterprise.category as keyof typeof categoryColors]}`}>
                                        {categoryLabels[enterprise.category as keyof typeof categoryLabels]}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {contact ? (
                                <div className="min-w-0 space-y-1">
                                  <ClickableEntityLink
                                    type="person"
                                    id={contact.id}
                                    name={`${contact.firstName} ${contact.lastName}`}
                                    onClick={handleOpenDrawer}
                                  />
                                  {contact.title && (
                                    <div className="text-xs text-muted-foreground truncate max-w-[150px] ml-2">
                                      {contact.title}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {opportunity.value && opportunity.value > 0 ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <DollarSign className="w-3 h-3 text-green-600" />
                                  <span className="font-medium">
                                    ${(opportunity.value / 100).toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {opportunity.probability !== null && opportunity.probability > 0 ? (
                                <div className="space-y-1 min-w-[100px]">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-medium">{opportunity.probability}%</span>
                                  </div>
                                  <Progress value={opportunity.probability} className="h-2" />
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {status && (
                                <Badge className={`${status.color}`}>
                                  {status.label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateLeadScoreMutation.mutate(opportunity.id)}
                                  disabled={generateLeadScoreMutation.isPending || isFreeUser}
                                  data-testid={`button-generate-score-${opportunity.id}`}
                                  title={isFreeUser ? "Upgrade to CRM Pro to generate lead score" : "Generate AI lead score"}
                                >
                                  <Lightbulb className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDrawer("opportunity", opportunity.id)}
                                  data-testid={`button-view-${opportunity.id}`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(opportunity)}
                                  disabled={isFreeUser}
                                  data-testid={`button-edit-${opportunity.id}`}
                                  title={isFreeUser ? "Upgrade to CRM Pro to edit" : undefined}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(opportunity.id)}
                                  disabled={isFreeUser}
                                  data-testid={`button-delete-${opportunity.id}`}
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

        {/* Opportunity Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {viewingOpportunity && (() => {
              const enterprise = workspaceEnterprises.find(e => e.id === viewingOpportunity.workspaceEnterpriseId);
              const contact = people.find(p => p.id === viewingOpportunity.workspacePersonId);
              const status = opportunityStatuses.find(s => s.value === viewingOpportunity.status);

              return (
                <>
                  <DialogHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <DialogTitle className="font-lato text-2xl mb-2">
                          {viewingOpportunity.title}
                        </DialogTitle>
                        {status && (
                          <Badge className={`${status.color}`}>
                            {status.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6 mt-6">
                    {/* Description */}
                    {viewingOpportunity.description && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Description</h4>
                        <p className="text-foreground">{viewingOpportunity.description}</p>
                      </div>
                    )}

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {viewingOpportunity.value && viewingOpportunity.value > 0 && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-green-600 mb-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-xs font-medium">Value</span>
                            </div>
                            <p className="text-2xl font-bold">
                              ${(viewingOpportunity.value / 100).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {viewingOpportunity.probability !== null && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs font-medium">Probability</span>
                            </div>
                            <p className="text-2xl font-bold">{viewingOpportunity.probability}%</p>
                          </CardContent>
                        </Card>
                      )}

                      {viewingOpportunity.aiScore && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-purple-600 mb-1">
                              <Lightbulb className="w-4 h-4" />
                              <span className="text-xs font-medium">AI Score</span>
                            </div>
                            <p className="text-2xl font-bold">{viewingOpportunity.aiScore}/100</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <Separator />

                    {/* Enterprise Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Enterprise
                      </h4>
                      {enterprise ? (
                        <Card className="border-2">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h5 className="font-semibold text-lg mb-2" data-testid="detail-enterprise-name">
                                  {enterprise.name}
                                </h5>
                                {enterprise.category && (
                                  <Badge className={`${categoryColors[enterprise.category as keyof typeof categoryColors]} mb-2`}>
                                    {categoryLabels[enterprise.category as keyof typeof categoryLabels]}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/enterprises/${enterprise.id}`, '_blank')}
                                data-testid="button-view-enterprise"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              {enterprise.location && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="w-4 h-4" />
                                  <span>{enterprise.location}</span>
                                </div>
                              )}
                              {enterprise.description && (
                                <p className="text-muted-foreground mt-2">{enterprise.description}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="p-6 text-center">
                            <Building className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-muted-foreground text-sm">No enterprise linked to this opportunity</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Contact Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Primary Contact
                      </h4>
                      {contact ? (
                        <Card className="border-2">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h5 className="font-semibold text-lg mb-1" data-testid="detail-contact-name">
                                  {contact.firstName} {contact.lastName}
                                </h5>
                                {contact.title && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" />
                                    {contact.title}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              {contact.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="w-4 h-4" />
                                  <a href={`mailto:${contact.email}`} className="hover:underline text-primary">
                                    {contact.email}
                                  </a>
                                </div>
                              )}
                              {contact.notes && (
                                <p className="text-muted-foreground mt-2">{contact.notes}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="p-6 text-center">
                            <User className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-muted-foreground text-sm">No contact assigned to this opportunity</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Additional Information */}
                    {(viewingOpportunity.expectedCloseDate || viewingOpportunity.notes || viewingOpportunity.aiInsights) && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          {viewingOpportunity.expectedCloseDate && (
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Expected Close Date
                              </h4>
                              <p className="text-foreground">
                                {new Date(viewingOpportunity.expectedCloseDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          )}

                          {viewingOpportunity.aiInsights && (
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                AI Insights
                              </h4>
                              <p className="text-foreground bg-muted/50 p-3 rounded-lg">
                                {viewingOpportunity.aiInsights}
                              </p>
                            </div>
                          )}

                          {viewingOpportunity.notes && (
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Notes</h4>
                              <p className="text-foreground bg-muted/50 p-3 rounded-lg">
                                {viewingOpportunity.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        handleEdit(viewingOpportunity);
                      }}
                      data-testid="button-edit-from-detail"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Opportunity
                    </Button>
                    <Button
                      onClick={() => setIsDetailDialogOpen(false)}
                      data-testid="button-close-detail"
                    >
                      Close
                    </Button>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Entity Drawer */}
        {/* Quick Action Task Dialog */}
        <Dialog open={quickActionTaskDialogOpen} onOpenChange={setQuickActionTaskDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit(data => createTaskMutation.mutate({...data, workspaceId: enterpriseId}))} className="space-y-4">
                <FormField control={taskForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={taskForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setQuickActionTaskDialogOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div>
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
            const opportunity = opportunities.find(o => o.id === drawerEntityId);
            if (opportunity) {
              setDrawerOpen(false);
              handleEdit(opportunity);
            }
          }}
          onDelete={() => {
            setDrawerOpen(false);
            handleDelete(drawerEntityId);
          }}
          onNavigate={handleDrawerNavigate}
          onAddTask={handleQuickAddTask}
        />
    </>
  );
}
