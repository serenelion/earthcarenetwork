import { useEffect } from "react";
import { Globe, User, Search, Command, Settings, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getPrimaryRole } from "@/lib/authUtils";
import { Link, useLocation } from "wouter";
import { getNavigationForRole } from "@/config/navigationConfig";
import { NavigationLink, NavigationDropdown } from "@/components/navigation/NavigationItems";
import { MobileMenu } from "@/components/navigation/MobileMenu";

/**
 * Global navigation component
 * 
 * Provides consistent navigation across the entire application with:
 * - Responsive design (desktop and mobile)
 * - Role-based navigation (free, crm_pro, admin)
 * - Global search functionality (Cmd/Ctrl+K shortcut)
 * - User authentication status and role indicators
 * - Context-aware CTAs
 * 
 * The navigation adapts based on user role:
 * - Unauthenticated: Public links + auth buttons
 * - Free: Public links + CRM + member menu + profile
 * - CRM Pro: Public links + CRM + member menu + profile
 * - Admins: Public links + CRM + member menu + admin menu
 */
export default function Navigation() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const userRole = getPrimaryRole(user);
  const [location, setLocation] = useLocation();
  const navigation = getNavigationForRole(userRole);

  const isInCRM = location.startsWith('/crm');
  const isInDirectory = location === '/' || location.startsWith('/enterprises') || location === '/enterprises';

  /**
   * Keyboard shortcut for global search (Cmd/Ctrl+K)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setLocation('/search');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setLocation]);

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer" data-testid="nav-logo">
                <Globe className="text-primary text-xl sm:text-2xl flex-shrink-0" />
                <span className="text-base sm:text-lg md:text-xl font-bold text-foreground whitespace-nowrap">Earth Care Network</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              {/* Public links (accessible to everyone) */}
              {navigation.publicLinks.map((link) => (
                <NavigationLink key={link.href} item={link} />
              ))}
              
              {/* Authenticated user navigation */}
              {isAuthenticated && !isLoading && (
                <>
                  {/* CRM Link (all authenticated users) */}
                  {navigation.crmLink && (
                    <NavigationLink 
                      item={navigation.crmLink} 
                      withTooltip 
                      tooltipText="Management Dashboard" 
                    />
                  )}
                  
                  {/* Member Menu (all authenticated users) */}
                  {navigation.memberMenu && (
                    <NavigationDropdown
                      label="Member"
                      items={navigation.memberMenu}
                      testId="nav-member-menu"
                    />
                  )}

                  {/* Admin Menu (admin only) */}
                  {navigation.adminMenu && (
                    <NavigationDropdown
                      label="Admin"
                      items={navigation.adminMenu}
                      testId="nav-admin-menu"
                      hasSeparator
                      separatorAfterIndex={4}
                    />
                  )}
                </>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Menu (hamburger icon) */}
            <MobileMenu />
            
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Global Search Trigger */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative h-9 w-9 p-0 md:h-9 md:w-60 md:justify-start md:px-3 md:py-2 text-muted-foreground"
                      data-testid="global-search-trigger"
                      asChild
                    >
                      <Link href="/search">
                        <Search className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Search...</span>
                        <div className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 md:flex">
                          <Command className="h-3 w-3" />
                          <span>K</span>
                        </div>
                      </Link>
                    </Button>
                    
                    {/* Context indicator badge - shows Directory or CRM mode */}
                    {(isInCRM || isInDirectory) && (
                      <Badge 
                        variant={isInCRM ? "default" : "outline"}
                        className="hidden sm:inline-flex"
                        data-testid="context-indicator-badge"
                      >
                        {isInCRM ? "CRM" : "Directory"}
                      </Badge>
                    )}
                    
                    {/* Role indicator badge */}
                    {userRole && (
                      <Badge 
                        variant={userRole === "admin" ? "destructive" : userRole === "crm_pro" ? "default" : "secondary"}
                        className="hidden sm:inline-flex"
                        data-testid="user-role-badge"
                      >
                        {userRole === "crm_pro" ? "CRM Pro" : userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </Badge>
                    )}
                    
                    {/* User menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          data-testid="button-user-menu"
                        >
                          <User className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem data-testid="user-menu-profile">
                          <UserCircle className="mr-2 h-4 w-4" />
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem data-testid="user-menu-settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => window.location.href = "/api/logout"}
                          data-testid="user-menu-logout"
                        >
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* CTA Button based on role */}
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 hidden sm:inline-flex"
                      data-testid={`button-${userRole || 'user'}-cta`}
                      asChild
                    >
                      <Link href={
                        userRole === "admin" ? "/admin/partner-applications" :
                        "/crm"
                      }>
                        {userRole === "admin" ? "Review Applications" : "Open CRM"}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  /* Visitor navigation - search, sign in, become partner, and become member */
                  <div className="flex items-center space-x-2">
                    {/* Global Search Trigger for visitors */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative h-9 w-9 p-0 md:h-9 md:w-48 md:justify-start md:px-3 md:py-2 text-muted-foreground"
                      data-testid="global-search-trigger-visitor"
                      asChild
                    >
                      <Link href="/search">
                        <Search className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Search...</span>
                        <div className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 md:flex">
                          <Command className="h-3 w-3" />
                          <span>K</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-sm font-medium hidden sm:inline-flex"
                      data-testid="button-become-partner"
                      asChild
                    >
                      <Link href="/partners">
                        Become a Partner
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-sm font-medium hidden sm:inline-flex"
                      data-testid="button-become-member"
                      asChild
                    >
                      <Link href="/member-benefits">
                        Become a Member
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      className="text-sm font-medium"
                      data-testid="button-sign-in"
                      onClick={() => window.location.href = "/api/login"}
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
