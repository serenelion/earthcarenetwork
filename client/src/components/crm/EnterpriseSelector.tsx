import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Building, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EnterpriseDirectoryModal from "./EnterpriseDirectoryModal";
import type { CrmWorkspaceEnterprise, Enterprise } from "@shared/schema";

interface EnterpriseSelectorProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  workspaceEnterprises: CrmWorkspaceEnterprise[];
  enterpriseId: string;
  disabled?: boolean;
  className?: string;
  onLinkingStateChange?: (isLinking: boolean) => void;
}

export default function EnterpriseSelector({
  value,
  onChange,
  workspaceEnterprises,
  enterpriseId,
  disabled = false,
  className,
  onLinkingStateChange,
}: EnterpriseSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const selectedEnterprise = value
    ? workspaceEnterprises.find((e) => e.id === value)
    : null;

  const linkEnterpriseMutation = useMutation({
    mutationFn: async (directoryEnterpriseId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/crm/${enterpriseId}/workspace/enterprises`,
        { mode: 'link', directoryEnterpriseId }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm", enterpriseId, "workspace", "enterprises"] });
    },
  });

  const handleSelect = async (enterprise: Enterprise) => {
    // Check if this directory enterprise is already linked to workspace
    const existingLink = workspaceEnterprises.find(
      (we) => we.directoryEnterpriseId === enterprise.id
    );

    if (existingLink) {
      // Already linked - use existing workspace enterprise ID
      onChange(existingLink.id);
      setIsModalOpen(false);
    } else {
      // Not linked yet - link it automatically
      try {
        onLinkingStateChange?.(true);
        const workspaceEnterprise = await linkEnterpriseMutation.mutateAsync(enterprise.id);
        onChange(workspaceEnterprise.id); // Use workspace enterprise ID
        setIsModalOpen(false);
        toast({
          title: "Success",
          description: `${enterprise.name} has been linked to your workspace`,
        });
      } catch (error) {
        console.error("Failed to link enterprise:", error);
        toast({
          title: "Error",
          description: "Failed to link enterprise to workspace. Please try again.",
          variant: "destructive",
        });
      } finally {
        onLinkingStateChange?.(false);
      }
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  const isLinking = linkEnterpriseMutation.isPending;

  return (
    <>
      <div className={cn("flex flex-col gap-1", className)}>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
          onClick={() => setIsModalOpen(true)}
          disabled={disabled || isLinking}
          data-testid="button-open-enterprise-directory"
        >
          {isLinking ? (
            <>
              <span>Linking enterprise...</span>
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
            </>
          ) : (
            <>
              {selectedEnterprise?.name || "Browse Enterprises..."}
              <Building className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>

        {value && !disabled && !isLinking && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1"
            onClick={handleClear}
            data-testid="button-clear-enterprise"
          >
            <X className="w-3 h-3 mr-1" />
            Clear Selection
          </Button>
        )}
      </div>

      <EnterpriseDirectoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSelect={handleSelect}
        selectedEnterpriseId={value}
      />
    </>
  );
}
