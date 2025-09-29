import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings as SettingsIcon, 
  User, 
  Briefcase, 
  Users, 
  Crown, 
  Globe, 
  CreditCard, 
  Webhook, 
  Puzzle, 
  Database,
  Building,
  Handshake,
  CheckSquare,
  MessageSquare,
  Bot,
  LogOut,
  Rocket,
  Eye,
  Table,
  Hash,
  Calendar,
  Type,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from "lucide-react";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import { isUnauthorizedError } from "@/lib/authUtils";

// Form schemas for editing
const customFieldSchema = z.object({
  name: z.string().min(1, "Field name is required").regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid field name format"),
  type: z.enum(["varchar", "text", "integer", "boolean", "timestamp", "enum"]),
  description: z.string().optional(),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  enumValues: z.array(z.string()).optional(),
});

const editFieldSchema = z.object({
  description: z.string().optional(),
  enumValues: z.array(z.string()).optional(),
});

type CustomField = z.infer<typeof customFieldSchema>;
type EditField = z.infer<typeof editFieldSchema>;

// Settings navigation structure
const settingsNavigation = [
  {
    title: "Profile",
    items: [
      { id: "profile", title: "Profile", icon: User, description: "Manage your personal information" }
    ]
  },
  {
    title: "Experience", 
    items: [
      { id: "experience", title: "Experience", icon: Briefcase, description: "Customize your workspace experience" }
    ]
  },
  {
    title: "Accounts",
    items: [
      { id: "accounts", title: "Accounts", icon: Users, description: "Manage connected accounts" }
    ]
  },
  {
    title: "Workspace",
    items: [
      { id: "general", title: "General", icon: SettingsIcon, description: "General workspace settings" },
      { id: "data-model", title: "Data model", icon: Database, description: "View and manage your data schema" },
      { id: "members", title: "Members", icon: Users, description: "Manage workspace members" },
      { id: "roles", title: "Roles", icon: Crown, description: "Configure user roles and permissions" },
      { id: "domains", title: "Domains", icon: Globe, description: "Manage allowed domains" },
      { id: "billing", title: "Billing", icon: CreditCard, description: "Subscription and billing settings" },
      { id: "apis-webhooks", title: "APIs & Webhooks", icon: Webhook, description: "API keys and webhook configuration" },
      { id: "integrations", title: "Integrations", icon: Puzzle, description: "Third-party integrations" }
    ]
  },
  {
    title: "Other",
    items: [
      { id: "releases", title: "Releases", icon: Rocket, description: "View product releases and updates" },
      { id: "logout", title: "Logout", icon: LogOut, description: "Sign out of your account" }
    ]
  }
];

