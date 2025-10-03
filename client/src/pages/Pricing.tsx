import { useState } from "react";
import { Check, Crown, Zap, Users, BarChart3, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const { subscriptionPlans, userSubscription, createCheckoutSession, isLoadingPlans } = useSubscription();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = async (planType: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade your subscription.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { url } = await createCheckoutSession(planType, isYearly);
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    }
  };

  // Default plans if not loaded from backend yet
  const defaultPlans = [
    {
      id: 'free',
      planType: 'free' as const,
      name: 'Free',
      description: 'Claim your project and manage your profile',
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        'Browse enterprise directory',
        'Claim a project profile',
        'Edit your profile information',
        'Basic search functionality',
        'Community access',
        '1,000 AI tokens/month'
      ],
      tokenQuotaLimit: 1000,
      isActive: true,
      displayOrder: 0,
      stripePriceIdMonthly: null,
      stripePriceIdYearly: null
    },
    {
      id: 'crm_basic',
      planType: 'crm_basic' as const,
      name: 'CRM Basic',
      description: 'Full CRM access for regenerative entrepreneurs',
      priceMonthly: 4200, // $42 in cents
      priceYearly: 42000, // $420/year (2 months free)
      features: [
        'Everything in Free',
        'Full CRM access',
        'Opportunity management',
        'Lead scoring & AI insights',
        'Advanced search & filters',
        'Task management',
        'Contact relationship mapping',
        '50,000 AI tokens/month',
        'Priority support'
      ],
      tokenQuotaLimit: 50000,
      isActive: true,
      displayOrder: 1,
      stripePriceIdMonthly: 'price_crm_basic_monthly',
      stripePriceIdYearly: 'price_crm_basic_yearly'
    },
    {
      id: 'build_pro_bundle',
      planType: 'build_pro_bundle' as const,
      name: 'Build Pro Bundle',
      description: 'CRM + Spatial Network Build Pro',
      priceMonthly: 8811, // $88.11 in cents
      priceYearly: 88110, // $881.10/year
      features: [
        'Everything in CRM Basic',
        'Spatial Network Build Pro access',
        'Advanced project management',
        'Geographic visualization tools',
        'Team collaboration features',
        'Custom integrations',
        'Unlimited AI tokens',
        'Dedicated account manager'
      ],
      tokenQuotaLimit: 1000000,
      isActive: true,
      displayOrder: 2,
      stripePriceIdMonthly: 'price_build_pro_monthly',
      stripePriceIdYearly: 'price_build_pro_yearly'
    }
  ];

  const plans = subscriptionPlans.length > 0 ? subscriptionPlans : defaultPlans;
  const currentPlanType = userSubscription?.currentPlanType || 'free';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Free & Open Source CRM for Regenerative Enterprise
          </h1>
          <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Earth Care Network is completely free and open source. Self-host it yourself or 
            choose professional hosting with CRM features for regenerative enterprises.
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-2xl mx-auto">
            💚 All code is open source and available for self-hosting at no cost
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={isYearly ? 'text-muted-foreground' : 'font-medium'}>Monthly</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              data-testid="billing-toggle"
            />
            <span className={isYearly ? 'font-medium' : 'text-muted-foreground'}>
              Yearly <Badge className="ml-2 bg-green-100 text-green-800">Save 17%</Badge>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = isYearly && plan.priceYearly ? plan.priceYearly : plan.priceMonthly;
            const yearlyPrice = plan.priceYearly || 0;
            const monthlyPrice = plan.priceMonthly || 0;
            const yearlyMonthlyEquivalent = yearlyPrice / 12;
            const savings = monthlyPrice > 0 ? ((monthlyPrice - yearlyMonthlyEquivalent) / monthlyPrice) * 100 : 0;
            
            const isCurrentPlan = plan.planType === currentPlanType;
            const isPopular = plan.planType === 'crm_basic';
            const isFree = plan.planType === 'free';
            const isComingSoon = !plan.isActive;

            return (
              <Card 
                key={plan.id} 
                className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
                data-testid={`plan-card-${plan.planType}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      <Crown className="w-4 h-4 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-blue-500 text-white px-3 py-1">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {isFree && <Users className="w-8 h-8 text-green-600" />}
                    {plan.planType === 'crm_basic' && <BarChart3 className="w-8 h-8 text-blue-600" />}
                    {plan.planType === 'build_pro_bundle' && <Zap className="w-8 h-8 text-purple-600" />}
                  </div>
                  
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    {isFree ? (
                      <div className="text-3xl font-bold">Free</div>
                    ) : (
                      <div>
                        <div className="text-3xl font-bold">
                          ${(price / 100).toFixed(0)}
                          <span className="text-lg text-muted-foreground">
                            /{isYearly ? 'year' : 'month'}
                          </span>
                        </div>
                        {isYearly && savings > 0 && (
                          <div className="text-sm text-green-600">
                            Save {savings.toFixed(0)}% annually
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Separator className="my-4" />
                  
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>AI Tokens/month:</span>
                      <span className="font-medium">
                        {plan.tokenQuotaLimit >= 1000000 ? 'Unlimited' : plan.tokenQuotaLimit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  {isFree ? (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      asChild
                      data-testid="free-plan-button"
                    >
                      <Link href="/register">
                        Get Started Free
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  ) : isComingSoon ? (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      disabled
                      data-testid="coming-soon-button"
                    >
                      Coming Soon
                    </Button>
                  ) : isCurrentPlan ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      asChild
                      data-testid="manage-subscription-button"
                    >
                      <Link href="/subscription/dashboard">
                        Manage Subscription
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      onClick={() => handleUpgrade(plan.planType)}
                      disabled={isLoadingPlans}
                      data-testid={`upgrade-${plan.planType}-button`}
                    >
                      Upgrade to {plan.name}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-muted/50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">Is Earth Care Network really free and open source?</h3>
              <p className="text-muted-foreground">
                Yes! The entire Earth Care Network platform is completely free and open source. Anyone can 
                self-host the application at no cost. Our paid plans are for professionally hosted instances 
                with additional CRM features and support.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">What's included in the CRM Basic plan?</h3>
              <p className="text-muted-foreground">
                CRM Basic gives you full access to our professionally hosted platform designed specifically 
                for regenerative enterprises. This includes opportunity management, lead scoring, AI insights, 
                advanced search, task management, and contact relationship mapping.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">How do AI tokens work?</h3>
              <p className="text-muted-foreground">
                AI tokens are used for features like lead scoring, content generation, and copilot assistance. 
                The free tier includes 1,000 tokens per month, while CRM Basic includes 50,000 tokens - 
                enough for extensive AI-powered CRM operations.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Can I self-host instead of using paid hosting?</h3>
              <p className="text-muted-foreground">
                Absolutely! Earth Care Network is open source, so you can self-host the entire platform 
                for free on your own infrastructure. Paid plans are for those who prefer managed hosting 
                with professional support and additional CRM features.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">What's the Build Pro Bundle?</h3>
              <p className="text-muted-foreground">
                The Build Pro Bundle includes everything in CRM Basic plus access to Spatial Network Build Pro 
                for advanced project management and geographic visualization tools. Perfect for teams managing 
                complex regenerative projects.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll continue to have access to 
                your plan features until the end of your current billing period.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Trust Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="w-16 h-16 mx-auto text-green-600 mb-6" />
          <h2 className="text-3xl font-bold mb-4">Secure & Trusted</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Your data and payments are protected with industry-standard security measures.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Stripe Payments</h3>
              <p className="text-muted-foreground">
                All payments processed securely through Stripe's PCI-compliant infrastructure.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data Encryption</h3>
              <p className="text-muted-foreground">
                Your data is encrypted in transit and at rest using industry-standard protocols.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Privacy First</h3>
              <p className="text-muted-foreground">
                We never sell your data. Your information is used only to provide our services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}