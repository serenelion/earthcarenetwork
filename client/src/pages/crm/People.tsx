import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link, useParams } from "wouter";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Edit,
  Trash2,
  ExternalLink,
  Filter,
  Building,
  Lock,
  Info,
  Shield,
  Link2,
  DollarSign,
  ListTodo,
} from "lucide-react";
import SearchBar from "@/components/SearchBar";
import UpgradePrompt from "@/components/UpgradePrompt";
import { insertCrmWorkspacePersonSchema, insertCrmWorkspaceOpportunitySchema, insertCrmWorkspaceTaskSchema, type CrmWorkspacePerson, type InsertCrmWorkspacePerson, type Enterprise, type CrmWorkspaceEnterprise, type CrmWorkspaceEnterprisePerson, type InsertCrmWorkspaceEnterprisePerson, type InsertCrmWorkspaceOpportunity, type InsertCrmWorkspaceTask } from "@shared/schema";
import EntityDrawer from "@/components/crm/EntityDrawer";
const invitationStatuses = [
  { value: "not_invited", label: "Not Invited", color: "bg-gray-100 text-gray-800" },
  { value: "invited", label: "Invited", color: "bg-blue-100 text-blue-800" },
  { value: "signed_up", label: "Signed Up", color: "bg-green-100 text-green-800" },
  { value: "active", label: "Active", color: "bg-primary/10 text-primary" },
];

const claimStatuses = [
  { value: "unclaimed", label: "Unclaimed", color: "bg-gray-100 text-gray-800" },
  { value: "claimed", label: "Claimed", color: "bg-yellow-100 text-yellow-800" },
  { value: "verified", label: "Verified", color: "bg-green-100 text-green-800" },
];

