import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Users, 
  Mail, 
  Search, 
  Filter, 
  Send, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  Award,
  Gift,
  Star
} from "lucide-react";
import type { Enterprise, Person } from "@shared/schema";

interface EnterpriseWithContacts extends Enterprise {
  contacts: Person[];
}

interface ClaimStats {
  total: number;
  byClaim: Record<string, number>;
  byInvitation: Record<string, number>;
  pendingClaims: number;
}

function getClaimStatusBadge(status: string) {
  switch (status) {
    case 'unclaimed':
      return <Badge variant="secondary" data-testid={`badge-claim-${status}`}><Clock className="w-3 h-3 mr-1" />Unclaimed</Badge>;
    case 'claimed':
      return <Badge variant="default" data-testid={`badge-claim-${status}`}><CheckCircle className="w-3 h-3 mr-1" />Claimed</Badge>;
    case 'verified':
      return <Badge variant="default" className="bg-green-600" data-testid={`badge-claim-${status}`}><Star className="w-3 h-3 mr-1" />Verified</Badge>;
    default:
      return <Badge variant="outline" data-testid={`badge-claim-${status}`}>{status}</Badge>;
  }
}

function getInvitationStatusBadge(status: string) {
  switch (status) {
    case 'not_invited':
      return <Badge variant="outline" data-testid={`badge-invitation-${status}`}>Not Invited</Badge>;
    case 'invited':
      return <Badge variant="secondary" data-testid={`badge-invitation-${status}`}><Mail className="w-3 h-3 mr-1" />Invited</Badge>;
    case 'signed_up':
      return <Badge variant="default" data-testid={`badge-invitation-${status}`}>Signed Up</Badge>;
    case 'active':
      return <Badge variant="default" className="bg-green-600" data-testid={`badge-invitation-${status}`}><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    default:
      return <Badge variant="outline" data-testid={`badge-invitation-${status}`}>{status}</Badge>;
  }
}

