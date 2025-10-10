import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building,
  User,
  Handshake,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Plus,
  ExternalLink,
  CheckCircle2,
  Users,
  ListTodo,
  Globe,
  Briefcase,
  Target,
} from "lucide-react";
import type {
  CrmWorkspaceOpportunity,
  CrmWorkspacePerson,
  CrmWorkspaceEnterprise,
  CrmWorkspaceTask,
} from "@shared/schema";
import { format } from "date-fns";

type EntityType = "opportunity" | "person" | "enterprise";

interface EntityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  entityId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate?: (type: EntityType, id: string) => void;
  onAddOpportunity?: (prefilledData: any) => void;
  onAddTask?: (prefilledData: any) => void;
  onAddPerson?: (prefilledData: any) => void;
}

const opportunityStatuses = [
  { value: "lead", label: "Lead", color: "bg-gray-100 text-gray-800" },
  { value: "qualified", label: "Qualified", color: "bg-blue-100 text-blue-800" },
  { value: "proposal", label: "Proposal", color: "bg-yellow-100 text-yellow-800" },
  { value: "negotiation", label: "Negotiation", color: "bg-orange-100 text-orange-800" },
  { value: "closed_won", label: "Closed Won", color: "bg-green-100 text-green-800" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-100 text-red-800" },
];

const categoryColors = {
  land_projects: "bg-green-100 text-green-800",
  capital_sources: "bg-yellow-100 text-yellow-800",
  open_source_tools: "bg-blue-100 text-blue-800",
  network_organizers: "bg-purple-100 text-purple-800",
  homes_that_heal: "bg-rose-100 text-rose-800",
  landscapes_that_nourish: "bg-emerald-100 text-emerald-800",
  lifelong_learning_providers: "bg-indigo-100 text-indigo-800",
};

const categoryLabels = {
  land_projects: "Land Project",
  capital_sources: "Capital Source",
  open_source_tools: "Open Source Tool",
  network_organizers: "Network Organizer",
  homes_that_heal: "Homes that Heal",
  landscapes_that_nourish: "Landscapes that Nourish",
  lifelong_learning_providers: "Lifelong Learning",
};

const relationshipStageColors = {
  cold: "bg-blue-100 text-blue-800",
  warm: "bg-yellow-100 text-yellow-800",
  hot: "bg-orange-100 text-orange-800",
  prospect: "bg-purple-100 text-purple-800",
  active: "bg-green-100 text-green-800",
  partner: "bg-indigo-100 text-indigo-800",
  inactive: "bg-gray-100 text-gray-800",
  customer: "bg-emerald-100 text-emerald-800",
};

const taskStatuses = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800" },
};