const buildProStatuses = [
  { value: "not_offered", label: "Not Offered", color: "bg-gray-100 text-gray-800" },
  { value: "offered", label: "Offered", color: "bg-blue-100 text-blue-800" },
  { value: "trial", label: "Trial", color: "bg-yellow-100 text-yellow-800" },
  { value: "subscribed", label: "Subscribed", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

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

export default function People() {
  const { enterpriseId } = useParams<{ enterpriseId: string }>();
  const { toast } = useToast();
  const { userSubscription } = useSubscription();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isFreeUser = userSubscription?.currentPlanType === 'free' && user?.role !== 'admin';
  const isAdmin = user?.role === 'admin';
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<CrmWorkspacePerson | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<CrmWorkspacePerson | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [connectionsDialogOpen, setConnectionsDialogOpen] = useState(false);
  const [selectedPersonForConnections, setSelectedPersonForConnections] = useState<CrmWorkspacePerson | null>(null);
  const [newConnectionEnterpriseId, setNewConnectionEnterpriseId] = useState<string>("");
  const [newConnectionRelationshipType, setNewConnectionRelationshipType] = useState<string>("employee");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEntityType, setDrawerEntityType] = useState<"opportunity" | "person" | "enterprise">("person");
  const [drawerEntityId, setDrawerEntityId] = useState<string>("");
  const [quickActionOpportunityDialogOpen, setQuickActionOpportunityDialogOpen] = useState(false);
  const [quickActionTaskDialogOpen, setQuickActionTaskDialogOpen] = useState(false);
  const [quickActionPrefilledData, setQuickActionPrefilledData] = useState<any>(null);

  const form = useForm<InsertCrmWorkspacePerson>({
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

  const taskForm = useForm<InsertCrmWorkspaceTask>({
    resolver: zodResolver(insertCrmWorkspaceTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      assignedToId: "",
      workspaceId: enterpriseId,
      workspaceEnterpriseId: "",
      workspacePersonId: "",
      workspaceOpportunityId: "",
    },
  });

  const { data: people = [], isLoading, error: peopleError } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "people", searchQuery],
    queryFn: async (): Promise<CrmWorkspacePerson[]> => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");

      const response = await fetch(`/api/crm/${enterpriseId}/workspace/people?${params}`);
      if (!response.ok) throw new Error("Failed to fetch people");
      return response.json();
    },
    enabled: isAuthenticated && !!enterpriseId,
    retry: false,
  });

  // Handle people error
  useEffect(() => {
    if (peopleError && isUnauthorizedError(peopleError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [peopleError, toast]);

  const { data: enterprises = [] } = useQuery({
    queryKey: ["/api/enterprises"],
    queryFn: async (): Promise<Enterprise[]> => {
      const response = await fetch("/api/enterprises?limit=200");
      if (!response.ok) throw new Error("Failed to fetch enterprises");
      return response.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: workspaceEnterprises = [] } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises"],
    queryFn: async (): Promise<CrmWorkspaceEnterprise[]> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/enterprises`);
      if (!response.ok) throw new Error("Failed to fetch workspace enterprises");
      return response.json();
    },
    enabled: isAuthenticated && !!enterpriseId,
    retry: false,
  });

  const { data: personConnections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "enterprise-people-connections", "person", selectedPersonForConnections?.id],
    queryFn: async (): Promise<CrmWorkspaceEnterprisePerson[]> => {
      if (!selectedPersonForConnections) return [];
      const params = new URLSearchParams({ personId: selectedPersonForConnections.id });
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/enterprise-people-connections?${params}`);
      if (!response.ok) throw new Error("Failed to fetch connections");
      return response.json();
    },
    enabled: !!selectedPersonForConnections && !!enterpriseId,
    retry: false,
  });

  const { data: allOpportunities = [] } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "opportunities"],
    queryFn: async () => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/opportunities?limit=500`);
      if (!response.ok) throw new Error("Failed to fetch opportunities");
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
    mutationFn: async (data: InsertCrmWorkspacePerson) => {
      return apiRequest("POST", `/api/crm/${enterpriseId}/workspace/people`, data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "people"] });
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "stats"] });
      toast({
        title: "Success",
        description: "Person created successfully",
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
        description: "Failed to create person",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCrmWorkspacePerson> }) => {
      return apiRequest("PUT", `/api/crm/${enterpriseId}/workspace/people/${id}`, data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "people"] });
      toast({
        title: "Success",
        description: "Person updated successfully",
      });
      setIsDialogOpen(false);
      setEditingPerson(null);
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
        description: "Failed to update person",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/crm/${enterpriseId}/workspace/people/${id}`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "people"] });
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "stats"] });
      toast({
        title: "Success",
        description: "Person deleted successfully",
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
        description: "Failed to delete person",
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { personId: string; subject: string; body: string }) => {
      return apiRequest("POST", `/api/crm/${enterpriseId}/communications/email`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      setEmailDialogOpen(false);
      setEmailSubject("");
      setEmailBody("");
      setSelectedPerson(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    },
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
      setNewConnectionEnterpriseId("");
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

  const createOpportunityMutation = useMutation({
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
      setQuickActionOpportunityDialogOpen(false);
      opportunityForm.reset();
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

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertCrmWorkspaceTask) => {
      return apiRequest("POST", `/api/crm/${enterpriseId}/workspace/tasks`, data);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "tasks"] });
      queryClient.refetchQueries({ queryKey: ["/api/crm", enterpriseId, "stats"] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      setQuickActionTaskDialogOpen(false);
      taskForm.reset();
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
        description: "Failed to create task",
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

  const handleSubmit = (data: InsertCrmWorkspacePerson) => {
    const processedData = {
      ...data,
      workspaceId: enterpriseId,
      workspaceEnterpriseId: data.workspaceEnterpriseId || null,
    };

    if (editingPerson) {
      updateMutation.mutate({ id: editingPerson.id, data: processedData });
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

  const handleQuickAddOpportunity = (prefilledData: any) => {
    opportunityForm.reset({
      title: "",
      description: "",
      value: 0,
      status: "lead",
      probability: 0,
      workspaceEnterpriseId: prefilledData.workspaceEnterpriseId || "",
      workspacePersonId: prefilledData.workspacePersonId || "",
      notes: "",
      workspaceId: enterpriseId,
    });
    setQuickActionPrefilledData(prefilledData);
    setQuickActionOpportunityDialogOpen(true);
  };

  const handleQuickAddTask = (prefilledData: any) => {
    taskForm.reset({
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      assignedToId: "",
      workspaceId: enterpriseId,
      workspaceEnterpriseId: prefilledData.workspaceEnterpriseId || "",
      workspacePersonId: prefilledData.workspacePersonId || "",
      workspaceOpportunityId: prefilledData.workspaceOpportunityId || "",
    });
    setQuickActionPrefilledData(prefilledData);
    setQuickActionTaskDialogOpen(true);
  };

  const handleSubmitOpportunity = (data: InsertCrmWorkspaceOpportunity) => {
    const processedData = {
      ...data,
      workspaceId: enterpriseId,
      workspaceEnterpriseId: data.workspaceEnterpriseId || null,
      workspacePersonId: data.workspacePersonId || null,
    };
    createOpportunityMutation.mutate(processedData);
  };

  const handleSubmitTask = (data: InsertCrmWorkspaceTask) => {
    const processedData = {
      ...data,
      workspaceId: enterpriseId,
      assignedToId: data.assignedToId || null,
      workspaceEnterpriseId: data.workspaceEnterpriseId || null,
      workspacePersonId: data.workspacePersonId || null,
      workspaceOpportunityId: data.workspaceOpportunityId || null,
      dueDate: data.dueDate || null,
    };
    createTaskMutation.mutate(processedData);
  };

  const handleEdit = (person: CrmWorkspacePerson) => {
    setEditingPerson(person);
    form.reset({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email || "",
      phone: person.phone || "",
      title: person.title || "",
      workspaceEnterpriseId: person.workspaceEnterpriseId || "",
      linkedinUrl: person.linkedinUrl || "",
      notes: person.notes || "",
      workspaceId: enterpriseId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this person?")) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingPerson(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleCreateConnection = () => {
    if (!selectedPersonForConnections || !newConnectionEnterpriseId) {
      toast({
        title: "Error",
        description: "Please select an enterprise",
        variant: "destructive",
      });
      return;
    }

    createConnectionMutation.mutate({
      workspaceId: enterpriseId,
      workspaceEnterpriseId: newConnectionEnterpriseId,
      workspacePersonId: selectedPersonForConnections.id,
      relationshipType: newConnectionRelationshipType as any,
      isPrimary: personConnections.length === 0,
    });
  };

  const filteredPeople = people;


  return (
    <>
      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground font-lato">People</h1>
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
                  <p>{isAdmin ? "You have global access to edit any person" : "You can edit people where you're a member"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground">Manage contacts and track user journeys</p>
        </div>
        <Button onClick={openCreateDialog} disabled={isFreeUser} data-testid="button-create-person">
          {isFreeUser && <Lock className="w-4 h-4 mr-2" />}
          <Plus className="w-4 h-4 mr-2" />
          Add Person
        </Button>
      </div>
      
      {/* Mobile Title */}
      <div className="md:hidden mb-4">
        <p className="text-sm text-muted-foreground">Manage contacts and track user journeys</p>
      </div>

      {/* Upgrade Prompt for Free Users */}
      {isFreeUser && (
        <div className="mb-6">
          <UpgradePrompt
            feature="contact management"
            title="Unlock Complete Contact Management"
            benefits={[
              "Create and manage unlimited contacts",
              "Track invitation and claim status",
              "Build Pro subscription management",
              "Advanced contact segmentation",
              "Contact import/export tools",
            ]}
          />
        </div>
      )}
      
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-lato text-base md:text-lg">
                  {editingPerson ? "Edit Person" : "Add New Person"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter first name"
                              {...field}
                              data-testid="input-first-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter last name"
                              {...field}
                              data-testid="input-last-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@example.com"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+1 (555) 123-4567"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter job title"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workspaceEnterpriseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enterprise</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === "none" ? null : value)} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-enterprise">
                                <SelectValue placeholder="Select enterprise" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Enterprise</SelectItem>
                              {enterprises.map((enterprise) => (
                                <SelectItem key={enterprise.id} value={enterprise.id}>
                                  {enterprise.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://linkedin.com/in/username"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-linkedin"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add notes about this person"
                            className="min-h-[80px]"
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel-person"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-person"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Saving..."
                        : editingPerson
                        ? "Update Person"
                        : "Create Person"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

      {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  data-testid="search-people"
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
                    {[...invitationStatuses, ...claimStatuses, ...buildProStatuses].map((status) => (
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

        {/* People Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPeople.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No people found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first contact"}
              </p>
              <Button onClick={openCreateDialog} data-testid="button-add-first-person">
                <Plus className="w-4 h-4 mr-2" />
                Add Person
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {filteredPeople.map((person) => {
                const enterprise = enterprises.find(e => e.id === person.enterpriseId);
                const invitationStatus = invitationStatuses.find(s => s.value === person.invitationStatus);
                const claimStatus = claimStatuses.find(s => s.value === person.claimStatus);
                const buildProStatus = buildProStatuses.find(s => s.value === person.buildProStatus);

                return (
                  <Card key={person.id} className="touch-manipulation" data-testid={`person-card-${person.id}`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-foreground font-lato">
                              {person.firstName} {person.lastName}
                            </h3>
                            {person.title && (
                              <p className="text-sm text-muted-foreground">{person.title}</p>
                            )}
                            {person.email && (
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Mail className="w-3.5 h-3.5 mr-1.5" />
                                <a href={`mailto:${person.email}`} className="hover:text-primary truncate">
                                  {person.email}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {enterprise && (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">
                              <Building className="w-3 h-3 mr-1" />
                              {enterprise.name}
                            </Badge>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {invitationStatus && (
                            <Badge className={`text-xs ${invitationStatus.color}`} data-testid={`badge-invitation-${person.id}`}>
                              {invitationStatus.label}
                            </Badge>
                          )}
                          {claimStatus && (
                            <Badge className={`text-xs ${claimStatus.color}`} data-testid={`badge-claim-${person.id}`}>
                              {claimStatus.label}
                            </Badge>
                          )}
                          {buildProStatus && (
                            <Badge className={`text-xs ${buildProStatus.color}`} data-testid={`badge-buildpro-${person.id}`}>
                              {buildProStatus.label}
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleOpenDrawer("person", person.id)}
                            data-testid={`button-view-${person.id}`}
                          >
                            <ExternalLink className="w-4 h-4 mr-1.5" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPersonForConnections(person);
                              setConnectionsDialogOpen(true);
                            }}
                            disabled={isFreeUser}
                            data-testid={`button-connections-${person.id}`}
                            title="Manage enterprise connections"
                          >
                            <Building className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPerson(person);
                              setEmailDialogOpen(true);
                            }}
                            disabled={!person.email || isFreeUser}
                            data-testid={`button-email-${person.id}`}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(person)}
                            disabled={isFreeUser}
                            data-testid={`button-edit-${person.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(person.id)}
                            disabled={isFreeUser}
                            data-testid={`button-delete-${person.id}`}
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
                    <TableHead>Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Enterprise</TableHead>
                    <TableHead>Invitation Status</TableHead>
                    <TableHead>Claim Status</TableHead>
                    <TableHead>Build Pro Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeople.map((person) => {
                    const enterprise = enterprises.find(e => e.id === person.enterpriseId);
                    const invitationStatus = invitationStatuses.find(s => s.value === person.invitationStatus);
                    const claimStatus = claimStatuses.find(s => s.value === person.claimStatus);
                    const buildProStatus = buildProStatuses.find(s => s.value === person.buildProStatus);
                    const opportunityCount = allOpportunities.filter(o => o.primaryContactId === person.id).length;
                    const taskCount = allTasks.filter(t => t.workspacePersonId === person.id).length;

                    return (
                      <TableRow key={person.id} data-testid={`person-card-${person.id}`}>
                        <TableCell>
                          <div className="font-semibold text-foreground">
                            {person.firstName} {person.lastName}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {opportunityCount > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200" data-testid={`badge-opportunities-${person.id}`}>
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      {opportunityCount} {opportunityCount === 1 ? 'opp' : 'opps'}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{opportunityCount} opportunit{opportunityCount === 1 ? 'y' : 'ies'} for this contact</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {taskCount > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200" data-testid={`badge-tasks-${person.id}`}>
                                      <ListTodo className="w-3 h-3 mr-1" />
                                      {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{taskCount} task{taskCount === 1 ? '' : 's'} assigned to this person</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {person.title || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {person.email ? (
                            <a href={`mailto:${person.email}`} className="text-sm hover:text-primary">
                              {person.email}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {person.workspaceEnterpriseId ? (
                            <button
                              onClick={() => handleOpenDrawer("enterprise", person.workspaceEnterpriseId!)}
                              className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer transition-colors"
                              data-testid={`link-enterprise-${person.id}`}
                            >
                              <Building className="w-3 h-3 flex-shrink-0" />
                              <span className="font-medium">{workspaceEnterprises.find(we => we.id === person.workspaceEnterpriseId)?.name || 'Enterprise'}</span>
                            </button>
                          ) : enterprise ? (
                            <Badge variant="outline" className="text-xs">
                              <Building className="w-3 h-3 mr-1" />
                              {enterprise.name}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {invitationStatus && (
                            <Badge className={`text-xs ${invitationStatus.color}`} data-testid={`badge-invitation-${person.id}`}>
                              {invitationStatus.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {claimStatus && (
                            <Badge className={`text-xs ${claimStatus.color}`} data-testid={`badge-claim-${person.id}`}>
                              {claimStatus.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {buildProStatus && (
                            <Badge className={`text-xs ${buildProStatus.color}`} data-testid={`badge-buildpro-${person.id}`}>
                              {buildProStatus.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDrawer("person", person.id)}
                              data-testid={`button-view-${person.id}`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPersonForConnections(person);
                                setConnectionsDialogOpen(true);
                              }}
                              disabled={isFreeUser}
                              data-testid={`button-connections-${person.id}`}
                              title={isFreeUser ? "Upgrade to CRM Pro to manage connections" : "Manage enterprise connections"}
                            >
                              <Building className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPerson(person);
                                setEmailDialogOpen(true);
                              }}
                              disabled={!person.email || isFreeUser}
                              data-testid={`button-email-${person.id}`}
                              title={!person.email ? "No email address" : isFreeUser ? "Upgrade to CRM Pro to send email" : undefined}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(person)}
                              disabled={isFreeUser}
                              data-testid={`button-edit-${person.id}`}
                              title={isFreeUser ? "Upgrade to CRM Pro to edit" : undefined}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(person.id)}
                              disabled={isFreeUser}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-${person.id}`}
                              title={isFreeUser ? "Upgrade to CRM Pro to delete" : undefined}
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Email to {selectedPerson?.firstName} {selectedPerson?.lastName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">To:</label>
                <p className="text-sm text-muted-foreground">{selectedPerson?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject"
                  data-testid="input-email-subject"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-[200px]"
                  data-testid="input-email-body"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEmailDialogOpen(false)}
                  data-testid="button-cancel-email"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedPerson) {
                      sendEmailMutation.mutate({
                        personId: selectedPerson.id,
                        subject: emailSubject,
                        body: emailBody,
                      });
                    }
                  }}
                  disabled={!emailSubject || !emailBody || sendEmailMutation.isPending}
                  data-testid="button-send-email"
                >
                  {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enterprise Connections Dialog */}
        <Dialog open={connectionsDialogOpen} onOpenChange={setConnectionsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Enterprise Connections for {selectedPersonForConnections?.firstName} {selectedPersonForConnections?.lastName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* List of current connections */}
              <ScrollArea className="h-[300px]">
                {connectionsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Loading connections...</p>
                  </div>
                ) : personConnections.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">No enterprise connections yet</p>
                  </div>
                ) : (
                  personConnections.map((connection) => {
                    const enterprise = workspaceEnterprises.find(e => e.id === connection.workspaceEnterpriseId);
                    const relationshipLabel = relationshipTypes.find(r => r.value === connection.relationshipType)?.label;
                    
                    return (
                      <Card key={connection.id} className="mb-2">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{enterprise?.name || "Unknown Enterprise"}</p>
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
                    <label className="text-sm font-medium mb-1 block">Enterprise</label>
                    <Select 
                      value={newConnectionEnterpriseId} 
                      onValueChange={setNewConnectionEnterpriseId}
                      disabled={isFreeUser}
                    >
                      <SelectTrigger data-testid="select-enterprise">
                        <SelectValue placeholder="Select enterprise" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaceEnterprises
                          .filter(e => !personConnections.some(c => c.workspaceEnterpriseId === e.id))
                          .map((enterprise) => (
                            <SelectItem key={enterprise.id} value={enterprise.id}>
                              {enterprise.name}
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
                      setNewConnectionEnterpriseId("");
                      setNewConnectionRelationshipType("employee");
                    }}
                    data-testid="button-cancel-connection"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateConnection}
                    disabled={!newConnectionEnterpriseId || createConnectionMutation.isPending || isFreeUser}
                    data-testid="button-add-connection"
                  >
                    {createConnectionMutation.isPending ? "Adding..." : "Add Connection"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Action: Add Opportunity Dialog */}
        <Dialog open={quickActionOpportunityDialogOpen} onOpenChange={setQuickActionOpportunityDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-lato">Create Opportunity</DialogTitle>
            </DialogHeader>
            <Form {...opportunityForm}>
              <form onSubmit={opportunityForm.handleSubmit(handleSubmitOpportunity)} className="space-y-4">
                <FormField
                  control={opportunityForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter opportunity title" {...field} data-testid="input-opportunity-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={opportunityForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value (in cents)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-opportunity-value" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setQuickActionOpportunityDialogOpen(false)} data-testid="button-cancel-opportunity">Cancel</Button>
                  <Button type="submit" disabled={createOpportunityMutation.isPending} data-testid="button-save-opportunity">
                    {createOpportunityMutation.isPending ? "Creating..." : "Create Opportunity"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Quick Action: Add Task Dialog */}
        <Dialog open={quickActionTaskDialogOpen} onOpenChange={setQuickActionTaskDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-lato">Create Task</DialogTitle>
            </DialogHeader>
            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit(handleSubmitTask)} className="space-y-4">
                <FormField
                  control={taskForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} data-testid="input-task-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={taskForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the task" className="min-h-[100px]" {...field} value={field.value || ""} data-testid="textarea-task-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setQuickActionTaskDialogOpen(false)} data-testid="button-cancel-task">Cancel</Button>
                  <Button type="submit" disabled={createTaskMutation.isPending} data-testid="button-save-task">
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Entity Drawer */}
        <EntityDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          entityType={drawerEntityType}
          entityId={drawerEntityId}
          onEdit={() => {
            const person = people.find(p => p.id === drawerEntityId);
            if (person) {
              setDrawerOpen(false);
              handleEdit(person);
            }
          }}
          onDelete={() => {
            setDrawerOpen(false);
            handleDelete(drawerEntityId);
          }}
          onNavigate={handleDrawerNavigate}
          onAddOpportunity={handleQuickAddOpportunity}
          onAddTask={handleQuickAddTask}
        />
    </>
  );
}
