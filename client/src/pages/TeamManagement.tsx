import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, UserPlus, Trash2, Shield, AlertCircle, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

// Role badge color mappings
const roleBadgeColors = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  editor: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

const invitationFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["viewer", "editor", "admin"], {
    required_error: "Please select a role",
  }),
});

type InvitationFormData = z.infer<typeof invitationFormSchema>;

interface TeamMember {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  role: "viewer" | "editor" | "admin" | "owner";
  status: string;
  joinDate: string;
  invitedAt: string;
  acceptedAt: string | null;
  inviter: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface Invitation {
  id: string;
  email: string;
  role: "viewer" | "editor" | "admin";
  status: string;
  expiresAt: string;
  createdAt: string;
  inviter: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export default function TeamManagement() {
  const { id: enterpriseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch team members
  const { data: teamData, isLoading: isLoadingTeam } = useQuery<{ members: TeamMember[]; count: number }>({
    queryKey: ["/api/enterprises", enterpriseId, "team"],
    enabled: !!enterpriseId,
  });

  // Fetch enterprise details
  const { data: enterprise } = useQuery<{ id: string; name: string }>({
    queryKey: ["/api/enterprises", enterpriseId],
    enabled: !!enterpriseId,
  });

  // Find current user's role in the team
  const currentUserMember = teamData?.members.find(m => m.userId === user?.id);
  const userRole = currentUserMember?.role;
  const canManageTeam = userRole === "admin" || userRole === "owner";

  // Fetch pending invitations (only for admins/owners)
  const { data: invitationsData, isLoading: isLoadingInvitations } = useQuery<{ invitations: Invitation[]; count: number }>({
    queryKey: ["/api/enterprises", enterpriseId, "team", "invitations"],
    enabled: !!enterpriseId && canManageTeam,
  });

  // Invitation form
  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationFormSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (data: InvitationFormData) => {
      const response = await apiRequest("POST", `/api/enterprises/${enterpriseId}/team/invitations`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The team invitation has been sent successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises", enterpriseId, "team", "invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await apiRequest("DELETE", `/api/enterprises/${enterpriseId}/team/invitations/${invitationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises", enterpriseId, "team", "invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/enterprises/${enterpriseId}/team/${memberId}`, { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "Team member role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises", enterpriseId, "team"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest("DELETE", `/api/enterprises/${enterpriseId}/team/${memberId}`);
    },
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "Team member has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises", enterpriseId, "team"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitInvitation = (data: InvitationFormData) => {
    sendInvitationMutation.mutate(data);
  };

  const handleCancelInvitation = (invitationId: string) => {
    if (confirm("Are you sure you want to cancel this invitation?")) {
      cancelInvitationMutation.mutate(invitationId);
    }
  };

  const handleChangeRole = (memberId: string, newRole: string) => {
    changeRoleMutation.mutate({ memberId, role: newRole });
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm("Are you sure you want to remove this team member?")) {
      removeMemberMutation.mutate(memberId);
    }
  };

  // Count owners to prevent removing the last one
  const ownerCount = teamData?.members.filter(m => m.role === "owner").length || 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>You must be logged in to view this page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingTeam) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!currentUserMember) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are not a member of this enterprise team.
            </AlertDescription>
          </Alert>
          <Button asChild className="mt-4" data-testid="button-back">
            <Link href={`/enterprises/${enterpriseId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Enterprise
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4" data-testid="button-back-to-enterprise">
            <Link href={`/enterprises/${enterpriseId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Enterprise
            </Link>
          </Button>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Team Management</h1>
          {enterprise && (
            <p className="text-muted-foreground mt-2" data-testid="text-enterprise-name">
              {enterprise.name}
            </p>
          )}
        </div>

        {/* Invitation Form - Only for admins/owners */}
        {canManageTeam && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite Team Member
              </CardTitle>
              <CardDescription>
                Send an invitation to add a new member to your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitInvitation)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="colleague@example.com"
                              type="email"
                              data-testid="input-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-role">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer - Can view content</SelectItem>
                              <SelectItem value="editor">Editor - Can edit content</SelectItem>
                              <SelectItem value="admin">Admin - Can manage team</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={sendInvitationMutation.isPending}
                    data-testid="button-send-invitation"
                  >
                    {sendInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Pending Invitations - Only for admins/owners */}
        {canManageTeam && invitationsData && invitationsData.invitations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                Invitations waiting to be accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-testid="list-pending-invitations">
                {invitationsData.invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium" data-testid={`text-invitation-email-${invitation.id}`}>
                          {invitation.email}
                        </span>
                        <Badge className={roleBadgeColors[invitation.role]} data-testid={`badge-invitation-role-${invitation.id}`}>
                          {invitation.role}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {invitation.inviter && (
                          <span className="flex items-center gap-1">
                            Invited by {invitation.inviter.firstName || invitation.inviter.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(invitation.createdAt), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={cancelInvitationMutation.isPending}
                      data-testid={`button-cancel-invitation-${invitation.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Team Members ({teamData?.count || 0})
            </CardTitle>
            <CardDescription>
              People with access to this enterprise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" data-testid="list-team-members">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    {canManageTeam && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamData?.members.map((member) => {
                    const isCurrentUser = member.userId === user.id;
                    const isLastOwner = member.role === "owner" && ownerCount === 1;
                    const canModify = canManageTeam && !isCurrentUser && !isLastOwner;

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium" data-testid={`text-member-name-${member.id}`}>
                              {member.user.firstName && member.user.lastName
                                ? `${member.user.firstName} ${member.user.lastName}`
                                : member.user.email}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground" data-testid={`text-member-email-${member.id}`}>
                              {member.user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleBadgeColors[member.role]} data-testid={`badge-member-role-${member.id}`}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm" data-testid={`text-member-join-date-${member.id}`}>
                            {format(new Date(member.joinDate), "MMM d, yyyy")}
                          </span>
                        </TableCell>
                        {canManageTeam && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canModify && (
                                <>
                                  <Select
                                    value={member.role}
                                    onValueChange={(newRole) => handleChangeRole(member.id, newRole)}
                                    disabled={changeRoleMutation.isPending}
                                  >
                                    <SelectTrigger
                                      className="w-[120px]"
                                      data-testid={`button-change-role-${member.id}`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="viewer">Viewer</SelectItem>
                                      <SelectItem value="editor">Editor</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      {userRole === "owner" && (
                                        <SelectItem value="owner">Owner</SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveMember(member.id)}
                                    disabled={removeMemberMutation.isPending}
                                    data-testid={`button-remove-member-${member.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {!canModify && (isCurrentUser || isLastOwner) && (
                                <span className="text-xs text-muted-foreground">
                                  {isLastOwner ? "Last owner" : ""}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