export default function EntityDrawer({
  open,
  onOpenChange,
  entityType,
  entityId,
  onEdit,
  onDelete,
  onNavigate,
  onAddOpportunity,
  onAddTask,
  onAddPerson,
}: EntityDrawerProps) {
  const { enterpriseId } = useParams<{ enterpriseId: string }>();
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setInternalOpen(newOpen);
    onOpenChange(newOpen);
  };

  // Fetch opportunity data
  const { data: opportunity, isLoading: opportunityLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "opportunities", entityId],
    queryFn: async (): Promise<CrmWorkspaceOpportunity> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/opportunities/${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch opportunity");
      return response.json();
    },
    enabled: !!enterpriseId && entityType === "opportunity" && !!entityId && internalOpen,
    retry: false,
  });

  // Fetch person data
  const { data: person, isLoading: personLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "people", entityId],
    queryFn: async (): Promise<CrmWorkspacePerson> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/people/${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch person");
      return response.json();
    },
    enabled: !!enterpriseId && entityType === "person" && !!entityId && internalOpen,
    retry: false,
  });

  // Fetch enterprise data
  const { data: enterprise, isLoading: enterpriseLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises", entityId],
    queryFn: async (): Promise<CrmWorkspaceEnterprise> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/enterprises/${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch enterprise");
      return response.json();
    },
    enabled: !!enterpriseId && entityType === "enterprise" && !!entityId && internalOpen,
    retry: false,
  });

  // Fetch related person for opportunity
  const { data: relatedPerson } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "people", opportunity?.workspacePersonId],
    queryFn: async (): Promise<CrmWorkspacePerson> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/people/${opportunity?.workspacePersonId}`);
      if (!response.ok) throw new Error("Failed to fetch person");
      return response.json();
    },
    enabled: !!enterpriseId && !!opportunity?.workspacePersonId && internalOpen,
    retry: false,
  });

  // Fetch related enterprise for opportunity
  const { data: relatedOpportunityEnterprise } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises", opportunity?.workspaceEnterpriseId],
    queryFn: async (): Promise<CrmWorkspaceEnterprise> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/enterprises/${opportunity?.workspaceEnterpriseId}`);
      if (!response.ok) throw new Error("Failed to fetch enterprise");
      return response.json();
    },
    enabled: !!enterpriseId && !!opportunity?.workspaceEnterpriseId && internalOpen,
    retry: false,
  });

  // Fetch related enterprise for person
  const { data: relatedPersonEnterprise } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises", person?.workspaceEnterpriseId],
    queryFn: async (): Promise<CrmWorkspaceEnterprise> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/enterprises/${person?.workspaceEnterpriseId}`);
      if (!response.ok) throw new Error("Failed to fetch enterprise");
      return response.json();
    },
    enabled: !!enterpriseId && !!person?.workspaceEnterpriseId && internalOpen,
    retry: false,
  });

  // Fetch tasks for opportunity
  const { data: opportunityTasks = [], isLoading: opportunityTasksLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "tasks", "opportunity", entityId],
    queryFn: async (): Promise<CrmWorkspaceTask[]> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/tasks?workspaceOpportunityId=${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: !!enterpriseId && entityType === "opportunity" && !!entityId && internalOpen,
    retry: false,
  });

  // Fetch tasks for person
  const { data: personTasks = [], isLoading: personTasksLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "tasks", "person", entityId],
    queryFn: async (): Promise<CrmWorkspaceTask[]> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/tasks?workspacePersonId=${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: !!enterpriseId && entityType === "person" && !!entityId && internalOpen,
    retry: false,
  });

  // Fetch opportunities for person
  const { data: personOpportunities = [], isLoading: personOpportunitiesLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "opportunities", "person", entityId],
    queryFn: async (): Promise<CrmWorkspaceOpportunity[]> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/opportunities?workspacePersonId=${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
    enabled: !!enterpriseId && entityType === "person" && !!entityId && internalOpen,
    retry: false,
  });

  // Fetch people for enterprise
  const { data: enterprisePeople = [], isLoading: enterprisePeopleLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "people", "enterprise", entityId],
    queryFn: async (): Promise<CrmWorkspacePerson[]> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/people?workspaceEnterpriseId=${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch people");
      return response.json();
    },
    enabled: !!enterpriseId && entityType === "enterprise" && !!entityId && internalOpen,
    retry: false,
  });

  // Fetch opportunities for enterprise
  const { data: enterpriseOpportunities = [], isLoading: enterpriseOpportunitiesLoading } = useQuery({
    queryKey: ["/api/crm", enterpriseId, "workspace", "opportunities", "enterprise", entityId],
    queryFn: async (): Promise<CrmWorkspaceOpportunity[]> => {
      const response = await fetch(`/api/crm/${enterpriseId}/workspace/opportunities?workspaceEnterpriseId=${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
    enabled: !!enterpriseId && entityType === "enterprise" && !!entityId && internalOpen,
    retry: false,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = opportunityStatuses.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color} data-testid={`badge-status-${status}`}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const formatCurrency = (cents: number | null | undefined) => {
    if (!cents) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const renderOpportunityContent = () => {
    if (opportunityLoading) {
      return <Skeleton className="h-64 w-full" />;
    }

    if (!opportunity) {
      return <div className="p-4 text-muted-foreground">Opportunity not found</div>;
    }

    return (
      <div className="space-y-6">
        {/* Header Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-bold" data-testid="text-opportunity-title">{opportunity.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(opportunity.status || "lead")}
                <Badge variant="outline" data-testid="text-opportunity-value">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {formatCurrency(opportunity.value)}
                </Badge>
                {opportunity.probability !== null && (
                  <Badge variant="outline" data-testid="text-opportunity-probability">
                    <Target className="w-3 h-3 mr-1" />
                    {opportunity.probability}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {opportunity.description && (
            <div>
              <p className="text-sm text-muted-foreground">{opportunity.description}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Related Entities */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Related To</h4>
          
          {relatedPerson && (
            <Card 
              className="cursor-pointer hover:bg-accent transition-colors" 
              onClick={() => onNavigate?.("person", relatedPerson.id)}
              data-testid={`card-person-${relatedPerson.id}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{relatedPerson.firstName} {relatedPerson.lastName}</p>
                  <p className="text-sm text-muted-foreground">{relatedPerson.title || "Contact"}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          )}

          {relatedOpportunityEnterprise && (
            <Card 
              className="cursor-pointer hover:bg-accent transition-colors" 
              onClick={() => onNavigate?.("enterprise", relatedOpportunityEnterprise.id)}
              data-testid={`card-enterprise-${relatedOpportunityEnterprise.id}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Building className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{relatedOpportunityEnterprise.name}</p>
                  <Badge className={categoryColors[relatedOpportunityEnterprise.category as keyof typeof categoryColors]}>
                    {categoryLabels[relatedOpportunityEnterprise.category as keyof typeof categoryLabels]}
                  </Badge>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tasks */}
        {opportunityTasks.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                Tasks ({opportunityTasks.length})
              </h4>
              <div className="space-y-2">
                {opportunityTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm" data-testid={`task-${task.id}`}>
                    <Badge className={taskStatuses[task.status as keyof typeof taskStatuses]?.color || "bg-gray-100"}>
                      {taskStatuses[task.status as keyof typeof taskStatuses]?.label || task.status}
                    </Badge>
                    <span className="flex-1">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Additional Info */}
        {(opportunity.expectedCloseDate || opportunity.notes) && (
          <>
            <Separator />
            <div className="space-y-3">
              {opportunity.expectedCloseDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Expected Close:</span>
                  <span>{format(new Date(opportunity.expectedCloseDate), "MMM d, yyyy")}</span>
                </div>
              )}
              {opportunity.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes:</p>
                  <p className="text-sm text-muted-foreground">{opportunity.notes}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderPersonContent = () => {
    if (personLoading) {
      return <Skeleton className="h-64 w-full" />;
    }

    if (!person) {
      return <div className="p-4 text-muted-foreground">Person not found</div>;
    }

    return (
      <div className="space-y-6">
        {/* Header Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold" data-testid="text-person-name">
              {person.firstName} {person.lastName}
            </h3>
            {person.title && (
              <p className="text-muted-foreground mt-1" data-testid="text-person-title">{person.title}</p>
            )}
          </div>

          <div className="space-y-2">
            {person.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${person.email}`} className="text-blue-600 hover:underline" data-testid="link-person-email">
                  {person.email}
                </a>
              </div>
            )}
            {person.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span data-testid="text-person-phone">{person.phone}</span>
              </div>
            )}
            {person.linkedinUrl && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" data-testid="link-person-linkedin">
                  LinkedIn Profile
                </a>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Related Enterprise */}
        {relatedPersonEnterprise && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Enterprise</h4>
            <Card 
              className="cursor-pointer hover:bg-accent transition-colors" 
              onClick={() => onNavigate?.("enterprise", relatedPersonEnterprise.id)}
              data-testid={`card-enterprise-${relatedPersonEnterprise.id}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Building className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{relatedPersonEnterprise.name}</p>
                  <Badge className={categoryColors[relatedPersonEnterprise.category as keyof typeof categoryColors]}>
                    {categoryLabels[relatedPersonEnterprise.category as keyof typeof categoryLabels]}
                  </Badge>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Opportunities */}
        {personOpportunities.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Handshake className="w-4 h-4" />
                Opportunities ({personOpportunities.length})
              </h4>
              <div className="space-y-2">
                {personOpportunities.slice(0, 5).map((opp) => (
                  <Card 
                    key={opp.id} 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => onNavigate?.("opportunity", opp.id)}
                    data-testid={`card-opportunity-${opp.id}`}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{opp.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(opp.status || "lead")}
                          <span className="text-xs text-muted-foreground">{formatCurrency(opp.value)}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Tasks */}
        {personTasks.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                Tasks ({personTasks.length})
              </h4>
              <div className="space-y-2">
                {personTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm" data-testid={`task-${task.id}`}>
                    <Badge className={taskStatuses[task.status as keyof typeof taskStatuses]?.color || "bg-gray-100"}>
                      {taskStatuses[task.status as keyof typeof taskStatuses]?.label || task.status}
                    </Badge>
                    <span className="flex-1">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {person.notes && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground">{person.notes}</p>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderEnterpriseContent = () => {
    if (enterpriseLoading) {
      return <Skeleton className="h-64 w-full" />;
    }

    if (!enterprise) {
      return <div className="p-4 text-muted-foreground">Enterprise not found</div>;
    }

    return (
      <div className="space-y-6">
        {/* Header Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold" data-testid="text-enterprise-name">{enterprise.name}</h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={categoryColors[enterprise.category as keyof typeof categoryColors]}>
                {categoryLabels[enterprise.category as keyof typeof categoryLabels]}
              </Badge>
              {enterprise.relationshipStage && (
                <Badge className={relationshipStageColors[enterprise.relationshipStage as keyof typeof relationshipStageColors]}>
                  {enterprise.relationshipStage.charAt(0).toUpperCase() + enterprise.relationshipStage.slice(1)}
                </Badge>
              )}
            </div>
          </div>

          {enterprise.description && (
            <p className="text-sm text-muted-foreground">{enterprise.description}</p>
          )}

          <div className="space-y-2">
            {enterprise.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <a 
                  href={enterprise.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                  data-testid="link-enterprise-website"
                >
                  {enterprise.website}
                </a>
              </div>
            )}
            {enterprise.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span data-testid="text-enterprise-location">{enterprise.location}</span>
              </div>
            )}
            {enterprise.contactEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${enterprise.contactEmail}`} className="text-blue-600 hover:underline" data-testid="link-enterprise-email">
                  {enterprise.contactEmail}
                </a>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* People */}
        {enterprisePeople.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              People ({enterprisePeople.length})
            </h4>
            <div className="space-y-2">
              {enterprisePeople.slice(0, 5).map((p) => (
                <Card 
                  key={p.id} 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onNavigate?.("person", p.id)}
                  data-testid={`card-person-${p.id}`}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                        {p.title && <p className="text-xs text-muted-foreground">{p.title}</p>}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Opportunities */}
        {enterpriseOpportunities.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Handshake className="w-4 h-4" />
                Opportunities ({enterpriseOpportunities.length})
              </h4>
              <div className="space-y-2">
                {enterpriseOpportunities.slice(0, 5).map((opp) => (
                  <Card 
                    key={opp.id} 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => onNavigate?.("opportunity", opp.id)}
                    data-testid={`card-opportunity-${opp.id}`}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{opp.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(opp.status || "lead")}
                          <span className="text-xs text-muted-foreground">{formatCurrency(opp.value)}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* External Data Badges */}
        {enterprise.externalSourceRef && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">External Data Sources</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Briefcase className="w-3 h-3 mr-1" />
                  External Data Available
                </Badge>
              </div>
            </div>
          </>
        )}

        {/* Tags */}
        {enterprise.tags && enterprise.tags.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {enterprise.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {enterprise.ownerNotes && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground">{enterprise.ownerNotes}</p>
            </div>
          </>
        )}
      </div>
    );
  };

  const getTitle = () => {
    if (entityType === "opportunity") return "Opportunity Details";
    if (entityType === "person") return "Person Details";
    if (entityType === "enterprise") return "Enterprise Details";
    return "Details";
  };

  const getIcon = () => {
    if (entityType === "opportunity") return <Handshake className="w-5 h-5" />;
    if (entityType === "person") return <User className="w-5 h-5" />;
    if (entityType === "enterprise") return <Building className="w-5 h-5" />;
    return null;
  };

  return (
    <Sheet open={internalOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto" data-testid={`drawer-${entityType}`}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="pr-6">
            {entityType === "opportunity" && renderOpportunityContent()}
            {entityType === "person" && renderPersonContent()}
            {entityType === "enterprise" && renderEnterpriseContent()}
          </div>
        </ScrollArea>

        {/* Actions Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background space-y-3">
          {/* Quick Actions */}
          {(onAddOpportunity || onAddTask || onAddPerson) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</p>
              <div className="flex gap-2 flex-wrap">
                {/* Person Drawer: Add Opportunity, Add Task */}
                {entityType === "person" && person && (
                  <>
                    {onAddOpportunity && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onAddOpportunity({
                          workspacePersonId: person.id,
                          workspaceEnterpriseId: person.workspaceEnterpriseId || "",
                        })}
                        data-testid="button-quick-add-opportunity"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Add Opportunity
                      </Button>
                    )}
                    {onAddTask && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onAddTask({
                          workspacePersonId: person.id,
                        })}
                        data-testid="button-quick-add-task"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Add Task
                      </Button>
                    )}
                  </>
                )}

                {/* Enterprise Drawer: Add Person, Add Opportunity */}
                {entityType === "enterprise" && enterprise && (
                  <>
                    {onAddPerson && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onAddPerson({
                          workspaceEnterpriseId: enterprise.id,
                        })}
                        data-testid="button-quick-add-person"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Add Person
                      </Button>
                    )}
                    {onAddOpportunity && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onAddOpportunity({
                          workspaceEnterpriseId: enterprise.id,
                        })}
                        data-testid="button-quick-add-opportunity"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Add Opportunity
                      </Button>
                    )}
                  </>
                )}

                {/* Opportunity Drawer: Add Task */}
                {entityType === "opportunity" && opportunity && (
                  <>
                    {onAddTask && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onAddTask({
                          workspaceOpportunityId: opportunity.id,
                          workspacePersonId: opportunity.workspacePersonId || "",
                          workspaceEnterpriseId: opportunity.workspaceEnterpriseId || "",
                        })}
                        data-testid="button-quick-add-task"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Add Task
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Edit/Delete Actions */}
          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" onClick={onEdit} className="flex-1" data-testid="button-edit">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" onClick={onDelete} data-testid="button-delete">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
