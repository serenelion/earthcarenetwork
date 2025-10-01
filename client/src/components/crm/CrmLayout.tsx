import { Building } from "lucide-react";
import CrmSidebar from "./CrmSidebar";
import CrmMobileSidebar from "./CrmMobileSidebar";
import CrmBreadcrumbs from "./CrmBreadcrumbs";
import { useAuth } from "@/hooks/useAuth";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border bg-card" data-testid="crm-sidebar">
        <CrmSidebar />
      </aside>
      
      <div className="flex-1 flex flex-col">
        {/* Mobile Header with menu button */}
        <div className="md:hidden bg-card border-b border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <CrmMobileSidebar />
            <div className="flex items-center space-x-2">
              <Building className="text-primary text-lg" />
              <span className="text-base font-bold text-foreground font-lato" data-testid="crm-title-mobile">
                Earth Network CRM
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold"
                data-testid="user-avatar-mobile"
              >
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Header */}
        <header className="hidden md:block bg-card border-b border-border p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Building className="text-primary text-xl" />
              <span className="text-lg font-bold text-foreground font-lato" data-testid="crm-title-desktop">
                Earth Network CRM
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold"
                  data-testid="user-avatar-desktop"
                >
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="text-sm text-foreground" data-testid="user-name">
                  {user?.firstName || 'Admin User'}
                </span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Breadcrumbs */}
        <div className="px-4 md:px-6 pt-4">
          <CrmBreadcrumbs />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6" data-testid="crm-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
