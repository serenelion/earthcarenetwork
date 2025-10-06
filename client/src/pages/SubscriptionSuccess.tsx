import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();

  // Fetch user subscription status
  const { data: subscriptionData, isLoading, error } = useQuery({
    queryKey: ['/api/subscription/status'],
  });

  useEffect(() => {
    // Redirect to dashboard after 10 seconds
    const timer = setTimeout(() => {
      setLocation('/crm');
    }, 10000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <Skeleton className="h-12 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-64 mx-auto" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-500">Unable to Load Subscription Details</CardTitle>
            <CardDescription>
              We encountered an error loading your subscription information. Your subscription was successful, but we couldn't fetch the details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please try refreshing the page or visit your subscription dashboard.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => window.location.reload()} data-testid="button-retry">
                Retry
              </Button>
              <Button asChild variant="outline" data-testid="button-dashboard">
                <Link href="/subscription/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planName = subscriptionData?.user?.currentPlanType === 'build_pro_bundle' 
    ? 'Build Pro Bundle' 
    : subscriptionData?.user?.currentPlanType === 'crm_pro'
    ? 'CRM Pro'
    : subscriptionData?.user?.currentPlanType === 'crm_basic'
    ? 'CRM Basic'
    : 'Free';

  const creditBalance = subscriptionData?.user?.creditBalance || 0;
  const monthlyAllocation = subscriptionData?.user?.monthlyAllocation || 0;
  const displayCredits = (creditBalance / 100).toFixed(2);
  const displayMonthly = (monthlyAllocation / 100).toFixed(2);

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-8" data-testid="subscription-success-page">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
            <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" data-testid="icon-success" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-green-600 dark:text-green-500 mb-2" data-testid="text-success-title">
          Subscription Successful!
        </h1>
        <p className="text-xl text-muted-foreground" data-testid="text-success-subtitle">
          Welcome to {planName}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card data-testid="card-plan-details">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Plan
            </CardTitle>
            <CardDescription>Active subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Plan Type</span>
                <span className="font-semibold" data-testid="text-plan-type">{planName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="font-semibold text-green-600 dark:text-green-500" data-testid="text-status">
                  {subscriptionData?.user?.subscriptionStatus || 'Active'}
                </span>
              </div>
              {subscriptionData?.subscription?.isYearly !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Billing Cycle</span>
                  <span className="font-semibold" data-testid="text-billing-cycle">
                    {subscriptionData.subscription.isYearly ? 'Yearly' : 'Monthly'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-credits">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              AI Credits
            </CardTitle>
            <CardDescription>Your available credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance</span>
                <span className="font-semibold text-2xl" data-testid="text-credit-balance">
                  ${displayCredits}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Allocation</span>
                <span className="font-semibold" data-testid="text-monthly-allocation">
                  ${displayMonthly}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Credits reset automatically each month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8" data-testid="card-next-steps">
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>Get started with your new subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 mt-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Access the Full CRM</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your enterprises, contacts, opportunities, and tasks
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 mt-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Use AI Features</h3>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered insights, lead scoring, and recommendations
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 mt-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Unlimited Enterprise Profiles</h3>
                <p className="text-sm text-muted-foreground">
                  Claim and manage unlimited enterprise profiles
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4" data-testid="container-actions">
        <Button asChild size="lg" data-testid="button-start-crm">
          <Link href="/crm">
            Start Using CRM
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" data-testid="button-view-dashboard">
          <Link href="/subscription/dashboard">
            View Subscription Dashboard
          </Link>
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8" data-testid="text-auto-redirect">
        You'll be automatically redirected to the CRM in a few seconds...
      </p>
    </div>
  );
}
