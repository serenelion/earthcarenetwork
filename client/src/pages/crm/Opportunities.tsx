import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { insertOpportunitySchema, type Opportunity, type InsertOpportunity, type Enterprise, type Person } from "@shared/schema";
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
};

const categoryLabels = {
  land_projects: "Land Project",
  capital_sources: "Capital Source",
  open_source_tools: "Open Source Tool", 
  network_organizers: "Network Organizer",
};

export default function Opportunities() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewingOpportunity, setViewingOpportunity] = useState<Opportunity | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [enterprisePopoverOpen, setEnterprisePopoverOpen] = useState(false);
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);

  const form = useForm<InsertOpportunity>({
    resolver: zodResolver(insertOpportunitySchema),
    defaultValues: {
      title: "",
      description: "",
      value: 0,
      status: "lead",
      probability: 0,
      enterpriseId: "",
      primaryContactId: "",
      notes: "",
    },
  });

  const { data: opportunities = [], isLoading, error: opportunitiesError } = useQuery({
    queryKey: ["/api/crm/opportunities", searchQuery],
    queryFn: async (): Promise<Opportunity[]> => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");

      const response = await fetch(`/api/crm/opportunities?${params}`);
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
    enabled: isAuthenticated,
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

  const { data: people = [] } = useQuery({
    queryKey: ["/api/crm/people"],
    queryFn: async (): Promise<Person[]> => {
      const response = await fetch("/api/crm/people?limit=200");
      if (!response.ok) throw new Error("Failed to fetch people");
      return response.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertOpportunity) => {
      return apiRequest("POST", "/api/crm/opportunities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/stats"] });
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertOpportunity> }) => {
      return apiRequest("PUT", `/api/crm/opportunities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/opportunities"] });
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
      return apiRequest("DELETE", `/api/crm/opportunities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/stats"] });
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

      return apiRequest("POST", "/api/crm/ai/lead-score", {
        enterpriseId: opportunity.enterpriseId,
        personId: opportunity.primaryContactId,
        opportunityId: opportunityId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/opportunities"] });
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

  const handleSubmit = (data: InsertOpportunity) => {
    const processedData = {
      ...data,
      value: data.value ? data.value * 100 : 0, // Convert to cents
      enterpriseId: data.enterpriseId || null,
      primaryContactId: data.primaryContactId || null,
      expectedCloseDate: data.expectedCloseDate || null,
    };

    if (editingOpportunity) {
      updateMutation.mutate({ id: editingOpportunity.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const handleEdit = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    form.reset({
      title: opportunity.title,
      description: opportunity.description || "",
      value: opportunity.value ? opportunity.value / 100 : 0, // Convert from cents
      status: opportunity.status,
      probability: opportunity.probability || 0,
      enterpriseId: opportunity.enterpriseId || "",
      primaryContactId: opportunity.primaryContactId || "",
      expectedCloseDate: opportunity.expectedCloseDate || null,
      notes: opportunity.notes || "",
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
          <h1 className="text-3xl font-bold text-foreground font-lato">Opportunities</h1>
          <p className="text-muted-foreground">Track deals and partnership opportunities</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportCSV} 
            disabled={isExporting}
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-create-opportunity">
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
                        <FormLabel>Opportunity Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter opportunity title"
                            {...field}
                            data-testid="input-opportunity-title"
                          />
                        </FormControl>
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
                            placeholder="Describe the opportunity"
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-opportunity-description"
                          />
                        </FormControl>
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
                          <FormLabel>Value ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-opportunity-value"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-opportunity-status">
                                <SelectValue placeholder="Select status" />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="probability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Probability (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-opportunity-probability"
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
                      name="enterpriseId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Enterprise</FormLabel>
                          <Popover open={enterprisePopoverOpen} onOpenChange={setEnterprisePopoverOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={enterprisePopoverOpen}
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  data-testid="select-opportunity-enterprise"
                                >
                                  {field.value
                                    ? enterprises.find((e) => e.id === field.value)?.name
                                    : field.value === null
                                    ? "No Enterprise"
                                    : "Select enterprise..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search enterprises..." />
                                <CommandList>
                                  <CommandEmpty>No enterprise found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="none"
                                      onSelect={() => {
                                        form.setValue("enterpriseId", null);
                                        setEnterprisePopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === null ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      No Enterprise
                                    </CommandItem>
                                    {enterprises.map((enterprise) => (
                                      <CommandItem
                                        key={enterprise.id}
                                        value={enterprise.name}
                                        onSelect={() => {
                                          form.setValue("enterpriseId", enterprise.id);
                                          setEnterprisePopoverOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            enterprise.id === field.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {enterprise.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="primaryContactId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Primary Contact</FormLabel>
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
                                        return person ? `${person.firstName} ${person.lastName}` : "Select contact...";
                                      })()
                                    : field.value === null
                                    ? "No Contact"
                                    : "Select contact..."}
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
                                        form.setValue("primaryContactId", null);
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
                                      const enterprise = enterprises.find(e => e.id === person.enterpriseId);
                                      const displayName = `${person.firstName} ${person.lastName}`;
                                      const searchValue = enterprise 
                                        ? `${displayName} ${enterprise.name}`
                                        : displayName;
                                      
                                      return (
                                        <CommandItem
                                          key={person.id}
                                          value={searchValue}
                                          onSelect={() => {
                                            form.setValue("primaryContactId", person.id);
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
                        <FormLabel>Expected Close Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : String(field.value).split('T')[0]) : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            data-testid="input-opportunity-close-date"
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
                            placeholder="Add notes about this opportunity"
                            className="min-h-[80px]"
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-opportunity-notes"
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

        {/* Opportunities Grid */}
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
        ) : filteredOpportunities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Handshake className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No opportunities found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first opportunity"}
              </p>
              <Button onClick={openCreateDialog} data-testid="button-add-first-opportunity">
                <Plus className="w-4 h-4 mr-2" />
                Add Opportunity
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => {
              const enterprise = enterprises.find(e => e.id === opportunity.enterpriseId);
              const contact = people.find(p => p.id === opportunity.primaryContactId);
              const status = opportunityStatuses.find(s => s.value === opportunity.status);

              return (
                <Card 
                  key={opportunity.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer" 
                  data-testid={`opportunity-card-${opportunity.id}`}
                  onClick={() => {
                    setViewingOpportunity(opportunity);
                    setIsDetailDialogOpen(true);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground font-lato">
                          {opportunity.title}
                        </h3>
                        {status && (
                          <Badge className={`text-xs mt-1 ${status.color}`}>
                            {status.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateLeadScoreMutation.mutate(opportunity.id)}
                          disabled={generateLeadScoreMutation.isPending}
                          data-testid={`button-generate-score-${opportunity.id}`}
                        >
                          <Lightbulb className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(opportunity)}
                          data-testid={`button-edit-${opportunity.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(opportunity.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${opportunity.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {opportunity.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {opportunity.description}
                      </p>
                    )}

                    {/* Enterprise and Contact Badges Section */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {enterprise ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors">
                                  <Building className="w-4 h-4 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">Enterprise</p>
                                    <p className="text-sm font-medium truncate" data-testid={`enterprise-name-${opportunity.id}`}>
                                      {enterprise.name}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">{enterprise.name}</p>
                                {enterprise.category && (
                                  <Badge className={`text-xs ${categoryColors[enterprise.category as keyof typeof categoryColors]}`}>
                                    {categoryLabels[enterprise.category as keyof typeof categoryLabels]}
                                  </Badge>
                                )}
                                {enterprise.location && (
                                  <p className="text-xs flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {enterprise.location}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30">
                            <Building className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">No enterprise linked</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {contact ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors">
                                  <User className="w-4 h-4 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">Contact</p>
                                    <p className="text-sm font-medium truncate" data-testid={`contact-name-${opportunity.id}`}>
                                      {contact.firstName} {contact.lastName}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">{contact.firstName} {contact.lastName}</p>
                                {contact.title && (
                                  <p className="text-xs flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" />
                                    {contact.title}
                                  </p>
                                )}
                                {contact.email && (
                                  <p className="text-xs flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {contact.email}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30">
                            <User className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">No contact assigned</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mb-4">
                      {opportunity.value && opportunity.value > 0 && (
                        <div className="flex items-center text-sm">
                          <DollarSign className="w-4 h-4 mr-2 text-green-600" />
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

                      {opportunity.expectedCloseDate && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-2" />
                          {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {opportunity.aiInsights && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          <strong>AI Insights:</strong> {opportunity.aiInsights}
                        </p>
                      </div>
                    )}

                    {opportunity.notes && !opportunity.aiInsights && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {opportunity.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Opportunity Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {viewingOpportunity && (() => {
              const enterprise = enterprises.find(e => e.id === viewingOpportunity.enterpriseId);
              const contact = people.find(p => p.id === viewingOpportunity.primaryContactId);
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
    </>
  );
}
