import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useIntegrations,
  useCreateIntegration,
  useUpdateIntegration,
  useDeleteIntegration,
  useTestIntegration,
  useIntegrationHealth,
  type IntegrationConfig,
} from "@/lib/admin-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Puzzle,
  Plus,
  Pencil,
  Trash2,
  TestTube,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INTEGRATION_PROVIDERS = [
  { value: "apollo", label: "Apollo.io" },
  { value: "google_maps", label: "Google Maps" },
  { value: "foursquare", label: "Foursquare" },
  { value: "pipedrive", label: "Pipedrive CRM" },
  { value: "twenty_crm", label: "Twenty CRM" },
  { value: "custom", label: "Custom API" },
];

function IntegrationHealthBadge({ integrationId }: { integrationId: string }) {
  const { data: health, isLoading } = useIntegrationHealth(integrationId, true);

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (!health) {
    return (
      <Badge variant="secondary" className="gap-1" data-testid={`health-unknown-${integrationId}`}>
        <AlertCircle className="h-3 w-3" />
        Unknown
      </Badge>
    );
  }

  if (health.healthy) {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
        data-testid={`health-healthy-${integrationId}`}
      >
        <CheckCircle2 className="h-3 w-3" />
        Healthy
        {health.responseTime && <span className="text-xs">({health.responseTime}ms)</span>}
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      data-testid={`health-unhealthy-${integrationId}`}
    >
      <XCircle className="h-3 w-3" />
      Unhealthy
    </Badge>
  );
}

export default function Integrations() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<IntegrationConfig | null>(null);
  const [deleteIntegrationId, setDeleteIntegrationId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [formData, setFormData] = useState<Partial<IntegrationConfig>>({
    name: "",
    displayName: "",
    provider: "",
    apiKey: "",
    apiSecret: "",
    isActive: true,
    status: "active",
    config: {},
  });

  const { data: integrations, isLoading } = useIntegrations();
  const createMutation = useCreateIntegration();
  const updateMutation = useUpdateIntegration();
  const deleteMutation = useDeleteIntegration();
  const testMutation = useTestIntegration();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      toast({
        title: "Success",
        description: "Integration created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create integration",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingIntegration) return;
    try {
      await updateMutation.mutateAsync({
        id: editingIntegration.id,
        data: formData,
      });
      toast({
        title: "Success",
        description: "Integration updated successfully",
      });
      setEditingIntegration(null);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update integration",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Success",
        description: "Integration deleted successfully",
      });
      setDeleteIntegrationId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete integration",
        variant: "destructive",
      });
    }
  };

  const handleTest = async (id: string, name: string) => {
    try {
      const result: any = await testMutation.mutateAsync(id);
      if (result.success) {
        toast({
          title: "Test Successful",
          description: result.message || `${name} connection is working`,
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.message || "Connection test failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Test Error",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      displayName: "",
      provider: "",
      apiKey: "",
      apiSecret: "",
      isActive: true,
      status: "active",
      config: {},
    });
    setShowApiKey(false);
    setShowApiSecret(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (integration: IntegrationConfig) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      displayName: integration.displayName,
      provider: integration.provider,
      apiKey: "",
      apiSecret: "",
      isActive: integration.isActive,
      status: integration.status,
      config: integration.config || {},
    });
    setShowApiKey(false);
    setShowApiSecret(false);
  };

  const maskApiKey = (key?: string): string => {
    if (!key || key.length < 8) return "••••••••";
    return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "";
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="integrations-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Puzzle className="h-8 w-8" />
            Integrations Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure and manage platform integrations
          </p>
        </div>

        <Button onClick={openCreateDialog} data-testid="button-create-integration">
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : integrations && integrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Puzzle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No integrations configured yet
            </p>
            <Button onClick={openCreateDialog} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Integration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations?.map((integration) => (
            <Card key={integration.id} data-testid={`integration-card-${integration.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {integration.displayName || integration.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {integration.provider}
                    </CardDescription>
                  </div>
                  <IntegrationHealthBadge integrationId={integration.id} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={getStatusColor(integration.status)}>
                    {integration.status}
                  </Badge>
                  {integration.isActive ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </Badge>
                  )}
                </div>

                {integration.apiKey && (
                  <div className="text-xs text-muted-foreground">
                    API Key: {maskApiKey(integration.apiKey)}
                  </div>
                )}

                {integration.lastSyncAt && (
                  <div className="text-xs text-muted-foreground">
                    Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(integration.id, integration.displayName)}
                    disabled={testMutation.isPending}
                    data-testid={`button-test-${integration.id}`}
                  >
                    <TestTube className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(integration)}
                    data-testid={`button-edit-${integration.id}`}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteIntegrationId(integration.id)}
                    data-testid={`button-delete-${integration.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={isCreateDialogOpen || !!editingIntegration}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingIntegration(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? "Edit Integration" : "Create Integration"}
            </DialogTitle>
            <DialogDescription>
              Configure your integration settings and API credentials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Integration Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., apollo_production"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g., Apollo.io Production"
                data-testid="input-display-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
              >
                <SelectTrigger id="provider" data-testid="select-provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {INTEGRATION_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">
                API Key {editingIntegration ? "(leave blank to keep current)" : "*"}
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder={editingIntegration ? "••••••••" : "Enter API key"}
                  data-testid="input-api-key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                  data-testid="button-toggle-api-key"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret (Optional)</Label>
              <div className="relative">
                <Input
                  id="apiSecret"
                  type={showApiSecret ? "text" : "password"}
                  value={formData.apiSecret}
                  onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                  placeholder={editingIntegration ? "••••••••" : "Enter API secret"}
                  data-testid="input-api-secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                  data-testid="button-toggle-api-secret"
                >
                  {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Enable Integration</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-is-active"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingIntegration(null);
                resetForm();
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={editingIntegration ? handleUpdate : handleCreate}
              disabled={
                !formData.name ||
                !formData.displayName ||
                !formData.provider ||
                (!editingIntegration && !formData.apiKey) ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              data-testid="button-save"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingIntegration
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteIntegrationId}
        onOpenChange={() => setDeleteIntegrationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this integration? This action cannot be undone and
              may affect features that depend on this integration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteIntegrationId && handleDelete(deleteIntegrationId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
