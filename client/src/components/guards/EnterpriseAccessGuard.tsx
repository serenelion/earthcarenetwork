import { ReactNode, useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { 
  Building2, 
  Target, 
  BarChart3, 
  Lightbulb, 
  Users,
  Sparkles,
  Globe,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateEnterpriseDialog from "@/components/crm/CreateEnterpriseDialog";
import { Button } from "@/components/ui/button";

interface EnterpriseAccessGuardProps {
  children: ReactNode;
}

export default function EnterpriseAccessGuard({ children }: EnterpriseAccessGuardProps) {
  const { enterpriseId } = useParams<{ enterpriseId: string }>();
  const { userEnterprises, isLoading, currentEnterprise } = useWorkspace();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    // Wait for enterprises to load
    if (isLoading) return;

    // Check if user has no enterprises
    if (userEnterprises.length === 0) {
      toast({
        title: "Set up your workspace",
        description: "Create your enterprise profile to access your workspace and CRM tools.",
      });
      setLocation("/crm");
      return;
    }

    // Check if enterpriseId is provided
    if (!enterpriseId) {
      // Redirect to first available enterprise
      setLocation(`/crm/${userEnterprises[0].id}/dashboard`);
      return;
    }

    // Check if user has access to the requested enterprise
    const hasAccess = userEnterprises.some(e => e.id === enterpriseId);
    if (!hasAccess) {
      toast({
        title: "Workspace not found",
        description: "You don't have access to this workspace. Switching to your available workspaces.",
        variant: "destructive",
      });
      setLocation("/crm");
      return;
    }
  }, [enterpriseId, userEnterprises, isLoading, setLocation, toast]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Show no access state with enhanced UX
  if (userEnterprises.length === 0) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <div className="max-w-3xl w-full">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Building2 className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="heading-welcome">
                Welcome to Your CRM Workspace
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Get started by setting up your enterprise profile and workspace
              </p>
            </div>

            {/* Benefits List */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                What you'll get:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Global visibility:</strong> A public profile in the regenerative enterprise directory</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Relationship management:</strong> Private CRM tools to track contacts, opportunities, and partnerships</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Team collaboration:</strong> Invite team members and manage your workspace together</span>
                </li>
              </ul>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-col gap-4">
              <Button
                size="lg"
                className="w-full text-base py-6"
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-create-first-workspace"
              >
                <Building2 className="mr-2 h-5 w-5" />
                Set Up My Workspace
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="w-full text-base py-6"
                onClick={() => setLocation("/enterprises")}
                data-testid="button-claim-enterprise"
              >
                <Globe className="mr-2 h-5 w-5" />
                Claim Existing Enterprise
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Brand new?</strong> Click "Set Up My Workspace" to create your enterprise profile and CRM.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Already listed in the directory?</strong>{" "}
                <button
                  onClick={() => setLocation("/enterprises")}
                  className="text-primary hover:underline font-medium"
                  data-testid="link-browse-directory"
                >
                  Claim your existing profile
                </button>{" "}
                to unlock your workspace.
              </p>
            </div>
          </div>
        </div>

        {/* Create Enterprise Dialog */}
        <CreateEnterpriseDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </>
    );
  }

  // Check if we're waiting for current enterprise to be set
  if (!currentEnterprise && enterpriseId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Switching workspace...</p>
        </div>
      </div>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
}
