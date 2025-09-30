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
} from "lucide-react";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
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

export default function Opportunities() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  if (authLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-64"></div>
            <div className="h-32 bg-muted rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6">
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
                        <FormItem>
                          <FormLabel>Enterprise</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === "none" ? null : value)} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-opportunity-enterprise">
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

                    <FormField
                      control={form.control}
                      name="primaryContactId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Contact</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === "none" ? null : value)} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-opportunity-contact">
                                <SelectValue placeholder="Select contact" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Contact</SelectItem>
                              {people.map((person) => (
                                <SelectItem key={person.id} value={person.id}>
                                  {person.firstName} {person.lastName}
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
                <Card key={opportunity.id} className="hover:shadow-lg transition-shadow" data-testid={`opportunity-card-${opportunity.id}`}>
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
                      <div className="flex gap-1">
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

                      {enterprise && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Building className="w-3 h-3 mr-2" />
                          {enterprise.name}
                        </div>
                      )}

                      {contact && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="w-3 h-3 mr-2" />
                          {contact.firstName} {contact.lastName}
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
      </main>
    </div>
  );
}
