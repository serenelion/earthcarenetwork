import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: "default" | "outline" | "ghost" | "secondary";
  };
  children?: ReactNode;
}

export default function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
  children,
}: SectionHeaderProps) {
  const ActionIcon = action?.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-start space-x-3">
        {Icon && (
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-foreground font-lato">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      
      {(action || children) && (
        <div className="flex items-center space-x-2">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
