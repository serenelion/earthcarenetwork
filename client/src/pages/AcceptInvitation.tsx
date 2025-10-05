import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertCircle, Mail, Building2, Shield } from "lucide-react";

const roleBadgeColors = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  editor: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

interface InvitationDetails {
  id: string;
  email: string;
  role: "viewer" | "editor" | "admin";
  status: string;
  expiresAt: string;
  createdAt: string;
  token: string;
  enterprise: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    location: string | null;
    imageUrl: string | null;
  };
}

export default function AcceptInvitation() {
  const [, params] = useRoute("/team/invitations/accept/:token");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [acceptedInvitation, setAcceptedInvitation] = useState<{
    enterpriseId: string;
    enterpriseName: string;
    role: string;
  } | null>(null);

  const token = params?.token;

  // Fetch user's invitations to find this one
  const { data: invitationsData, isLoading: isLoadingInvitations } = useQuery<{ invitations: InvitationDetails[] }>({
    queryKey: ["/api/team/invitations"],
    enabled: isAuthenticated && !!token,
  });

  // Find the specific invitation by token
  const invitation = invitationsData?.invitations.find(inv => inv.token === token);

  // Accept invitation mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/team/invitations/${token}/accept`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setAcceptedInvitation({
        enterpriseId: data.teamMember.enterpriseId,
        enterpriseName: data.teamMember.enterpriseName,
        role: data.teamMember.role,
      });
      toast({
        title: "Invitation accepted",
        description: "You have successfully joined the team!",
      });
      
      // Redirect to enterprise page after a short delay
      setTimeout(() => {
        setLocation(`/enterprises/${data.teamMember.enterpriseId}`);
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAccept = () => {
    acceptMutation.mutate();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Invalid invitation link.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Team Invitation
            </CardTitle>
            <CardDescription>Please sign in to accept your invitation</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to be signed in to accept this invitation. The invitation link will still be valid after you sign in.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingInvitations) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation is invalid, has expired, or has already been accepted.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if invitation is expired
  const isExpired = new Date(invitation.expiresAt) < new Date();
  if (isExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation has expired. Please contact the enterprise administrator for a new invitation.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If invitation was just accepted
  if (acceptedInvitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Invitation Accepted!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-400">
                You have successfully joined {acceptedInvitation.enterpriseName} as a{" "}
                <strong>{acceptedInvitation.role}</strong>.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center">
              Redirecting you to the enterprise page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Team Invitation
          </CardTitle>
          <CardDescription>You've been invited to join a team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enterprise Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {invitation.enterprise.imageUrl ? (
                <img
                  src={invitation.enterprise.imageUrl}
                  alt={invitation.enterprise.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg" data-testid="text-enterprise-name">
                  {invitation.enterprise.name}
                </h3>
                {invitation.enterprise.location && (
                  <p className="text-sm text-muted-foreground">{invitation.enterprise.location}</p>
                )}
              </div>
            </div>

            {invitation.enterprise.description && (
              <p className="text-sm text-muted-foreground">{invitation.enterprise.description}</p>
            )}
          </div>

          {/* Role Information */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Role being offered:</span>
            </div>
            <Badge
              className={`${roleBadgeColors[invitation.role]} text-base`}
              data-testid="text-role-offered"
            >
              {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {invitation.role === "viewer" && "You will be able to view enterprise content"}
              {invitation.role === "editor" && "You will be able to view and edit enterprise content"}
              {invitation.role === "admin" && "You will be able to manage the enterprise and its team"}
            </p>
          </div>

          {/* Invitation Details */}
          <div className="text-sm text-muted-foreground">
            <p>Invited to: {invitation.email}</p>
            <p>
              Expires: {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Accept Button */}
          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
            data-testid="button-accept-invitation"
          >
            {acceptMutation.isPending ? "Accepting..." : "Accept Invitation"}
          </Button>

          {acceptMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {acceptMutation.error?.message || "Failed to accept invitation"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