export default function AdminEnterpriseClaiming() {
  const [search, setSearch] = useState("");
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>("all");
  const [selectedEnterprise, setSelectedEnterprise] = useState<EnterpriseWithContacts | null>(null);
  const [selectedContact, setSelectedContact] = useState<Person | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch enterprises with claim info
  const { data: enterprises = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/enterprises/claiming', search, claimStatusFilter],
    queryFn: async (): Promise<EnterpriseWithContacts[]> => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (claimStatusFilter !== 'all') params.set('claimStatus', claimStatusFilter);
      const response = await fetch(`/api/admin/enterprises/claiming?${params}`);
      if (!response.ok) throw new Error('Failed to fetch enterprises');
      return response.json();
    },
  });

  // Fetch claim statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/claim-stats'],
    queryFn: async (): Promise<ClaimStats> => {
      const response = await fetch('/api/admin/claim-stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async ({ personId, enterpriseId }: { personId: string; enterpriseId: string }) => {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, enterpriseId })
      });
      if (!response.ok) throw new Error('Failed to send invitation');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "The invitation has been sent successfully with information about free claiming and Spatial Network Build Pro benefits.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/enterprises/claiming'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/claim-stats'] });
      setSelectedContact(null);
      setSelectedEnterprise(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ personId, invitationStatus, claimStatus }: { 
      personId: string; 
      invitationStatus?: string;
      claimStatus?: string;
    }) => {
      const body: any = {};
      if (invitationStatus) body.invitationStatus = invitationStatus;
      if (claimStatus) body.claimStatus = claimStatus;
      
      const response = await fetch(`/api/admin/invitations/${personId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/enterprises/claiming'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/claim-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleSendInvitation = (contact: Person, enterprise: EnterpriseWithContacts) => {
    sendInvitationMutation.mutate({
      personId: contact.id,
      enterpriseId: enterprise.id
    });
  };

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p>Failed to load enterprise claiming data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-admin-enterprise-claiming">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-page-title">Enterprise Claiming Management</h1>
        <p className="text-muted-foreground mt-2" data-testid="text-page-description">
          Invite enterprise owners to claim their businesses with free claiming benefits and exclusive Spatial Network Build Pro discount (11% off).
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-total-enterprises">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enterprises</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-unclaimed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unclaimed</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600" data-testid="stat-unclaimed">
                {stats.byClaim.unclaimed || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-claims">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-pending">
                {stats.pendingClaims}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-claimed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Claimed & Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-claimed">
                {(stats.byClaim.claimed || 0) + (stats.byClaim.verified || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search enterprises by name, location, or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                  data-testid="input-search"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Select value={claimStatusFilter} onValueChange={setClaimStatusFilter}>
                <SelectTrigger data-testid="select-claim-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by claim status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-all">All Status</SelectItem>
                  <SelectItem value="unclaimed" data-testid="option-unclaimed">Unclaimed</SelectItem>
                  <SelectItem value="claimed" data-testid="option-claimed">Claimed</SelectItem>
                  <SelectItem value="verified" data-testid="option-verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p data-testid="text-loading">Loading enterprises...</p>
            </div>
          </div>
        ) : enterprises.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p data-testid="text-no-results">No enterprises found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          enterprises.map((enterprise) => (
            <Card key={enterprise.id} data-testid={`card-enterprise-${enterprise.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2" data-testid={`text-enterprise-name-${enterprise.id}`}>
                      {enterprise.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" data-testid={`badge-category-${enterprise.id}`}>
                        {enterprise.category}
                      </Badge>
                      {enterprise.location && (
                        <Badge variant="outline" data-testid={`badge-location-${enterprise.id}`}>
                          {enterprise.location}
                        </Badge>
                      )}
                    </div>
                    {enterprise.description && (
                      <CardDescription data-testid={`text-description-${enterprise.id}`}>
                        {enterprise.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="whitespace-nowrap" data-testid={`badge-contact-count-${enterprise.id}`}>
                      <Users className="w-3 h-3 mr-1" />
                      {enterprise.contacts.length} contacts
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {enterprise.contacts.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Contacts & Claiming Status
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contact</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Invitation Status</TableHead>
                          <TableHead>Claim Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enterprise.contacts.map((contact) => (
                          <TableRow key={contact.id} data-testid={`row-contact-${contact.id}`}>
                            <TableCell data-testid={`text-contact-name-${contact.id}`}>
                              {contact.firstName} {contact.lastName}
                            </TableCell>
                            <TableCell data-testid={`text-contact-email-${contact.id}`}>
                              {contact.email || 'N/A'}
                            </TableCell>
                            <TableCell data-testid={`text-contact-title-${contact.id}`}>
                              {contact.title || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {getInvitationStatusBadge(contact.invitationStatus || 'not_invited')}
                            </TableCell>
                            <TableCell>
                              {getClaimStatusBadge(contact.claimStatus || 'unclaimed')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {contact.invitationStatus === 'not_invited' && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        onClick={() => {
                                          setSelectedContact(contact);
                                          setSelectedEnterprise(enterprise);
                                        }}
                                        data-testid={`button-invite-${contact.id}`}
                                      >
                                        <Send className="w-3 h-3 mr-1" />
                                        Invite
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                      <DialogHeader>
                                        <DialogTitle>Send Enterprise Claiming Invitation</DialogTitle>
                                        <DialogDescription>
                                          Send an invitation to {contact.firstName} {contact.lastName} to claim {enterprise.name}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center mb-2">
                                            <Gift className="w-4 h-4 mr-2" />
                                            Benefits Included in Invitation:
                                          </h4>
                                          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                            <li>• Free enterprise profile claiming</li>
                                            <li>• Full access to Earth Care Network directory</li>
                                            <li>• 11% discount on Spatial Network Build Pro</li>
                                            <li>• Priority support for verified businesses</li>
                                          </ul>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                          <Button 
                                            variant="outline" 
                                            onClick={() => {
                                              setSelectedContact(null);
                                              setSelectedEnterprise(null);
                                            }}
                                            data-testid="button-cancel-invite"
                                          >
                                            Cancel
                                          </Button>
                                          <Button 
                                            onClick={() => handleSendInvitation(contact, enterprise)}
                                            disabled={sendInvitationMutation.isPending}
                                            data-testid="button-confirm-invite"
                                          >
                                            {sendInvitationMutation.isPending ? (
                                              <>Loading...</>
                                            ) : (
                                              <>
                                                <Send className="w-3 h-3 mr-1" />
                                                Send Invitation
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                                
                                {contact.invitationStatus === 'invited' && contact.claimStatus === 'unclaimed' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => updateStatusMutation.mutate({
                                      personId: contact.id,
                                      claimStatus: 'claimed'
                                    })}
                                    disabled={updateStatusMutation.isPending}
                                    data-testid={`button-mark-claimed-${contact.id}`}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Mark Claimed
                                  </Button>
                                )}

                                {contact.claimStatus === 'claimed' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => updateStatusMutation.mutate({
                                      personId: contact.id,
                                      claimStatus: 'verified'
                                    })}
                                    disabled={updateStatusMutation.isPending}
                                    data-testid={`button-mark-verified-${contact.id}`}
                                  >
                                    <Award className="w-3 h-3 mr-1" />
                                    Mark Verified
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p data-testid={`text-no-contacts-${enterprise.id}`}>No contacts available for this enterprise.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}