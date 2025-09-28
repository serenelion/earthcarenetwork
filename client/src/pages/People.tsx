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
} from "lucide-react";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import SearchBar from "@/components/SearchBar";
import { insertPersonSchema, type Person, type InsertPerson, type Enterprise } from "@shared/schema";

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

export default function People() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const form = useForm<InsertPerson>({
    resolver: zodResolver(insertPersonSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      enterpriseId: "",
      linkedinUrl: "",
      notes: "",
      invitationStatus: "not_invited",
      claimStatus: "unclaimed",
      buildProStatus: "not_offered",
      supportStatus: "no_inquiry",
    },
  });

  const { data: people = [], isLoading, error: peopleError } = useQuery({
    queryKey: ["/api/crm/people", searchQuery],
    queryFn: async (): Promise<Person[]> => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");

      const response = await fetch(`/api/crm/people?${params}`);
      if (!response.ok) throw new Error("Failed to fetch people");
      return response.json();
    },
    enabled: isAuthenticated,
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

  const createMutation = useMutation({
    mutationFn: async (data: InsertPerson) => {
      return apiRequest("POST", "/api/crm/people", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/stats"] });
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPerson> }) => {
      return apiRequest("PUT", `/api/crm/people/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/people"] });
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
      return apiRequest("DELETE", `/api/crm/people/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/stats"] });
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

  const handleSubmit = (data: InsertPerson) => {
    const processedData = {
      ...data,
      enterpriseId: data.enterpriseId || null,
    };

    if (editingPerson) {
      updateMutation.mutate({ id: editingPerson.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    form.reset({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email || "",
      phone: person.phone || "",
      title: person.title || "",
      enterpriseId: person.enterpriseId || "",
      linkedinUrl: person.linkedinUrl || "",
      notes: person.notes || "",
      invitationStatus: person.invitationStatus,
      claimStatus: person.claimStatus,
      buildProStatus: person.buildProStatus,
      supportStatus: person.supportStatus,
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

  const filteredPeople = statusFilter
    ? people.filter(person => 
        person.invitationStatus === statusFilter ||
        person.claimStatus === statusFilter ||
        person.buildProStatus === statusFilter
      )
    : people;

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
                <Users className="text-primary text-lg" />
                <span className="font-bold text-foreground font-lato">People</span>
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
                <Users className="text-primary text-lg" />
                <span className="text-base font-bold text-foreground font-lato">People</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs px-2"
                  onClick={() => window.open("/", "_blank")}
                  data-testid="button-public-directory"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Public
                </Button>
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {(user as any)?.firstName?.[0] || (user as any)?.email?.[0]?.toUpperCase() || 'A'}
                </div>
              </div>
            </div>
            
            <Button
              onClick={openCreateDialog}
              size="sm"
              className="w-full text-xs"
              data-testid="button-create-person"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Person
            </Button>
          </div>
        </div>

        {/* Desktop Header */}
        <header className="hidden md:block bg-card border-b border-border">
          <div className="px-6 py-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
              <span className="font-medium text-primary">Admin CRM</span>
              <span>/</span>
              <span>People Management</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Users className="text-primary text-xl" />
                  <span className="text-lg font-bold text-foreground font-lato">People CRM</span>
                  <Badge variant="secondary" className="ml-2 text-xs">Admin View</Badge>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("/", "_blank")}
                  data-testid="button-public-directory"
                  className="flex items-center space-x-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View Public Directory</span>
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {(user as any)?.firstName?.[0] || (user as any)?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <span className="text-sm text-foreground">{(user as any)?.firstName || 'Admin User'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-lato">People</h1>
              <p className="text-muted-foreground">Manage contacts and track user journeys</p>
            </div>
            <Button onClick={openCreateDialog} data-testid="button-create-person">
              <Plus className="w-4 h-4 mr-2" />
              Add Person
            </Button>
          </div>
          
          {/* Mobile Title */}
          <div className="md:hidden mb-4">
            <p className="text-sm text-muted-foreground">Manage contacts and track user journeys</p>
          </div>
          
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
                      name="enterpriseId"
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="invitationStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invitation Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-invitation-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {invitationStatuses.map((status) => (
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
                      name="claimStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Claim Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-claim-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {claimStatuses.map((status) => (
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
                      name="buildProStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Build Pro Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-build-pro-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {buildProStatuses.map((status) => (
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
                  </div>

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
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeople.map((person) => {
              const enterprise = enterprises.find(e => e.id === person.enterpriseId);
              const invitationStatus = invitationStatuses.find(s => s.value === person.invitationStatus);
              const claimStatus = claimStatuses.find(s => s.value === person.claimStatus);
              const buildProStatus = buildProStatuses.find(s => s.value === person.buildProStatus);

              return (
                <Card key={person.id} className="hover:shadow-lg transition-shadow" data-testid={`person-card-${person.id}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground font-lato">
                          {person.firstName} {person.lastName}
                        </h3>
                        {person.title && (
                          <p className="text-muted-foreground text-sm">{person.title}</p>
                        )}
                        {enterprise && (
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Building className="w-3 h-3 mr-1" />
                            {enterprise.name}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(person)}
                          data-testid={`button-edit-${person.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(person.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${person.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {person.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="w-3 h-3 mr-2" />
                          <a href={`mailto:${person.email}`} className="hover:text-primary">
                            {person.email}
                          </a>
                        </div>
                      )}
                      {person.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-3 h-3 mr-2" />
                          <a href={`tel:${person.phone}`} className="hover:text-primary">
                            {person.phone}
                          </a>
                        </div>
                      )}
                      {person.linkedinUrl && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <ExternalLink className="w-3 h-3 mr-2" />
                          <a
                            href={person.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary"
                          >
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {invitationStatus && (
                          <Badge className={`text-xs ${invitationStatus.color}`}>
                            {invitationStatus.label}
                          </Badge>
                        )}
                        {claimStatus && (
                          <Badge className={`text-xs ${claimStatus.color}`}>
                            {claimStatus.label}
                          </Badge>
                        )}
                        {buildProStatus && (
                          <Badge className={`text-xs ${buildProStatus.color}`}>
                            {buildProStatus.label}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {person.notes && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {person.notes}
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
