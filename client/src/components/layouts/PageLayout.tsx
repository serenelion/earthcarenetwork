import { Building } from "lucide-react";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  showSidebar?: boolean;
  headerActions?: ReactNode;
}

export default function PageLayout({
  title,
  description,
  children,
  showSidebar = true,
  headerActions,
}: PageLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {showSidebar && <Sidebar />}
      
      <div className="flex-1">
        {/* Mobile Header */}
        <div className="md:hidden bg-card border-b border-border">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              {showSidebar && <MobileMenuButton />}
              <div className="flex items-center space-x-2">
                <Building className="text-primary text-lg" />
                <span className="text-base font-bold text-foreground font-lato">Earth Network CRM</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
              </div>
            </div>
            
            {headerActions && (
              <div className="flex space-x-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <header className="hidden md:block bg-card border-b border-border">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Building className="text-primary text-xl" />
                  <span className="text-lg font-bold text-foreground font-lato">Earth Network CRM</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {headerActions}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <span className="text-sm text-foreground">{user?.firstName || 'Admin User'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 font-lato">{title}</h1>
            {description && (
              <p className="text-sm md:text-base text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
}
