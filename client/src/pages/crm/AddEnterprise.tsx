import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building,
  Link as LinkIcon,
  Plus,
  MapPin,
  Check,
  ChevronsUpDown,
  Info,
  ArrowLeft,
} from "lucide-react";
import { insertEnterpriseSchema, type Enterprise } from "@shared/schema";

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

const createEnterpriseSchema = insertEnterpriseSchema.omit({ 
  isVerified: true, 
  tags: true, 
  imageUrl: true, 
  followerCount: true, 
  sourceUrl: true 
}).extend({
  addToDirectory: z.boolean().default(true),
});

type CreateEnterpriseForm = z.infer<typeof createEnterpriseSchema>;

export default function AddEnterprise() {
  const params = useParams<{ enterpriseId: string }>();
  const { currentEnterprise } = useWorkspace();
  const enterpriseId = params.enterpriseId || currentEnterprise?.id || '';
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("link");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  const form = useForm<CreateEnterpriseForm>({
    resolver: zodResolver(createEnterpriseSchema),
    defaultValues: {
      name: "",
      category: "land_projects",
      description: "",
      website: "",
      location: "",
      contactEmail: "",
      addToDirectory: true,
    },
  });

  const { data: enterprises = [], isLoading: searchLoading } = useQuery({
    queryKey: ["/api/enterprises", searchQuery],
    queryFn: async (): Promise<Enterprise[]> => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const params = new URLSearchParams();
      params.append("search", searchQuery);
      params.append("limit", "20");

      const response = await fetch(`/api/enterprises?${params}`);
      if (!response.ok) throw new Error("Failed to fetch enterprises");
      return response.json();
    },
    enabled: searchQuery.length >= 2,
    retry: false,
  });

  const linkMutation = useMutation({
    mutationFn: async (directoryEnterpriseId: string) => {
      return apiRequest("POST", `/api/crm/${enterpriseId}/workspace/enterprises`, {
        mode: "link",
        directoryEnterpriseId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises"] });
      toast({
        title: "Success",
        description: "Enterprise linked to your workspace successfully",
      });
      navigate(`/crm/${enterpriseId}/enterprises`);
    },
    onError: (error: Error) => {
      if (error.message.includes('404')) {
        toast({
          title: "Info",
          description: "API endpoint will be available in Phase 3. Mock success response shown.",
        });
        navigate(`/crm/${enterpriseId}/enterprises`);
      } else {
        toast({
          title: "Error",
          description: "Failed to link enterprise. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateEnterpriseForm) => {
      return apiRequest("POST", `/api/crm/${enterpriseId}/workspace/enterprises`, {
        mode: "create",
        ...data,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "stats"] });
      toast({
        title: "Success",
        description: "Enterprise created successfully",
      });
      
      if (variables.addToDirectory) {
        setShowClaimDialog(true);
      } else {
        navigate(`/crm/${enterpriseId}/enterprises`);
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('404')) {
        toast({
          title: "Info",
          description: "API endpoint will be available in Phase 3. Mock success response shown.",
        });
        navigate(`/crm/${enterpriseId}/enterprises`);
      } else {
        toast({
          title: "Error",
          description: "Failed to create enterprise. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleLinkEnterprise = () => {
    if (!selectedEnterprise) {
      toast({
        title: "Error",
        description: "Please select an enterprise to link",
        variant: "destructive",
      });
      return;
    }
    linkMutation.mutate(selectedEnterprise.id);
  };

  const onSubmit = (data: CreateEnterpriseForm) => {
    createMutation.mutate(data);
  };

  const handleBack = () => {
    navigate(`/crm/${enterpriseId}/enterprises`);
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Enterprises
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 font-lato">
          Add Enterprise
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Link an existing enterprise from the directory or create a new one
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6" data-testid="tabs-mode-selector">
          <TabsTrigger value="link" data-testid="tab-link">
            <LinkIcon className="w-4 h-4 mr-2" />
            Link Existing
          </TabsTrigger>
          <TabsTrigger value="create" data-testid="tab-create">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="link" data-testid="content-link-mode">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Link Existing Enterprise
              </CardTitle>
              <CardDescription>
                Link an existing directory enterprise to track in your CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Directory</label>
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={searchOpen}
                      className="w-full justify-between"
                      data-testid="button-search-enterprises"
                    >
                      {selectedEnterprise ? selectedEnterprise.name : "Search for an enterprise..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Type to search enterprises..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        data-testid="input-search-enterprises"
                      />
                      <CommandList>
                        <CommandEmpty>
                          {searchQuery.length < 2 
                            ? "Type at least 2 characters to search" 
                            : searchLoading 
                            ? "Searching..." 
                            : "No enterprises found"}
                        </CommandEmpty>
                        <CommandGroup>
                          {enterprises.map((enterprise) => (
                            <CommandItem
                              key={enterprise.id}
                              value={enterprise.name}
                              onSelect={() => {
                                setSelectedEnterprise(enterprise);
                                setSearchOpen(false);
                              }}
                              data-testid={`item-enterprise-${enterprise.id}`}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedEnterprise?.id === enterprise.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{enterprise.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <Badge className={categoryColors[enterprise.category as keyof typeof categoryColors]}>
                                    {getCategoryLabel(enterprise.category)}
                                  </Badge>
                                  {enterprise.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {enterprise.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedEnterprise && (
                <Card className="border-2 border-primary/20" data-testid="card-preview">
                  <CardHeader>
                    <CardTitle className="text-lg">Preview</CardTitle>
                    <CardDescription>This enterprise will be linked to your workspace</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-lg" data-testid="text-preview-name">
                          {selectedEnterprise.name}
                        </h3>
                        <Badge className={categoryColors[selectedEnterprise.category as keyof typeof categoryColors]}>
                          {getCategoryLabel(selectedEnterprise.category)}
                        </Badge>
                        {selectedEnterprise.description && (
                          <p className="text-sm text-muted-foreground" data-testid="text-preview-description">
                            {selectedEnterprise.description}
                          </p>
                        )}
                        {selectedEnterprise.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span data-testid="text-preview-location">{selectedEnterprise.location}</span>
                          </div>
                        )}
                        {selectedEnterprise.website && (
                          <a 
                            href={selectedEnterprise.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                            data-testid="link-preview-website"
                          >
                            {selectedEnterprise.website}
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Linking an enterprise allows you to track it in your CRM without duplicating data. 
                  Changes to the directory entry will be reflected in your workspace.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  data-testid="button-cancel-link"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleLinkEnterprise}
                  disabled={!selectedEnterprise || linkMutation.isPending}
                  data-testid="button-link-to-workspace"
                >
                  {linkMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Link to Workspace
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" data-testid="content-create-mode">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Enterprise
              </CardTitle>
              <CardDescription>
                Create a new enterprise to track in your CRM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enterprise Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter enterprise name" 
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem 
                                key={cat.value} 
                                value={cat.value}
                                data-testid={`option-category-${cat.value}`}
                              >
                                {cat.label}
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
                            placeholder="Brief description of the enterprise"
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-description"
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
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="contact@example.com" 
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
                    name="addToDirectory"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-add-to-directory"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Add to public directory
                          </FormLabel>
                          <FormDescription>
                            {field.value 
                              ? "This enterprise will be added to the public directory (unclaimed) and tracked in your CRM"
                              : "This enterprise will only be tracked in your CRM workspace (private)"}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                    <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Creating a new enterprise adds it to your workspace for CRM tracking. 
                      If you enable "Add to public directory", it will also appear in the public enterprise directory.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={handleBack}
                      data-testid="button-cancel-create"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-create-enterprise"
                    >
                      {createMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Enterprise
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <AlertDialogContent data-testid="dialog-claim-suggestion">
          <AlertDialogHeader>
            <AlertDialogTitle>Enterprise Added to Directory</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>The enterprise has been added to the public directory and your workspace.</p>
              <p>Consider finding the owner and inviting them to claim their enterprise profile. This allows them to manage their own information and build credibility.</p>
              <p className="text-sm text-muted-foreground">Unclaimed enterprises are visible in the directory but not managed by their owners.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowClaimDialog(false);
                toast({
                  title: "Coming Soon",
                  description: "The invitation feature will be available soon.",
                });
              }}
              data-testid="button-invite-owner"
            >
              Invite Owner
            </Button>
            <AlertDialogAction
              onClick={() => {
                setShowClaimDialog(false);
                navigate(`/crm/${enterpriseId}/enterprises`);
              }}
              data-testid="button-got-it"
            >
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
