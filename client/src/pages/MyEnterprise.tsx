import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Building2,
  Users,
  Sprout,
  Save,
  Shield,
  Info,
  Home,
  ExternalLink,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Enterprise, EarthCarePledge } from "@shared/schema";

const CATEGORIES = [
  { value: "land_projects", label: "Land Projects" },
  { value: "capital_sources", label: "Capital Sources" },
  { value: "open_source_tools", label: "Open Source Tools" },
  { value: "network_organizers", label: "Network Organizers" },
] as const;

const categoryColors = {
  land_projects: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  capital_sources: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  open_source_tools: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  network_organizers: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
};

type TeamMemberRole = 'viewer' | 'editor' | 'admin' | 'owner';

interface EnterpriseMembership {
  enterprise: Enterprise;
  role: TeamMemberRole;
  joinedAt: string;
}

const roleHierarchy: Record<TeamMemberRole, number> = {
  'viewer': 1,
  'editor': 2,
  'admin': 3,
  'owner': 4
};

const roleDescriptions: Record<TeamMemberRole, string> = {
  'viewer': 'Can view enterprise information',
  'editor': 'Can edit description, contact email, and tags',
  'admin': 'Can edit all fields and manage team members',
  'owner': 'Full control over enterprise and team'
};

const editorSchema = z.object({
  description: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  tags: z.string().optional(),
});

const adminSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  category: z.enum(["land_projects", "capital_sources", "open_source_tools", "network_organizers"]).optional(),
  location: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  tags: z.string().optional(),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export default function MyEnterprise() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string | null>(() => {
    return localStorage.getItem('selectedMyEnterpriseId');
  });

  const { data: memberships, isLoading: isLoadingMemberships } = useQuery<EnterpriseMembership[]>({
    queryKey: ['/api/my-enterprises'],
    enabled: isAuthenticated,
  });

  const currentMembership = memberships?.find(m => m.enterprise.id === selectedEnterpriseId);
  const userRole = currentMembership?.role || 'viewer';

  useEffect(() => {
    if (memberships && memberships.length > 0 && !selectedEnterpriseId) {
      const firstEnterprise = memberships[0].enterprise.id;
      setSelectedEnterpriseId(firstEnterprise);
      localStorage.setItem('selectedMyEnterpriseId', firstEnterprise);
    }
  }, [memberships, selectedEnterpriseId]);

  const { data: enterprise, isLoading: isLoadingEnterprise } = useQuery<Enterprise>({
    queryKey: ['/api/enterprises', selectedEnterpriseId],
    enabled: !!selectedEnterpriseId,
  });

  const { data: pledgeData } = useQuery<{ pledge: EarthCarePledge } | null>({
    queryKey: ['/api/enterprises', selectedEnterpriseId, 'pledge'],
    enabled: !!selectedEnterpriseId,
    retry: false,
  });

  const { data: teamData } = useQuery<{ members: Array<{ userId: string; role: string }> }>({
    queryKey: ['/api/enterprises', selectedEnterpriseId, 'team'],
    enabled: !!selectedEnterpriseId,
    retry: false,
  });

  const isViewer = userRole === 'viewer';
  const isEditor = userRole === 'editor';
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';

  const formSchema = isAdminOrOwner ? adminSchema : editorSchema;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: undefined,
      location: "",
      website: "",
      contactEmail: "",
      tags: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (enterprise) {
      form.reset({
        name: enterprise.name || "",
        description: enterprise.description || "",
        category: enterprise.category as any,
        location: enterprise.location || "",
        website: enterprise.website || "",
        contactEmail: enterprise.contactEmail || "",
        tags: enterprise.tags?.join(", ") || "",
        imageUrl: enterprise.imageUrl || "",
      });
    }
  }, [enterprise, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : undefined,
      };
      
      Object.keys(payload).forEach(key => {
        if (payload[key] === "") {
          payload[key] = null;
        }
      });

      const response = await apiRequest('PATCH', `/api/enterprises/${selectedEnterpriseId}/my`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprises', selectedEnterpriseId] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-enterprises'] });
      toast({
        title: "Success",
        description: "Enterprise profile updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update enterprise profile",
        variant: "destructive",
      });
    },
  });

  const handleEnterpriseChange = (enterpriseId: string) => {
    setSelectedEnterpriseId(enterpriseId);
    localStorage.setItem('selectedMyEnterpriseId', enterpriseId);
  };

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoadingMemberships) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!memberships || memberships.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">
                    <Home className="h-4 w-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>My Enterprise</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Card data-testid="card-no-memberships">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                My Enterprise
              </CardTitle>
              <CardDescription>
                Manage your enterprise profile and team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-no-memberships">
                  You're not currently a member of any enterprise
                </h3>
                <p className="text-muted-foreground mb-6">
                  Join a team or create your own enterprise to get started!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild data-testid="button-explore-directory">
                    <Link href="/enterprises">
                      Explore Directory
                    </Link>
                  </Button>
                  <Button variant="outline" asChild data-testid="button-view-invitations">
                    <Link href="/settings">
                      View Invitations
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const pledge = pledgeData?.pledge;
  const isAffirmed = pledge?.status === 'affirmed';
  const teamMemberCount = teamData?.members?.length || 0;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>My Enterprise</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {memberships.length > 1 && (
          <Card data-testid="card-enterprise-selector">
            <CardHeader>
              <CardTitle className="text-lg">Select Enterprise</CardTitle>
              <CardDescription>
                You are a member of multiple enterprises. Choose one to manage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedEnterpriseId || undefined} onValueChange={handleEnterpriseChange}>
                <SelectTrigger data-testid="select-enterprise">
                  <SelectValue placeholder="Select an enterprise" />
                </SelectTrigger>
                <SelectContent>
                  {memberships.map((membership) => (
                    <SelectItem 
                      key={membership.enterprise.id} 
                      value={membership.enterprise.id}
                      data-testid={`select-item-enterprise-${membership.enterprise.id}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{membership.enterprise.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {membership.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {isLoadingEnterprise ? (
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        ) : enterprise ? (
          <>
            <Card data-testid="card-overview-section">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Enterprise Profile
                    </CardTitle>
                    <CardDescription>
                      Manage your enterprise information and settings
                    </CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant={userRole === 'owner' ? 'default' : userRole === 'admin' ? 'default' : 'secondary'}
                          data-testid="badge-user-role"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {userRole}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{roleDescriptions[userRole]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                {isViewer && (
                  <div className="bg-muted/50 border border-muted rounded-lg p-4 mb-6 flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">View-only Access</p>
                      <p className="text-sm text-muted-foreground">
                        You have viewer permissions. Contact an admin or owner to make changes.
                      </p>
                    </div>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {isAdminOrOwner && (
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>
                                Enterprise Name
                                <Badge variant="outline" className="ml-2 text-xs">Admin/Owner</Badge>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Enter enterprise name"
                                  disabled={isViewer}
                                  data-testid="input-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Describe your enterprise"
                                className="min-h-24"
                                disabled={isViewer}
                                data-testid="textarea-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isAdminOrOwner && (
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Category
                                <Badge variant="outline" className="ml-2 text-xs">Admin/Owner</Badge>
                              </FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                                disabled={isViewer}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-category">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {isAdminOrOwner && (
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Location
                                <Badge variant="outline" className="ml-2 text-xs">Admin/Owner</Badge>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="City, Country"
                                  disabled={isViewer}
                                  data-testid="input-location"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {isAdminOrOwner && (
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Website
                                <Badge variant="outline" className="ml-2 text-xs">Admin/Owner</Badge>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="url"
                                  placeholder="https://example.com"
                                  disabled={isViewer}
                                  data-testid="input-website"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email"
                                placeholder="contact@example.com"
                                disabled={isViewer}
                                data-testid="input-contact-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem className={isAdminOrOwner ? "" : "md:col-span-2"}>
                            <FormLabel>
                              Tags
                              {!isViewer && <Badge variant="outline" className="ml-2 text-xs">Editor+</Badge>}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="sustainability, organic, local"
                                disabled={isViewer}
                                data-testid="input-tags"
                              />
                            </FormControl>
                            <FormDescription>
                              Comma-separated tags
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isAdminOrOwner && (
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>
                                Image URL
                                <Badge variant="outline" className="ml-2 text-xs">Admin/Owner</Badge>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="url"
                                  placeholder="https://example.com/image.jpg"
                                  disabled={isViewer}
                                  data-testid="input-image-url"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {!isViewer && (
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateMutation.isPending}
                          data-testid="button-save-changes"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card data-testid="card-impact-section">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5" />
                    Impact & Pledge
                  </CardTitle>
                  <CardDescription>
                    Earth Care commitment and impact metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAffirmed && pledge ? (
                    <>
                      <div>
                        <Badge className="bg-green-600 hover:bg-green-700 text-white mb-2">
                          <Sprout className="h-3 w-3 mr-1" />
                          Earth Care Enterprise
                        </Badge>
                        <p className="text-sm text-muted-foreground" data-testid="text-pledge-status">
                          Pledged on {new Date(pledge.signedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="border-l-4 border-primary pl-4 py-2">
                          <p className="text-sm font-medium text-foreground italic">
                            "I commit 100% to valuing earth care, people care, and fair share for the good of the next 7 generations."
                          </p>
                        </div>
                      </div>

                      {pledge.narrative && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">How we demonstrate these values:</h4>
                          <p className="text-sm text-muted-foreground italic">
                            "{pledge.narrative}"
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Sprout className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">
                        No Earth Care pledge yet
                      </p>
                      {isAdminOrOwner && (
                        <Button variant="outline" size="sm" asChild data-testid="button-make-pledge">
                          <Link href={`/enterprises/${enterprise.id}`}>
                            Make a Pledge
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-team-section">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Management
                  </CardTitle>
                  <CardDescription>
                    Manage your enterprise team members
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="text-sm font-medium">Team Members</p>
                      <p className="text-sm text-muted-foreground">
                        Active members in your enterprise
                      </p>
                    </div>
                    <div className="text-2xl font-bold" data-testid="text-team-count">
                      {teamMemberCount}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="text-sm font-medium">Your Role</p>
                      <p className="text-sm text-muted-foreground">
                        {roleDescriptions[userRole]}
                      </p>
                    </div>
                    <Badge variant={userRole === 'owner' ? 'default' : 'secondary'} data-testid="badge-team-role">
                      {userRole}
                    </Badge>
                  </div>

                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      asChild 
                      data-testid="button-manage-team"
                    >
                      <Link href={`/enterprises/${enterprise.id}/team`}>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Team
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
