import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  Building,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  User,
  Globe,
  Phone,
  Mail,
  Calendar,
  FileText,
  Users,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import type { PartnerApplication } from "@shared/schema";

// Status color mapping
const getStatusColor = (status: string | null) => {
  if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'under_review':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getStatusIcon = (status: string | null) => {
  if (!status) return <AlertCircle className="w-4 h-4" />;
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'under_review':
      return <Eye className="w-4 h-4" />;
    case 'approved':
      return <CheckCircle className="w-4 h-4" />;
    case 'rejected':
      return <XCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

interface ApplicationDetailModalProps {
  application: PartnerApplication;
  onStatusUpdate: (id: string, status: string, notes?: string) => void;
  isUpdating: boolean;
}

function ApplicationDetailModal({ application, onStatusUpdate, isUpdating }: ApplicationDetailModalProps) {
  const [newStatus, setNewStatus] = useState<string>(application.status || 'pending');
  const [notes, setNotes] = useState(application.notes || "");
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdate = () => {
    if (newStatus) {
      onStatusUpdate(application.id, newStatus, notes);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-view-${application.id}`}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            {application.organizationName || 'Unknown Organization'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status & Actions */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor(application.status)}>
                {getStatusIcon(application.status)}
                <span className="ml-1 capitalize">{application.status ? application.status.replace('_', ' ') : 'Unknown'}</span>
              </Badge>
              <span className="text-sm text-muted-foreground">
                Applied {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleUpdate} 
                disabled={isUpdating || newStatus === application.status}
                data-testid="button-update-status"
              >
                {isUpdating ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Organization Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Organization Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <User className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{application.contactPerson || 'No Contact Person'}</p>
                    <p className="text-sm text-muted-foreground">Primary Contact</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{application.email || 'No Email'}</p>
                    <p className="text-sm text-muted-foreground">Email</p>
                  </div>
                </div>

                {application.phone && (
                  <div className="flex items-start space-x-3">
                    <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{application.phone}</p>
                      <p className="text-sm text-muted-foreground">Phone</p>
                    </div>
                  </div>
                )}

                {application.website && (
                  <div className="flex items-start space-x-3">
                    <Globe className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <a 
                        href={application.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {application.website}
                      </a>
                      <p className="text-sm text-muted-foreground">Website</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Timeline</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border-l-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Application Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      {application.createdAt ? new Date(application.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {application.updatedAt && application.createdAt && application.updatedAt !== application.createdAt && (
                  <div className="flex items-center space-x-3 p-3 border-l-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(application.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {application.description && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Mission & Description</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{application.description}</p>
              </div>
            </div>
          )}

          {/* Areas of Focus */}
          {application.areasOfFocus && application.areasOfFocus.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Areas of Focus</h3>
              <div className="flex flex-wrap gap-2">
                {application.areasOfFocus.map((area, index) => (
                  <Badge key={index} variant="secondary">
                    {area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contribution */}
          {application.contribution && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Planned Contribution</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{application.contribution}</p>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Admin Notes</h3>
            <Textarea
              placeholder="Add notes about this application review..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
              data-testid="textarea-notes"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPartnerApplications() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is admin
  if (!isLoading && (!user || (user as any).role !== 'admin')) {
    return (
      <div className="max-w-2xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <Card className="text-center p-8">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl text-red-700 dark:text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the admin partner applications page.
            </p>
            <Button 
              onClick={() => window.location.href = "/"}
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch partner applications
  const { data: applications = [], isLoading: isLoadingApplications } = useQuery({
    queryKey: ["/api/crm/partner-applications"],
    enabled: (user as any)?.role === 'admin',
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/crm/partner-applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) {
        throw new Error('Failed to update application');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/partner-applications"] });
      toast({
        title: "Application Updated",
        description: "The application status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update the application status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (id: string, status: string, notes?: string) => {
    updateStatusMutation.mutate({ id, status, notes });
  };

  // Filter applications
  const filteredApplications = (applications as PartnerApplication[]).filter((app: PartnerApplication) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      app.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Get status counts
  const statusCounts = (applications as PartnerApplication[]).reduce((acc: Record<string, number>, app: PartnerApplication) => {
    if (app.status) {
      acc[app.status] = (acc[app.status] || 0) + 1;
    }
    return acc;
  }, {});

  if (isLoading || isLoadingApplications) {
    return (
      <div className="flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Partner Applications
          </h1>
          <p className="text-muted-foreground">
            Review and manage partnership applications for Earth Care Network
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(applications as PartnerApplication[]).length}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {statusCounts.pending || 0}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statusCounts.under_review || 0}
              </div>
              <div className="text-sm text-muted-foreground">Reviewing</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {statusCounts.approved || 0}
              </div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {statusCounts.rejected || 0}
              </div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations, contacts, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Applications ({filteredApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your filters to find applications."
                    : "No partnership applications have been submitted yet."
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application: PartnerApplication) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.organizationName || 'Unknown Organization'}</div>
                          {application.website && (
                            <a 
                              href={application.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              {application.website}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.contactPerson || 'No Contact Person'}</div>
                          <div className="text-sm text-muted-foreground">{application.email || 'No Email'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(application.status)}>
                          {getStatusIcon(application.status)}
                          <span className="ml-1 capitalize">
                            {application.status ? application.status.replace('_', ' ') : 'Unknown'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ApplicationDetailModal
                          application={application}
                          onStatusUpdate={handleStatusUpdate}
                          isUpdating={updateStatusMutation.isPending}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}