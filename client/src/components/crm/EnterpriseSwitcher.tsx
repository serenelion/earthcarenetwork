import { Check, ChevronsUpDown, Building2, Shield, Plus } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import CreateEnterpriseDialog from "@/components/crm/CreateEnterpriseDialog";

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  editor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

export default function EnterpriseSwitcher() {
  const { currentEnterprise, userEnterprises, switchEnterprise, isLoading } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted animate-pulse">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (userEnterprises.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted" data-testid="no-enterprises-message">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No workspaces</span>
      </div>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full md:w-[280px] justify-between"
            data-testid="enterprise-switcher-button"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {currentEnterprise?.imageUrl ? (
                <img
                  src={currentEnterprise.imageUrl}
                  alt={currentEnterprise.name}
                  className="h-5 w-5 rounded object-cover"
                />
              ) : (
                <Building2 className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="truncate" data-testid="current-enterprise-name">
                {currentEnterprise?.name || "Select workspace..."}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full md:w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search workspaces..." />
            <CommandList>
              <CommandEmpty>No workspaces found.</CommandEmpty>
              <CommandGroup heading="Your Workspaces">
                {userEnterprises.map((enterprise) => (
                  <CommandItem
                    key={enterprise.id}
                    value={enterprise.id}
                    onSelect={() => {
                      if (enterprise.id !== currentEnterprise?.id) {
                        switchEnterprise(enterprise.id);
                      }
                      setOpen(false);
                    }}
                    data-testid={`enterprise-option-${enterprise.id}`}
                  >
                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                      {enterprise.imageUrl ? (
                        <img
                          src={enterprise.imageUrl}
                          alt={enterprise.name}
                          className="h-5 w-5 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm" data-testid={`enterprise-name-${enterprise.id}`}>
                            {enterprise.name}
                          </span>
                          {enterprise.isVerified && (
                            <Shield className="h-3 w-3 text-primary flex-shrink-0" data-testid={`verified-badge-${enterprise.id}`} />
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn("text-xs mt-1", roleColors[enterprise.role])}
                          data-testid={`role-badge-${enterprise.id}`}
                        >
                          {roleLabels[enterprise.role] || enterprise.role}
                        </Badge>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          currentEnterprise?.id === enterprise.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowCreateDialog(true);
                  }}
                  className="text-primary"
                  data-testid="button-create-new-workspace"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create New Workspace</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Enterprise Dialog */}
      <CreateEnterpriseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
