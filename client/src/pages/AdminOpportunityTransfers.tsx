import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowRightLeft, Users, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  description?: string;
  value?: number;
  status: string;
  probability?: number;
  enterpriseId?: string;
  primaryContactId?: string;
  expectedCloseDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
}

interface OpportunityTransfer {
  id: string;
  opportunityId: string;
  transferredBy: string;
  transferredTo: string;
  previousOwnerId?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  reason?: string;
  notes?: string;
  transferredAt: string;
  respondedAt?: string;
  completedAt?: string;
  opportunity: Opportunity;
  transferredByUser: User;
  transferredToUser: User;
}

export default function AdminOpportunityTransfers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [bulkTransferDialogOpen, setBulkTransferDialogOpen] = useState(false);
  const [selectedTransferTo, setSelectedTransferTo] = useState<string>("");
  const [transferReason, setTransferReason] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  // Fetch opportunities
  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery({
    queryKey: ['/api/crm/opportunities', searchTerm],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/crm/opportunities?search=${searchTerm}`);
      return await response.json();
    },
  });

  // Fetch opportunity transfers
  const { data: transfers = [], isLoading: transfersLoading } = useQuery({
    queryKey: ['/api/admin/opportunity-transfers', statusFilter],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/opportunity-transfers${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
      return await response.json();
    },
  });

  // Fetch transfer stats
  const { data: transferStats } = useQuery({
    queryKey: ['/api/admin/transfer-stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/transfer-stats');
      return await response.json();
    },
  });

  // Fetch enterprise owners for transfer
  const { data: enterpriseOwners = [] } = useQuery({
    queryKey: ['/api/crm/users', 'enterprise_owner'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/crm/users?role=enterprise_owner');
      return await response.json();
    },
  });

  // Create transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      const response = await apiRequest('POST', '/api/admin/opportunity-transfers', transferData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/opportunity-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transfer-stats'] });
      toast({ title: "Success", description: "Opportunity transferred successfully" });
      setTransferDialogOpen(false);
      setBulkTransferDialogOpen(false);
      setSelectedOpportunities([]);
      resetTransferForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to transfer opportunity",
        variant: "destructive" 
      });
    },
  });

  // Bulk transfer mutation
  const bulkTransferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      const promises = selectedOpportunities.map(opportunityId =>
        apiRequest('POST', '/api/admin/opportunity-transfers', { ...transferData, opportunityId })
      );
      const responses = await Promise.all(promises);
      return Promise.all(responses.map(res => res.json()));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/opportunity-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transfer-stats'] });
      toast({ 
        title: "Success", 
        description: `${selectedOpportunities.length} opportunities transferred successfully` 
      });
      setBulkTransferDialogOpen(false);
      setSelectedOpportunities([]);
      resetTransferForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to transfer opportunities",
        variant: "destructive" 
      });
    },
  });

  const resetTransferForm = () => {
    setSelectedTransferTo("");
    setTransferReason("");
    setTransferNotes("");
  };

  const handleSingleTransfer = (opportunityId: string) => {
    if (!selectedTransferTo) {
      toast({ title: "Error", description: "Please select an enterprise owner", variant: "destructive" });
      return;
    }

    createTransferMutation.mutate({
      opportunityId,
      transferredTo: selectedTransferTo,
      reason: transferReason,
      notes: transferNotes,
    });
  };

  const handleBulkTransfer = () => {
    if (selectedOpportunities.length === 0) {
      toast({ title: "Error", description: "Please select opportunities to transfer", variant: "destructive" });
      return;
    }

    if (!selectedTransferTo) {
      toast({ title: "Error", description: "Please select an enterprise owner", variant: "destructive" });
      return;
    }

    bulkTransferMutation.mutate({
      transferredTo: selectedTransferTo,
      reason: transferReason,
      notes: transferNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "warning",
      accepted: "success", 
      declined: "destructive",
      completed: "secondary"
    };
    
    const icons: Record<string, any> = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      accepted: <CheckCircle className="w-3 h-3 mr-1" />,
      declined: <XCircle className="w-3 h-3 mr-1" />,
      completed: <CheckCircle className="w-3 h-3 mr-1" />
    };

    return (
      <Badge variant={variants[status] || "default"} className="flex items-center">
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (cents?: number) => {
    if (!cents) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-6" data-testid="admin-opportunity-transfers">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
            Opportunity Transfers
          </h1>
          <p className="text-muted-foreground">
            Manage and track opportunity transfers to enterprise owners
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card data-testid="stats-total-transfers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferStats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="stats-pending-transfers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferStats?.pendingTransfers || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="stats-accepted-transfers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferStats?.byStatus?.accepted || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="stats-completed-transfers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferStats?.byStatus?.completed || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList>
          <TabsTrigger value="opportunities" data-testid="tab-opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="transfers" data-testid="tab-transfers">Transfer History</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Available Opportunities</CardTitle>
                  <CardDescription>Select opportunities to transfer to enterprise owners</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedOpportunities.length > 0 && (
                    <Dialog open={bulkTransferDialogOpen} onOpenChange={setBulkTransferDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="default" data-testid="button-bulk-transfer">
                          Transfer Selected ({selectedOpportunities.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Transfer Opportunities</DialogTitle>
                          <DialogDescription>
                            Transfer {selectedOpportunities.length} opportunities to an enterprise owner
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="bulk-transfer-to">Enterprise Owner</Label>
                            <Select value={selectedTransferTo} onValueChange={setSelectedTransferTo}>
                              <SelectTrigger data-testid="select-bulk-transfer-to">
                                <SelectValue placeholder="Select enterprise owner" />
                              </SelectTrigger>
                              <SelectContent>
                                {enterpriseOwners.map((owner: User) => (
                                  <SelectItem key={owner.id} value={owner.id}>
                                    {owner.firstName} {owner.lastName} ({owner.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="bulk-reason">Transfer Reason</Label>
                            <Input
                              id="bulk-reason"
                              value={transferReason}
                              onChange={(e) => setTransferReason(e.target.value)}
                              placeholder="Reason for transfer"
                              data-testid="input-bulk-reason"
                            />
                          </div>
                          <div>
                            <Label htmlFor="bulk-notes">Additional Notes</Label>
                            <Textarea
                              id="bulk-notes"
                              value={transferNotes}
                              onChange={(e) => setTransferNotes(e.target.value)}
                              placeholder="Additional notes or instructions"
                              data-testid="textarea-bulk-notes"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setBulkTransferDialogOpen(false)}
                            data-testid="button-cancel-bulk-transfer"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleBulkTransfer}
                            disabled={bulkTransferMutation.isPending}
                            data-testid="button-confirm-bulk-transfer"
                          >
                            {bulkTransferMutation.isPending ? "Transferring..." : "Transfer Opportunities"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search opportunities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                    data-testid="input-search-opportunities"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {opportunitiesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading opportunities...</div>
                ) : opportunities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No opportunities found</div>
                ) : (
                  opportunities.map((opportunity: Opportunity) => (
                    <div
                      key={opportunity.id}
                      className={`flex items-center space-x-4 p-4 border rounded-lg ${
                        selectedOpportunities.includes(opportunity.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                      data-testid={`opportunity-${opportunity.id}`}
                    >
                      <Checkbox
                        checked={selectedOpportunities.includes(opportunity.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOpportunities([...selectedOpportunities, opportunity.id]);
                          } else {
                            setSelectedOpportunities(
                              selectedOpportunities.filter(id => id !== opportunity.id)
                            );
                          }
                        }}
                        data-testid={`checkbox-opportunity-${opportunity.id}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium" data-testid={`opportunity-title-${opportunity.id}`}>
                            {opportunity.title}
                          </h3>
                          <Badge variant="outline">{opportunity.status}</Badge>
                        </div>
                        {opportunity.description && (
                          <p className="text-sm text-muted-foreground" data-testid={`opportunity-description-${opportunity.id}`}>
                            {opportunity.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>Value: {formatCurrency(opportunity.value)}</span>
                          <span>Probability: {opportunity.probability || 0}%</span>
                          <span>Created: {formatDate(opportunity.createdAt)}</span>
                        </div>
                      </div>
                      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOpportunities([opportunity.id])}
                            data-testid={`button-transfer-${opportunity.id}`}
                          >
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Transfer
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Transfer Opportunity</DialogTitle>
                            <DialogDescription>
                              Transfer "{opportunity.title}" to an enterprise owner
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="transfer-to">Enterprise Owner</Label>
                              <Select value={selectedTransferTo} onValueChange={setSelectedTransferTo}>
                                <SelectTrigger data-testid="select-transfer-to">
                                  <SelectValue placeholder="Select enterprise owner" />
                                </SelectTrigger>
                                <SelectContent>
                                  {enterpriseOwners.map((owner: User) => (
                                    <SelectItem key={owner.id} value={owner.id}>
                                      {owner.firstName} {owner.lastName} ({owner.email})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="reason">Transfer Reason</Label>
                              <Input
                                id="reason"
                                value={transferReason}
                                onChange={(e) => setTransferReason(e.target.value)}
                                placeholder="Reason for transfer"
                                data-testid="input-reason"
                              />
                            </div>
                            <div>
                              <Label htmlFor="notes">Additional Notes</Label>
                              <Textarea
                                id="notes"
                                value={transferNotes}
                                onChange={(e) => setTransferNotes(e.target.value)}
                                placeholder="Additional notes or instructions"
                                data-testid="textarea-notes"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setTransferDialogOpen(false);
                                resetTransferForm();
                              }}
                              data-testid="button-cancel-transfer"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleSingleTransfer(opportunity.id)}
                              disabled={createTransferMutation.isPending}
                              data-testid="button-confirm-transfer"
                            >
                              {createTransferMutation.isPending ? "Transferring..." : "Transfer Opportunity"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transfer History</CardTitle>
                  <CardDescription>View all opportunity transfers and their status</CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48" data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transfersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading transfers...</div>
                ) : transfers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No transfers found</div>
                ) : (
                  transfers.map((transfer: OpportunityTransfer) => (
                    <div
                      key={transfer.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`transfer-${transfer.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium" data-testid={`transfer-opportunity-${transfer.id}`}>
                            {transfer.opportunity.title}
                          </h3>
                          {getStatusBadge(transfer.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span data-testid={`transfer-from-${transfer.id}`}>
                            From: {transfer.transferredByUser.firstName} {transfer.transferredByUser.lastName}
                          </span>
                          <span data-testid={`transfer-to-${transfer.id}`}>
                            To: {transfer.transferredToUser.firstName} {transfer.transferredToUser.lastName}
                          </span>
                          <span>Transferred: {formatDate(transfer.transferredAt)}</span>
                          {transfer.respondedAt && (
                            <span>Responded: {formatDate(transfer.respondedAt)}</span>
                          )}
                        </div>
                        {transfer.reason && (
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`transfer-reason-${transfer.id}`}>
                            Reason: {transfer.reason}
                          </p>
                        )}
                        {transfer.notes && (
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`transfer-notes-${transfer.id}`}>
                            Notes: {transfer.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Value: {formatCurrency(transfer.opportunity.value)}</div>
                        <div>ID: {transfer.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}