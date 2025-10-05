import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown } from "lucide-react";
import { NavLinkItem } from "@/config/navigationConfig";

/**
 * Props for the NavigationLink component
 */
interface NavigationLinkProps {
  item: NavLinkItem;
  withIcon?: boolean;
  withTooltip?: boolean;
  tooltipText?: string;
  className?: string;
}

/**
 * Reusable navigation link component
 * Renders a single navigation link with optional icon and tooltip
 * 
 * @param item - Navigation link configuration object
 * @param withIcon - Whether to display the icon
 * @param withTooltip - Whether to wrap the link in a tooltip
 * @param tooltipText - Text to display in tooltip
 * @param className - Additional CSS classes
 */
export function NavigationLink({ 
  item, 
  withIcon = true, 
  withTooltip = false, 
  tooltipText,
  className = "text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
}: NavigationLinkProps) {
  const Icon = item.icon;
  
  const linkContent = (
    <Link href={item.href} className={className} data-testid={item.testId}>
      {withIcon && <Icon className="h-4 w-4" />}
      {item.label}
    </Link>
  );

  if (withTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText || item.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}

/**
 * Props for the NavigationDropdown component
 */
interface NavigationDropdownProps {
  label: string;
  items: NavLinkItem[];
  testId: string;
  variant?: "ghost" | "default" | "outline";
  hasSeparator?: boolean;
  separatorAfterIndex?: number;
}

/**
 * Reusable navigation dropdown menu component
 * Renders a dropdown menu with navigation items
 * 
 * @param label - Dropdown button label
 * @param items - Array of navigation items to display in dropdown
 * @param testId - Test ID for the dropdown trigger
 * @param variant - Button variant style
 * @param hasSeparator - Whether to include a separator in the menu
 * @param separatorAfterIndex - Index after which to insert separator
 */
export function NavigationDropdown({
  label,
  items,
  testId,
  variant = "ghost",
  hasSeparator = false,
  separatorAfterIndex
}: NavigationDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} className="text-muted-foreground hover:text-foreground" data-testid={testId}>
          {label} <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.href}>
              <DropdownMenuItem asChild>
                <Link href={item.href} data-testid={item.testId}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
              {hasSeparator && separatorAfterIndex === index && (
                <DropdownMenuSeparator />
              )}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Props for the MobileNavigationItem component
 */
interface MobileNavigationItemProps {
  item: NavLinkItem;
  onClick?: () => void;
}

/**
 * Mobile navigation item component
 * Renders a navigation item optimized for mobile menus
 * 
 * @param item - Navigation link configuration object
 * @param onClick - Optional click handler (e.g., to close mobile menu)
 */
export function MobileNavigationItem({ item, onClick }: MobileNavigationItemProps) {
  const Icon = item.icon;
  
  return (
    <Link 
      href={item.href} 
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-md transition-colors"
      data-testid={item.testId}
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}

/**
 * Props for the MobileNavigationSection component
 */
interface MobileNavigationSectionProps {
  title: string;
  items: NavLinkItem[];
  onClick?: () => void;
}

/**
 * Mobile navigation section component
 * Renders a titled section of navigation items for mobile menus
 * 
 * @param title - Section title
 * @param items - Array of navigation items in this section
 * @param onClick - Optional click handler for items
 */
export function MobileNavigationSection({ title, items, onClick }: MobileNavigationSectionProps) {
  return (
    <div className="py-2">
      <h3 className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => (
          <MobileNavigationItem key={item.href} item={item} onClick={onClick} />
        ))}
      </div>
    </div>
  );
}
