import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building, X } from "lucide-react";
import { cn } from "@/lib/utils";
import EnterpriseDirectoryModal from "./EnterpriseDirectoryModal";
import type { CrmWorkspaceEnterprise } from "@shared/schema";

interface EnterpriseSelectorProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  workspaceEnterprises: CrmWorkspaceEnterprise[];
  disabled?: boolean;
  className?: string;
}

export default function EnterpriseSelector({
  value,
  onChange,
  workspaceEnterprises,
  disabled = false,
  className,
}: EnterpriseSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedEnterprise = value
    ? workspaceEnterprises.find((e) => e.id === value)
    : null;

  const handleSelect = (enterprise: { id: string; name: string }) => {
    onChange(enterprise.id);
    setIsModalOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

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
          disabled={disabled}
          data-testid="button-open-enterprise-directory"
        >
          {selectedEnterprise?.name || "Browse Enterprises..."}
          <Building className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {value && !disabled && (
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
