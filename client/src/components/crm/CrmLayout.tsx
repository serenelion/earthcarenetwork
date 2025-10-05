import { Building, Coins, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CrmSidebar from "./CrmSidebar";
import CrmMobileSidebar from "./CrmMobileSidebar";
import CrmBreadcrumbs from "./CrmBreadcrumbs";
import CreditPurchaseModal from "./CreditPurchaseModal";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [showCreditModal, setShowCreditModal] = useState(false);

  const { data: subscriptionStatus } = useQuery<{
    user: {
      currentPlanType: string;
      creditBalance: number;
      creditLimit: number;
      monthlyAllocation: number;
    };
  }>({
    queryKey: ["/api/subscription/status"],
  });

  const creditBalance = subscriptionStatus?.user?.creditBalance || 0;
  const isLowBalance = creditBalance < 100;

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
              <button
                onClick={() => setShowCreditModal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                data-testid="button-credits-mobile"
              >
                <Coins className={`h-4 w-4 ${isLowBalance ? 'text-orange-500' : 'text-primary'}`} />
                <span className={`text-xs font-medium ${isLowBalance ? 'text-orange-500' : ''}`}>
                  {creditBalance}
                </span>
                {isLowBalance && <AlertCircle className="h-3 w-3 text-orange-500" />}
              </button>
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
              {/* Credit Balance Display */}
              <div 
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg border
                  ${isLowBalance 
                    ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800' 
                    : 'bg-muted border-border'
                  }
                `}
                data-testid="credit-balance-display"
              >
                <Coins className={`h-4 w-4 ${isLowBalance ? 'text-orange-500' : 'text-primary'}`} />
                <div>
                  <p className="text-xs text-muted-foreground">AI Credits</p>
                  <p className={`text-sm font-bold ${isLowBalance ? 'text-orange-500' : ''}`} data-testid="credit-balance-value">
                    {creditBalance.toLocaleString()}
                  </p>
                </div>
                {isLowBalance && (
                  <AlertCircle className="h-4 w-4 text-orange-500" data-testid="low-balance-icon" />
                )}
              </div>
              
              <Button 
                onClick={() => setShowCreditModal(true)}
                size="sm"
                variant="default"
                data-testid="button-buy-credits"
              >
                <Coins className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>

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

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal 
        open={showCreditModal} 
        onOpenChange={setShowCreditModal}
      />
    </div>
  );
}
