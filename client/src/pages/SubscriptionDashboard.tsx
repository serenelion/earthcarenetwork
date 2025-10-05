import { useState } from "react";
import { Calendar, CreditCard, AlertCircle, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSubscription, SubscriptionStatusBadge, TokenUsageIndicator } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function SubscriptionDashboard() {
  const { 
    userSubscription, 
    subscription, 
    subscriptionPlans,
    hasActiveSubscription,
    createBillingPortalSession,
    cancelSubscription,
    getRemainingTokens,
    getTokenUsagePercentage,
    isLoadingSubscription 
  } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCanceling, setIsCanceling] = useState(false);

  const handleManageBilling = async () => {
    try {
      const { url } = await createBillingPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      await cancelSubscription();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    } finally {
      setIsCanceling(false);
    }
  };

  if (isLoadingSubscription) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = subscriptionPlans.find(plan => plan.planType === userSubscription?.currentPlanType);
  const isActiveSubscription = hasActiveSubscription();
  const tokenUsagePercentage = getTokenUsagePercentage();
  const remainingTokens = getRemainingTokens();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your Earth Care Network subscription and monitor your usage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <Card data-testid="current-plan-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Current Plan</CardTitle>
                  <SubscriptionStatusBadge />
                </div>
                <CardDescription>
                  Your active subscription plan and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {currentPlan?.name || 'Free Plan'}
                    </h3>
                    <p className="text-muted-foreground">
                      {currentPlan?.description || 'Basic access to Earth Care Network'}
                    </p>
                  </div>
                  {userSubscription?.currentPlanType !== 'free' && (
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${subscription?.isYearly ? 
                          Math.round((subscription.lastPaymentAmount || 0) / 100) : 
                          Math.round((subscription?.lastPaymentAmount || 0) / 100)
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        /{subscription?.isYearly ? 'year' : 'month'}
                      </div>
                    </div>
                  )}
                </div>

                {subscription && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium capitalize">
                        {subscription.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current period ends:</span>
                      <span className="font-medium">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                    {subscription.nextBillingDate && (
                      <div className="flex justify-between">
                        <span>Next billing date:</span>
                        <span className="font-medium">
                          {new Date(subscription.nextBillingDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  {userSubscription?.currentPlanType === 'free' ? (
                    <Button asChild data-testid="upgrade-plan-button">
                      <Link href="/pricing">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleManageBilling}
                        data-testid="manage-billing-button"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Manage Billing
                      </Button>
                      {isActiveSubscription && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline"
                              data-testid="cancel-subscription-button"
                            >
                              Cancel Subscription
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel your subscription? You'll continue to have access 
                                to your current plan until {subscription?.currentPeriodEnd ? 
                                new Date(subscription.currentPeriodEnd).toLocaleDateString() : 
                                'the end of your billing period'}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleCancelSubscription}
                                disabled={isCanceling}
                                data-testid="confirm-cancel-button"
                              >
                                {isCanceling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Cancel Subscription
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plan Features */}
            <Card data-testid="plan-features-card">
              <CardHeader>
                <CardTitle>Plan Features</CardTitle>
                <CardDescription>
                  What's included in your current plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentPlan?.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Available Upgrades */}
            {userSubscription?.currentPlanType === 'free' && (
              <Card data-testid="upgrade-options-card">
                <CardHeader>
                  <CardTitle>Upgrade Options</CardTitle>
                  <CardDescription>
                    Unlock more powerful features for your regenerative work
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">CRM Basic</h4>
                        <div className="text-right">
                          <div className="text-lg font-bold">$42</div>
                          <div className="text-sm text-muted-foreground">/month</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Full CRM access for regenerative entrepreneurs
                      </p>
                      <Button size="sm" asChild>
                        <Link href="/pricing">
                          Upgrade to CRM Basic
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Credits */}
            <Card data-testid="ai-credits-card">
              <CardHeader>
                <CardTitle>AI Credits</CardTitle>
                <CardDescription>
                  Your monthly credit allocation and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TokenUsageIndicator />
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/pricing">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Buy More Credits
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card data-testid="account-info-card">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Member since:</span>
                  <span className="font-medium">
                    {user?.createdAt ? 
                      new Date(user.createdAt).toLocaleDateString() : 
                      'Unknown'
                    }
                  </span>
                </div>
                {subscription?.stripeCustomerId && (
                  <div className="flex justify-between">
                    <span>Customer ID:</span>
                    <span className="font-medium font-mono text-xs">
                      {subscription.stripeCustomerId.substring(0, 20)}...
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support */}
            <Card data-testid="support-card">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Have questions about your subscription or need assistance?
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/docs">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      View Documentation
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}