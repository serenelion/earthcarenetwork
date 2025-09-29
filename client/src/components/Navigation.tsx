import { Globe, User, ChevronDown, Home, Heart, UserCircle, Building2, Target, BarChart3, Shield, FileText, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getPrimaryRole, hasRole, hasRoleOrHigher } from "@/lib/authUtils";
import { Link } from "wouter";

export default function Navigation() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const userRole = getPrimaryRole(user);

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer" data-testid="nav-logo">
                <Globe className="text-primary text-2xl" />
                <span className="text-xl font-bold text-foreground font-lato">Earth Network</span>
              </div>
            </Link>
            
            {/* Role-based Navigation */}
            {isAuthenticated && !isLoading && (
              <nav className="hidden md:flex space-x-6">
                {/* Common navigation for all authenticated users */}
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-home">
                  Home
                </Link>
                
                {/* Member-specific navigation */}
                {hasRoleOrHigher(user, "member") && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-member-menu">
                        Member <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href="/member/dashboard" data-testid="nav-member-dashboard">
                          <Home className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/favorites" data-testid="nav-favorites">
                          <Heart className="mr-2 h-4 w-4" />
                          Favorites
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" data-testid="nav-profile">
                          <UserCircle className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Enterprise Owner-specific navigation */}
                {hasRole(user, ["enterprise_owner", "admin"]) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-enterprise-menu">
                        Enterprise <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href="/enterprise/dashboard" data-testid="nav-enterprise-dashboard">
                          <Building2 className="mr-2 h-4 w-4" />
                          My Enterprise
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/opportunities" data-testid="nav-opportunities">
                          <Target className="mr-2 h-4 w-4" />
                          Opportunities
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/crm" data-testid="nav-crm">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          CRM
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Admin-specific navigation */}
                {hasRole(user, ["admin"]) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-admin-menu">
                        Admin <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" data-testid="nav-admin-dashboard">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/partner-applications" data-testid="nav-admin-applications">
                          <FileText className="mr-2 h-4 w-4" />
                          Partner Applications
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users" data-testid="nav-admin-users">
                          <Users className="mr-2 h-4 w-4" />
                          Manage Users
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/settings" data-testid="nav-admin-settings">
                          <Settings className="mr-2 h-4 w-4" />
                          System Settings
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Common directories for all authenticated users */}
                <Link href="/enterprises" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-enterprises">
                  Directory
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    {/* Role indicator badge */}
                    <Badge 
                      variant={userRole === "admin" ? "destructive" : userRole === "enterprise_owner" ? "default" : "secondary"}
                      className="hidden sm:inline-flex"
                      data-testid="user-role-badge"
                    >
                      {userRole === "enterprise_owner" ? "Enterprise Owner" : userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </Badge>
                    
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
                    {userRole === "admin" ? (
                      <Button 
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        data-testid="button-admin-cta"
                        asChild
                      >
                        <Link href="/admin/partner-applications">
                          Review Applications
                        </Link>
                      </Button>
                    ) : userRole === "enterprise_owner" ? (
                      <Button 
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        data-testid="button-enterprise-cta"
                        asChild
                      >
                        <Link href="/opportunities">
                          View Opportunities
                        </Link>
                      </Button>
                    ) : (
                      <Button 
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        data-testid="button-member-cta"
                        asChild
                      >
                        <Link href="/enterprises">
                          Explore Directory
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  // Visitor navigation - encourage membership
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 text-sm font-medium"
                    data-testid="button-become-member"
                    asChild
                  >
                    <Link href="/member-benefits">
                      Become a Member
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
