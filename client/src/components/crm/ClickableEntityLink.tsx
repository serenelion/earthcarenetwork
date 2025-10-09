import { Building, User, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type EntityType = "enterprise" | "person";

interface ClickableEntityLinkProps {
  type: EntityType;
  id: string;
  name: string;
  onClick: (type: EntityType, id: string) => void;
  className?: string;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
}

const iconSizes = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export default function ClickableEntityLink({
  type,
  id,
  name,
  onClick,
  className,
  showTooltip = true,
  size = "md",
}: ClickableEntityLinkProps) {
  const Icon = type === "enterprise" ? Building : User;
  const tooltipText = type === "enterprise" 
    ? "View enterprise details in side panel"
    : "View contact details in side panel";

  const button = (
    <button
      onClick={() => onClick(type, id)}
      className={cn(
        "flex items-center gap-1.5 text-primary hover:bg-primary/5 px-2 py-1 -ml-2 rounded-md cursor-pointer transition-all group",
        textSizes[size],
        className
      )}
      data-testid={`link-${type}-${id}`}
    >
      <Icon className={cn(iconSizes[size], "flex-shrink-0 group-hover:scale-110 transition-transform")} />
      <span className="truncate font-medium group-hover:underline">{name}</span>
      <ExternalLink className={cn("w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity")} />
    </button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
