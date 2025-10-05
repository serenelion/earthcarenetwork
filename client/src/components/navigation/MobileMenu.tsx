import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { getPrimaryRole } from "@/lib/authUtils";
import { getNavigationForRole } from "@/config/navigationConfig";
import { MobileNavigationItem, MobileNavigationSection } from "./NavigationItems";

/**
 * Mobile navigation menu component
 * 
 * Displays a hamburger menu button on mobile devices that opens a side sheet
 * containing all navigation items relevant to the user's role.
 * 
 * Features:
 * - Role-based navigation (visitor, member, enterprise_owner, admin)
 * - Organized sections for different navigation areas
 * - Auto-close on navigation
 * - Responsive design (only shows on mobile)
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const userRole = getPrimaryRole(user);
  const navigation = getNavigationForRole(userRole);

  const handleClose = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">Navigation</SheetTitle>
        </SheetHeader>
        
        <div className="overflow-y-auto h-full pb-20">
          {/* Public Links */}
          <MobileNavigationSection 
            title="Browse"
            items={navigation.publicLinks}
            onClick={handleClose}
          />
          
          <Separator />
          
          {/* Authenticated User Sections */}
          {isAuthenticated && !isLoading && (
            <>
              {/* CRM Link */}
              {navigation.crmLink && (
                <>
                  <MobileNavigationSection 
                    title="Management"
                    items={[navigation.crmLink]}
                    onClick={handleClose}
                  />
                  <Separator />
                </>
              )}
              
              {/* Member Menu */}
              {navigation.memberMenu && (
                <>
                  <MobileNavigationSection 
                    title="Member"
                    items={navigation.memberMenu}
                    onClick={handleClose}
                  />
                  <Separator />
                </>
              )}
              
              {/* Admin Menu */}
              {navigation.adminMenu && (
                <>
                  <MobileNavigationSection 
                    title="Admin"
                    items={navigation.adminMenu}
                    onClick={handleClose}
                  />
                  <Separator />
                </>
              )}
            </>
          )}
          
          {/* Guest Actions */}
          {!isAuthenticated && !isLoading && (
            <div className="p-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                data-testid="mobile-button-sign-in"
                onClick={() => window.location.href = "/api/login"}
              >
                Sign In
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                data-testid="mobile-button-become-member"
                asChild
              >
                <a href="/member-benefits" onClick={handleClose}>Become a Member</a>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                data-testid="mobile-button-become-partner"
                asChild
              >
                <a href="/partners" onClick={handleClose}>Become a Partner</a>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
