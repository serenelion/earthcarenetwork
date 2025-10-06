import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles, CreditCard, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();

  const sessionId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('session_id');
  }, []);

  const { data: verifiedData, isLoading, error } = useQuery({
    queryKey: ['/api/subscription/verify-session', sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('No session ID provided');
      }
      const response = await fetch(`/api/subscription/verify-session/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to verify session');
      }
      return response.json();
    },
    enabled: !!sessionId,
    retry: 1,
  });

  useEffect(() => {
    if (verifiedData && !error) {
      const timer = setTimeout(() => {
        setLocation('/crm');
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [setLocation, verifiedData, error]);

  if (!sessionId) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4" data-testid="error-missing-session">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Missing Session ID
            </CardTitle>
            <CardDescription>
              No session ID was found in the URL. This page requires a valid session ID to verify your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-error-description">
              If you just completed a payment, please check your email for a confirmation link, or try accessing this page from the payment confirmation.
            </p>
            <div className="flex gap-4">
              <Button asChild data-testid="button-pricing">
                <Link href="/pricing">
                  View Pricing
                </Link>
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

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4" data-testid="loading-state">
        <div className="text-center mb-8">
          <Skeleton className="h-12 w-96 mx-auto mb-4" data-testid="skeleton-title" />
          <Skeleton className="h-6 w-64 mx-auto" data-testid="skeleton-subtitle" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" data-testid="skeleton-card-1" />
              <Skeleton className="h-20 w-full" data-testid="skeleton-card-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4" data-testid="error-state">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Unable to Verify Session
            </CardTitle>
            <CardDescription>
              We encountered an error verifying your subscription session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-error-message">
              {error instanceof Error ? error.message : 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
            </p>
            <div className="flex gap-4">
              <Button onClick={() => window.location.reload()} data-testid="button-retry">
                Retry
              </Button>
              <Button asChild variant="outline" data-testid="button-support">
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

  const planName = verifiedData?.plan?.name || 'Unknown Plan';
  const creditAllocation = verifiedData?.plan?.creditAllocation || 0;
  const creditBalance = verifiedData?.user?.creditBalance || 0;
  const monthlyAllocation = verifiedData?.user?.monthlyAllocation || 0;
  const displayCreditAllocation = (creditAllocation / 100).toFixed(2);
  const displayCredits = (creditBalance / 100).toFixed(2);
  const displayMonthly = (monthlyAllocation / 100).toFixed(2);
  const billingCycle = verifiedData?.subscription?.isYearly ? 'Yearly' : 'Monthly';
  const isNewlyProcessed = verifiedData?.processed === true;
  const isAlreadyProcessed = verifiedData?.alreadyProcessed === true;

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

      {isNewlyProcessed && (
        <Alert className="mb-6 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" data-testid="alert-newly-processed">
          <Sparkles className="h-4 w-4 text-green-600 dark:text-green-500" />
          <AlertTitle className="text-green-600 dark:text-green-500">Subscription Activated!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            Your subscription has been successfully activated and your account has been upgraded.
          </AlertDescription>
        </Alert>
      )}

      {isAlreadyProcessed && (
        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" data-testid="alert-already-processed">
          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          <AlertTitle className="text-blue-600 dark:text-blue-500">Subscription Confirmed</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            Your subscription was already processed and is active.
          </AlertDescription>
        </Alert>
      )}

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
                  {verifiedData?.session?.paymentStatus || verifiedData?.user?.subscriptionStatus || 'Active'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Billing Cycle</span>
                <span className="font-semibold" data-testid="text-billing-cycle">
                  {billingCycle}
                </span>
              </div>
              {verifiedData?.session?.id && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Session ID</span>
                  <span className="font-mono text-xs truncate max-w-[200px]" data-testid="text-session-id" title={verifiedData.session.id}>
                    {verifiedData.session.id}
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
                <span className="text-sm text-muted-foreground">Plan Allocation</span>
                <span className="font-semibold text-2xl text-primary" data-testid="text-plan-allocation">
                  ${displayCreditAllocation}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance</span>
                <span className="font-semibold" data-testid="text-credit-balance">
                  ${displayCredits}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Allocation</span>
                <span className="font-semibold" data-testid="text-monthly-allocation">
                  ${displayMonthly}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2" data-testid="text-credit-info">
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
            <div className="flex items-start gap-3" data-testid="next-step-crm">
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
            <div className="flex items-start gap-3" data-testid="next-step-ai">
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
            <div className="flex items-start gap-3" data-testid="next-step-profiles">
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
