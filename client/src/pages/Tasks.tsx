import { useEffect } from "react";
import { useLocation } from "wouter";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Tasks() {
  const [, setLocation] = useLocation();
  const { currentEnterprise, userEnterprises } = useWorkspace();

  useEffect(() => {
    if (currentEnterprise) {
      setLocation(`/crm/${currentEnterprise.id}/tasks`);
    } else if (userEnterprises && userEnterprises.length > 0) {
      setLocation(`/crm/${userEnterprises[0].id}/tasks`);
    }
  }, [currentEnterprise, userEnterprises, setLocation]);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Workspace Required</CardTitle>
          <CardDescription>Please select a workspace to access this feature</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setLocation("/dashboard")} data-testid="button-go-to-dashboard">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
