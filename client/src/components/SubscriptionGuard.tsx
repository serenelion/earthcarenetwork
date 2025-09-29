import { ReactNode } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock } from 'lucide-react';
import { Link } from 'wouter';

interface SubscriptionGuardProps {
  children: ReactNode;
  requiredPlan?: 'free' | 'crm_basic' | 'build_pro_bundle';
  fallback?: ReactNode;
  showUpgrade?: boolean;
  upgradeMessage?: string;
}

export default function SubscriptionGuard({ 
  children, 
  requiredPlan = 'crm_basic',
  fallback,
  showUpgrade = true,
  upgradeMessage
}: SubscriptionGuardProps) {
  const { hasPlanAccess, hasActiveSubscription, userSubscription, isLoadingSubscription } = useSubscription();

  // Show loading state while subscription data loads
  if (isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has required plan access
  const hasAccess = hasPlanAccess(requiredPlan);
  const isActive = hasActiveSubscription();

  // If user has access and active subscription, show content
  if (hasAccess && (requiredPlan === 'free' || isActive)) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  if (showUpgrade) {
    const planName = requiredPlan === 'crm_basic' ? 'CRM Basic' : 
                    requiredPlan === 'build_pro_bundle' ? 'Build Pro Bundle' : 'Premium';
    
    const defaultMessage = `Access to this feature requires a ${planName} subscription.`;
    
    return (
      <Card className="max-w-2xl mx-auto" data-testid="subscription-upgrade-prompt">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Upgrade Required
          </CardTitle>
          <CardDescription className="text-lg">
            {upgradeMessage || defaultMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Current Plan: 
              <Badge className="ml-2" variant="outline">
                {userSubscription?.currentPlanType?.replace('_', ' ').toUpperCase() || 'FREE'}
              </Badge>
            </p>
            {userSubscription?.subscriptionStatus === 'canceled' && (
              <p className="text-sm text-yellow-600">
                Your subscription has been canceled. Reactivate to continue using premium features.
              </p>
            )}
            {userSubscription?.subscriptionStatus === 'past_due' && (
              <p className="text-sm text-red-600">
                Your payment is past due. Please update your payment method.
              </p>
            )}
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button asChild data-testid="upgrade-now-button">
              <Link href="/pricing">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Link>
            </Button>
            {userSubscription?.currentPlanType !== 'free' && (
              <Button variant="outline" asChild data-testid="manage-subscription-button">
                <Link href="/subscription/dashboard">
                  Manage Subscription
                </Link>
              </Button>
            )}
          </div>
          
          {requiredPlan === 'crm_basic' && (
            <div className="text-sm text-muted-foreground">
              <p>CRM Basic includes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Full CRM access</li>
                <li>Opportunity management</li>
                <li>AI-powered lead scoring</li>
                <li>50,000 AI tokens/month</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // If no upgrade prompt, show nothing
  return null;
}

// Convenience hook for checking subscription access
export function useRequireSubscription(requiredPlan: 'free' | 'crm_basic' | 'build_pro_bundle' = 'crm_basic') {
  const { hasPlanAccess, hasActiveSubscription } = useSubscription();
  
  return {
    hasAccess: hasPlanAccess(requiredPlan) && (requiredPlan === 'free' || hasActiveSubscription()),
    hasPlanAccess,
    hasActiveSubscription
  };
}