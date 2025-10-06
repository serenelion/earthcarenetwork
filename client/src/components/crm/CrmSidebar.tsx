import { useLocation, Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getCrmNavSections } from "@/config/crmNavigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function CrmSidebar() {
  const [location] = useLocation();
  const { currentEnterprise } = useWorkspace();
  const { userSubscription } = useSubscription();

  // Use default enterpriseId if not available (fallback for loading state)
  const enterpriseId = currentEnterprise?.id || '';
  const navSections = getCrmNavSections(enterpriseId);
  
  // Check if user is CRM Pro
  const isCrmProUser = userSubscription?.currentPlanType === 'crm_pro' || userSubscription?.currentPlanType === 'build_pro_bundle';

  return (
    <ScrollArea className="h-full py-6">
      <div className="space-y-6 px-3">
        {navSections.map((section, index) => (
          <div key={section.title}>
            {index > 0 && <Separator className="mb-4" />}
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              {section.links.map((link) => {
                // Skip CRM Pro links if user doesn't have access
                if (link.requiresCrmPro && !isCrmProUser) {
                  return null;
                }
                
                const Icon = link.icon;
                const isActive = location === link.href;
                
                return (
                  <Link key={link.href} href={link.href} className="block">
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-secondary text-secondary-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                      data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