// Data model entities from schema
const dataModelEntities = [
  {
    id: "enterprises",
    name: "Enterprises", 
    description: "Companies and organizations in your network",
    category: "Core CRM",
    status: "Standard",
    fieldCount: 15,
    recordCount: 0,
    icon: Building,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  },
  {
    id: "people",
    name: "People",
    description: "Contacts and individuals",
    category: "Core CRM", 
    status: "Standard",
    fieldCount: 14,
    recordCount: 0,
    icon: Users,
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
  },
  {
    id: "opportunities",
    name: "Opportunities",
    description: "Sales opportunities and deals",
    category: "Core CRM",
    status: "Standard", 
    fieldCount: 13,
    recordCount: 0,
    icon: Handshake,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
  },
  {
    id: "tasks",
    name: "Tasks",
    description: "Action items and to-dos",
    category: "System",
    status: "Standard",
    fieldCount: 11,
    recordCount: 0,
    icon: CheckSquare,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
  },
  {
    id: "users",
    name: "Users",
    description: "System users and authentication",
    category: "System",
    status: "Standard",
    fieldCount: 7,
    recordCount: 0,
    icon: User,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
  },
  {
    id: "sessions",
    name: "Sessions", 
    description: "User authentication sessions",
    category: "System",
    status: "Standard",
    fieldCount: 3,
    recordCount: 0,
    icon: Globe,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
  },
  {
    id: "conversations",
    name: "Conversations",
    description: "Chat conversations with AI copilot", 
    category: "Intelligence",
    status: "Standard",
    fieldCount: 6,
    recordCount: 0,
    icon: MessageSquare,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
  },
  {
    id: "chatMessages",
    name: "Chat Messages",
    description: "Individual messages within conversations",
    category: "Intelligence", 
    status: "Standard",
    fieldCount: 5,
    recordCount: 0,
    icon: MessageSquare,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
  },
  {
    id: "copilotContext",
    name: "Copilot Context",
    description: "AI copilot configuration and context",
    category: "Intelligence",
    status: "Standard",
    fieldCount: 6,
    recordCount: 0,
    icon: Bot,
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400"
  },
  {
    id: "businessContext",
    name: "Business Context", 
    description: "Business context for AI personalization",
    category: "Intelligence",
    status: "Standard",
    fieldCount: 9,
    recordCount: 0,
    icon: Bot,
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400"
  }
];

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  
  // Extract section from URL path like /settings/data-model
  const currentSection = location.split('/settings/')[1] || 'data-model';
  const [selectedSection, setSelectedSection] = useState(currentSection);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  
  // Editing states
  const [isEditingEntity, setIsEditingEntity] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [enumEditValue, setEnumEditValue] = useState<string>('');

  // Forms for editing
  const addFieldForm = useForm<CustomField>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      name: '',
      type: 'varchar',
      description: '',
      isRequired: false,
      isUnique: false,
      enumValues: [],
    },
  });

  const editFieldForm = useForm<EditField>({
    resolver: zodResolver(editFieldSchema),
    defaultValues: {
      description: '',
      enumValues: [],
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch CRM stats for record counts
  const { data: stats } = useQuery({
    queryKey: ["/api/crm/stats"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch detailed schema information
  const { data: schemaInfo, isLoading: schemaLoading } = useQuery({
    queryKey: ["/api/crm/schema"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Mutation for creating custom fields
  const createCustomFieldMutation = useMutation({
    mutationFn: async (data: { entityName: string; fieldData: CustomField }) => {
      const response = await apiRequest(
        "POST",
        `/api/crm/schema/entities/${data.entityName}/fields`,
        {
          fieldName: data.fieldData.name,
          fieldType: data.fieldData.type,
          description: data.fieldData.description,
          isRequired: data.fieldData.isRequired,
          isUnique: data.fieldData.isUnique,
          enumValues: data.fieldData.enumValues,
        }
      );
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Custom Field Added",
        description: `Field "${variables.fieldData.name}" has been added to ${variables.entityName}`,
      });
      setIsAddingField(false);
      addFieldForm.reset();
      // Invalidate and refetch the schema to show the new field
      queryClient.invalidateQueries({ queryKey: ["/api/crm/schema"] });
    },
    onError: (error) => {
      console.error("Error creating custom field:", error);
      toast({
        title: "Error",
        description: "Failed to create custom field. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update entity record counts from stats
  const entitiesWithCounts = dataModelEntities.map(entity => ({
    ...entity,
    recordCount: stats?.[entity.id]?.total || stats?.[entity.id.slice(0, -1)]?.total || 0
  }));

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1">
          <div className="md:hidden bg-card border-b border-border p-4">
            <div className="flex items-center justify-between">
              <MobileMenuButton />
              <div className="flex items-center space-x-2">
                <SettingsIcon className="text-primary text-lg" />
                <span className="font-bold text-foreground font-lato">Settings</span>
              </div>
              <div className="w-10"></div>
            </div>
          </div>
          
          <div className="p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-6 md:h-8 bg-muted rounded mb-4 w-48 md:w-64"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSection(sectionId);
    setSelectedEntity(null);
    // Update URL without navigation
    window.history.pushState({}, '', `/settings/${sectionId}`);
  };

  // Editing handlers
  const handleAddCustomField = (data: CustomField) => {
    if (!selectedEntity) {
      toast({
        title: "Error", 
        description: "No entity selected",
        variant: "destructive",
      });
      return;
    }

    createCustomFieldMutation.mutate({
      entityName: selectedEntity,
      fieldData: data,
    });
  };

  const handleEditField = (fieldName: string, data: EditField) => {
    // TODO: API call to edit field
    toast({
      title: "Field Updated",
      description: `Field "${fieldName}" has been updated`,
    });
    setEditingField(null);
    editFieldForm.reset();
  };

  const handleAddEnumValue = (fieldName: string, newValue: string) => {
    if (!newValue.trim()) return;
    
    // TODO: API call to add enum value
    toast({
      title: "Enum Value Added",
      description: `Added "${newValue}" to ${fieldName} enum values`,
    });
    setEnumEditValue('');
  };

  const handleRemoveEnumValue = (fieldName: string, value: string) => {
    // TODO: API call to remove enum value
    toast({
      title: "Enum Value Removed",
      description: `Removed "${value}" from ${fieldName} enum values`,
    });
  };

  const startEditingField = (field: any) => {
    setEditingField(field.name);
    editFieldForm.reset({
      description: field.description || '',
      enumValues: field.enumValues || [],
    });
  };

  const renderDataModelSection = () => {
    if (selectedEntity) {
      const entity = entitiesWithCounts.find(e => e.id === selectedEntity);
      const schemaEntity = schemaInfo?.[selectedEntity];
      if (!entity || !schemaEntity) return null;

      const getFieldTypeIcon = (type: string) => {
        if (type === 'varchar') return Type;
        if (type === 'text') return Type;
        if (type === 'integer') return Hash;
        if (type === 'boolean') return CheckSquare;
        if (type === 'timestamp') return Calendar;
        if (type === 'enum') return Hash;
        if (type.includes('[]')) return Table;
        return Type;
      };

      const getFieldTypeColor = (type: string) => {
        if (type === 'varchar') return 'text-blue-600 dark:text-blue-400';
        if (type === 'text') return 'text-blue-600 dark:text-blue-400';
        if (type === 'integer') return 'text-green-600 dark:text-green-400';
        if (type === 'boolean') return 'text-purple-600 dark:text-purple-400';
        if (type === 'timestamp') return 'text-orange-600 dark:text-orange-400';
        if (type === 'enum') return 'text-pink-600 dark:text-pink-400';
        if (type.includes('[]')) return 'text-indigo-600 dark:text-indigo-400';
        return 'text-gray-600 dark:text-gray-400';
      };

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedEntity(null)}
                data-testid="button-back-to-entities"
              >
                ← Back to Data Model
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <entity.icon className="w-6 h-6 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-xl font-lato">{schemaEntity.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{schemaEntity.description}</p>
                  </div>
                </div>
                <Badge className={entity.color}>{schemaEntity.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{schemaEntity.fields.length}</div>
                  <div className="text-sm text-muted-foreground">Fields</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{entity.recordCount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Records</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{schemaEntity.category}</div>
                  <div className="text-sm text-muted-foreground">Category</div>
                </div>
              </div>

              <Separator />

              {/* Fields Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold font-lato">Fields</h3>
                  <Dialog open={isAddingField} onOpenChange={setIsAddingField}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-add-custom-field">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom Field
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Custom Field</DialogTitle>
                        <DialogDescription>
                          Add a new custom field to the {schemaEntity.name} entity.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...addFieldForm}>
                        <form onSubmit={addFieldForm.handleSubmit(handleAddCustomField)} className="space-y-4">
                          <FormField
                            control={addFieldForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Field Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="field_name" {...field} data-testid="input-field-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addFieldForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Field Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-field-type">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="varchar">Text (varchar)</SelectItem>
                                    <SelectItem value="text">Long Text</SelectItem>
                                    <SelectItem value="integer">Number</SelectItem>
                                    <SelectItem value="boolean">Boolean</SelectItem>
                                    <SelectItem value="timestamp">Date/Time</SelectItem>
                                    <SelectItem value="enum">Enum</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addFieldForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Field description" {...field} data-testid="textarea-field-description" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={addFieldForm.control}
                              name="isRequired"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4"
                                      data-testid="checkbox-required"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm">Required</FormLabel>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={addFieldForm.control}
                              name="isUnique"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4"
                                      data-testid="checkbox-unique"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm">Unique</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddingField(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" data-testid="button-save-field">
                              Add Field
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-3">
                  {schemaEntity.fields.map((field: any) => {
                    const TypeIcon = getFieldTypeIcon(field.type);
                    const typeColor = getFieldTypeColor(field.type);
                    
                    return (
                      <div key={field.name} className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <TypeIcon className={`w-4 h-4 ${typeColor}`} />
                              <h4 className="font-medium text-foreground">{field.name}</h4>
                              <div className="flex space-x-2">
                                {field.isPrimary && (
                                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    Primary
                                  </Badge>
                                )}
                                {field.isRequired && (
                                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400">
                                    Required
                                  </Badge>
                                )}
                                {field.isUnique && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                                    Unique
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Type:</span>
                                <span className={`ml-2 font-mono ${typeColor}`}>{field.type}</span>
                              </div>
                              {field.references && (
                                <div>
                                  <span className="text-muted-foreground">References:</span>
                                  <span className="ml-2 font-mono text-purple-600 dark:text-purple-400">{field.references}</span>
                                </div>
                              )}
                            </div>
                            
                            {field.description && (
                              <p className="text-sm text-muted-foreground mt-2">{field.description}</p>
                            )}
                            
                            {field.enumValues && field.enumValues.length > 0 && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-muted-foreground">Enum values:</span>
                                  {field.type === 'enum' && (
                                    <div className="flex items-center space-x-2">
                                      <Input
                                        placeholder="Add enum value"
                                        value={enumEditValue}
                                        onChange={(e) => setEnumEditValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleAddEnumValue(field.name, enumEditValue);
                                          }
                                        }}
                                        className="h-8 w-32 text-xs"
                                        data-testid={`input-enum-${field.name}`}
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddEnumValue(field.name, enumEditValue)}
                                        className="h-8 px-2"
                                        data-testid={`button-add-enum-${field.name}`}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {field.enumValues.map((value: string) => (
                                    <div key={value} className="flex items-center">
                                      <Badge variant="secondary" className="text-xs">
                                        {value.replace(/_/g, ' ')}
                                      </Badge>
                                      {field.type === 'enum' && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleRemoveEnumValue(field.name, value)}
                                          className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                                          data-testid={`button-remove-enum-${field.name}-${value}`}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Field Actions */}
                          <div className="flex flex-col space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditingField(field)}
                              className="h-8"
                              data-testid={`button-edit-field-${field.name}`}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            
                            {!field.isPrimary && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                data-testid={`button-delete-field-${field.name}`}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Edit Field Dialog */}
                        <Dialog open={editingField === field.name} onOpenChange={(open) => !open && setEditingField(null)}>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Field: {field.name}</DialogTitle>
                              <DialogDescription>
                                Modify the field description and properties.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...editFieldForm}>
                              <form onSubmit={editFieldForm.handleSubmit((data) => handleEditField(field.name, data))} className="space-y-4">
                                <FormField
                                  control={editFieldForm.control}
                                  name="description"
                                  render={({ field: formField }) => (
                                    <FormItem>
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Field description" 
                                          {...formField} 
                                          data-testid={`textarea-edit-description-${field.name}`}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <div className="flex justify-end space-x-2">
                                  <Button type="button" variant="outline" onClick={() => setEditingField(null)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" data-testid={`button-save-edit-${field.name}`}>
                                    Save Changes
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Relationships Section */}
              {schemaEntity.relationships && schemaEntity.relationships.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-4 font-lato">Relationships</h3>
                    <div className="space-y-3">
                      {schemaEntity.relationships.map((rel: any, index: number) => (
                        <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center space-x-3 mb-2">
                            <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-foreground">{rel.type}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium text-foreground">{rel.target}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {rel.foreignKey}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{rel.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    // Group entities by category
    const entityGroups = entitiesWithCounts.reduce((groups, entity) => {
      const category = entity.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(entity);
      return groups;
    }, {} as Record<string, typeof entitiesWithCounts>);

    return (
      <div className="space-y-8">
        {Object.entries(entityGroups).map(([category, entities]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-4 text-foreground font-lato">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entities.map((entity) => {
                const Icon = entity.icon;
                return (
                  <Card 
                    key={entity.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow touch-manipulation"
                    onClick={() => setSelectedEntity(entity.id)}
                    data-testid={`entity-card-${entity.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium text-foreground">{entity.name}</h4>
                          </div>
                        </div>
                        <Badge className={entity.color} size="sm">{entity.status}</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {entity.description}
                      </p>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {entity.fieldCount} fields
                        </span>
                        <span className="text-muted-foreground">
                          {entity.recordCount.toLocaleString()} records
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSectionContent = () => {
    switch (selectedSection) {
      case 'data-model':
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 font-lato">Data Model</h1>
              <p className="text-muted-foreground">
                View and manage your database schema, entities, and relationships.
              </p>
            </div>
            {renderDataModelSection()}
          </div>
        );
      
      case 'profile':
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 font-lato">Profile</h1>
              <p className="text-muted-foreground">Manage your personal information and preferences.</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold">
                      {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{user?.firstName || 'User'} {user?.lastName || ''}</h3>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Profile management features will be implemented in the next phase.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 font-lato">
                {settingsNavigation.flatMap(group => group.items).find(item => item.id === selectedSection)?.title || 'Settings'}
              </h1>
              <p className="text-muted-foreground">
                {settingsNavigation.flatMap(group => group.items).find(item => item.id === selectedSection)?.description || 'Settings configuration'}
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  This settings section will be implemented in future updates.
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex">
        {/* Settings Sidebar */}
        <div className="hidden lg:flex w-72 bg-card border-r border-border flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground font-lato">Settings</h2>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-6">
              {settingsNavigation.map((group) => (
                <div key={group.title}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = selectedSection === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSectionSelect(item.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium text-left ${
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                          }`}
                          data-testid={`settings-nav-${item.id}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          {/* Mobile Header */}
          <div className="lg:hidden bg-card border-b border-border">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <MobileMenuButton />
                <div className="flex items-center space-x-2">
                  <SettingsIcon className="text-primary text-lg" />
                  <span className="text-base font-bold text-foreground font-lato">Settings</span>
                </div>
                <div className="w-10"></div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 lg:p-8">
            {renderSectionContent()}
          </div>
        </main>
      </div>
    </div>
  );
}