import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2, Sprout, ChevronDown, AlertCircle, CheckCircle, Mail } from "lucide-react";

interface SeedingStatus {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  totalUrls: number;
  processedUrls: number;
  successfulUrls: number;
  failedUrls: number;
  errors: Array<{ url: string; error: string }>;
}

interface InvitationStatus {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  totalInvitations: number;
  successfulInvitations: number;
  failedInvitations: number;
  errors: Array<{ enterpriseId: string; error: string }>;
}

export default function EnterpriseSeeding() {
  const { toast } = useToast();
  const [urls, setUrls] = useState("");
  const [seedingJobId, setSeedingJobId] = useState<string | null>(null);
  const [invitationJobId, setInvitationJobId] = useState<string | null>(null);
  const [isErrorsOpen, setIsErrorsOpen] = useState(false);

  // Start seeding mutation
  const startSeedingMutation = useMutation({
    mutationFn: async (data: { urls?: string[] }): Promise<{ jobId: string }> => {
      const response = await apiRequest("POST", "/api/admin/enterprises/seed", data);
      return response as unknown as { jobId: string };
    },
    onSuccess: (response: { jobId: string }) => {
      setSeedingJobId(response.jobId);
      setUrls("");
      toast({
        title: "Seeding Started",
        description: "Enterprise seeding job has been initiated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start seeding",
        variant: "destructive",
      });
    },
  });

  // Get seeding status query
  const { data: seedingStatus } = useQuery<SeedingStatus>({
    queryKey: ["/api/admin/enterprises/seed", seedingJobId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/enterprises/seed/${seedingJobId}`);
      if (!response.ok) throw new Error("Failed to fetch seeding status");
      return response.json();
    },
    enabled: !!seedingJobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      // Poll every 2 seconds while running
      if (data.status === "running" || data.status === "pending") {
        return 2000;
      }
      return false;
    },
  });

  // Start invitations mutation
  const startInvitationsMutation = useMutation({
    mutationFn: async (): Promise<{ jobId: string }> => {
      const response = await apiRequest("POST", "/api/admin/enterprises/invite-batch", {});
      return response as unknown as { jobId: string };
    },
    onSuccess: (response: { jobId: string }) => {
      setInvitationJobId(response.jobId);
      toast({
        title: "Invitations Started",
        description: "Batch invitation job has been initiated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start invitations",
        variant: "destructive",
      });
    },
  });

  // Get invitation status query
  const { data: invitationStatus } = useQuery<InvitationStatus>({
    queryKey: ["/api/admin/enterprises/invite-batch", invitationJobId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/enterprises/invite-batch/${invitationJobId}`);
      if (!response.ok) throw new Error("Failed to fetch invitation status");
      return response.json();
    },
    enabled: !!invitationJobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      // Poll every 2 seconds while running
      if (data.status === "running" || data.status === "pending") {
        return 2000;
      }
      return false;
    },
  });

  // Clear job IDs when completed or failed
  useEffect(() => {
    if (seedingStatus && (seedingStatus.status === "completed" || seedingStatus.status === "failed")) {
      const timer = setTimeout(() => {
        // Don't clear immediately to allow user to see final status
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [seedingStatus]);

  useEffect(() => {
    if (invitationStatus && (invitationStatus.status === "completed" || invitationStatus.status === "failed")) {
      const timer = setTimeout(() => {
        // Don't clear immediately to allow user to see final status
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [invitationStatus]);

  const handleDiscoverSeed = () => {
    startSeedingMutation.mutate({});
  };

  const handleCustomSeed = () => {
    const urlList = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlList.length === 0) {
      toast({
        title: "No URLs provided",
        description: "Please enter at least one URL",
        variant: "destructive",
      });
      return;
    }

    startSeedingMutation.mutate({ urls: urlList });
  };

  const handleSendInvitations = () => {
    startInvitationsMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "running":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const progressPercentage = seedingStatus
    ? Math.round((seedingStatus.processedUrls / seedingStatus.totalUrls) * 100) || 0
    : 0;

  const invitationProgressPercentage = invitationStatus
    ? Math.round(
        ((invitationStatus.successfulInvitations + invitationStatus.failedInvitations) /
          invitationStatus.totalInvitations) *
          100
      ) || 0
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Sprout className="w-8 h-8 text-primary" />
            Enterprise Seeding
          </h1>
          <p className="text-muted-foreground mt-1">
            Bulk import and manage enterprise data
          </p>
        </div>
      </div>

      {/* Seeding Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Enterprise Seeding</CardTitle>
          <CardDescription>
            Discover and import enterprises from various sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="discover" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="discover">Discover Enterprises</TabsTrigger>
              <TabsTrigger value="custom">Custom URLs</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-4">
              <Alert>
                <AlertDescription>
                  Automatically discover enterprises from regenerative sources
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleDiscoverSeed}
                disabled={startSeedingMutation.isPending || !!seedingJobId}
                data-testid="button-discover-seed"
              >
                {startSeedingMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Sprout className="w-4 h-4 mr-2" />
                    Discover & Seed Enterprises
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="urls" className="text-sm font-medium">
                  Enter URLs (one per line)
                </label>
                <Textarea
                  id="urls"
                  placeholder="https://example.com/enterprise1&#10;https://example.com/enterprise2&#10;https://example.com/enterprise3"
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  data-testid="input-urls"
                />
              </div>
              <Button
                onClick={handleCustomSeed}
                disabled={startSeedingMutation.isPending || !!seedingJobId || !urls.trim()}
                data-testid="button-start-seed"
              >
                {startSeedingMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Sprout className="w-4 h-4 mr-2" />
                    Start Seeding
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Progress Section */}
      {seedingStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Seeding Progress</span>
              <Badge className={getStatusColor(seedingStatus.status)}>
                {seedingStatus.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium" data-testid="text-progress-percentage">
                  {progressPercentage}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total URLs</p>
                <p className="text-2xl font-bold" data-testid="text-total-urls">
                  {seedingStatus.totalUrls}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Processed</p>
                <p className="text-2xl font-bold" data-testid="text-processed-urls">
                  {seedingStatus.processedUrls}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-successful-urls">
                  {seedingStatus.successfulUrls}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-failed-urls">
                  {seedingStatus.failedUrls}
                </p>
              </div>
            </div>

            {/* Error List */}
            {seedingStatus.errors && seedingStatus.errors.length > 0 && (
              <Collapsible open={isErrorsOpen} onOpenChange={setIsErrorsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    data-testid="button-toggle-errors"
                  >
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      View Errors ({seedingStatus.errors.length})
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isErrorsOpen ? "transform rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-2">
                  {seedingStatus.errors.map((error, index) => (
                    <Alert key={index} variant="destructive" data-testid={`error-item-${index}`}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium">{error.url}</div>
                        <div className="text-sm mt-1">{error.error}</div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Status Messages */}
            {seedingStatus.status === "completed" && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Seeding completed successfully! Processed {seedingStatus.successfulUrls} enterprises.
                </AlertDescription>
              </Alert>
            )}

            {seedingStatus.status === "failed" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Seeding job failed. Please check the errors above and try again.
                </AlertDescription>
              </Alert>
            )}

            {(seedingStatus.status === "running" || seedingStatus.status === "pending") && (
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Seeding in progress... This may take a few minutes.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invitation Section */}
      <Card>
        <CardHeader>
          <CardTitle>Enterprise Invitations</CardTitle>
          <CardDescription>
            Send invitations to unclaimed enterprises
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSendInvitations}
            disabled={startInvitationsMutation.isPending || !!invitationJobId}
            data-testid="button-send-invitations"
          >
            {startInvitationsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Invitations to Unclaimed Enterprises
              </>
            )}
          </Button>

          {/* Invitation Progress */}
          {invitationStatus && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Invitation Progress</span>
                <Badge className={getStatusColor(invitationStatus.status)}>
                  {invitationStatus.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium" data-testid="text-invitation-progress">
                    {invitationProgressPercentage}%
                  </span>
                </div>
                <Progress value={invitationProgressPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold" data-testid="text-total-invitations">
                    {invitationStatus.totalInvitations}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-xl font-bold text-green-600" data-testid="text-successful-invitations">
                    {invitationStatus.successfulInvitations}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-xl font-bold text-red-600" data-testid="text-failed-invitations">
                    {invitationStatus.failedInvitations}
                  </p>
                </div>
              </div>

              {invitationStatus.status === "completed" && (
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Invitations sent successfully! {invitationStatus.successfulInvitations} invitations delivered.
                  </AlertDescription>
                </Alert>
              )}

              {invitationStatus.status === "failed" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Invitation job failed. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
