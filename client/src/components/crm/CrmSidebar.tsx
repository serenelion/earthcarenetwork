import { useLocation, Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { crmNavSections } from "@/config/crmNavigation";

export default function CrmSidebar() {
  const [location] = useLocation();

  return (
    <ScrollArea className="h-full py-6">
      <div className="space-y-6 px-3">
        {crmNavSections.map((section, index) => (
          <div key={section.title}>
            {index > 0 && <Separator className="mb-4" />}
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              {section.links.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.href;
                
                return (
                  <Link key={link.href} href={link.href}>
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
