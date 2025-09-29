import { Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2" data-testid="nav-logo">
              <Globe className="text-primary text-2xl" />
              <span className="text-xl font-bold text-foreground font-lato">Earth Network</span>
            </div>
            
            {/* Show navigation links only for authenticated users */}
            {isAuthenticated && (
              <nav className="hidden md:flex space-x-8">
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="nav-home"
                >
                  Home
                </a>
                <a 
                  href="#categories" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="nav-land-projects"
                >
                  Land Projects
                </a>
                <a 
                  href="#categories" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="nav-capital-sources"
                >
                  Capital Sources
                </a>
                <a 
                  href="#categories" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="nav-open-source"
                >
                  Open Source Tools
                </a>
                <a 
                  href="#categories" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="nav-network-organizers"
                >
                  Network Organizers
                </a>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Show different buttons based on authentication status */}
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  // Authenticated user navigation
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                      data-testid="button-user-menu"
                      onClick={() => window.location.href = "/api/login"}
                    >
                      <User className="h-5 w-5" />
                    </Button>
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium"
                      data-testid="button-add-enterprise-nav"
                      onClick={() => window.location.href = "/api/login"}
                    >
                      Add Enterprise
                    </Button>
                  </>
                ) : (
                  // Visitor navigation - simplified with just "Become a Member" CTA
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 text-sm font-medium"
                    data-testid="button-become-member"
                    onClick={() => window.location.href = "/api/login"}
                  >
                    Become a Member
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
