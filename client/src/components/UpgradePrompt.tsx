import { useState } from "react";
import { Link } from "wouter";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Crown,
  Rocket,
} from "lucide-react";

interface UpgradePromptProps {
  feature: string;
  benefits: string[];
  title?: string;
  variant?: 'crm_pro' | 'build_pro';
}

export default function UpgradePrompt({
  feature,
  benefits,
  title,
  variant = 'crm_pro',
}: UpgradePromptProps) {
  const { createCheckoutSession } = useSubscription();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const planType = variant === 'build_pro' ? 'build_pro_bundle' : 'crm_pro';
      const { url } = await createCheckoutSession(planType, false);
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setIsUpgrading(false);
    }
  };

  const isBuildPro = variant === 'build_pro';
  
  const config = {
    crm_pro: {
      borderColor: 'border-primary/20',
      bgGradient: 'bg-gradient-to-br from-primary/5 via-background to-background',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      badgeBg: 'bg-primary/10',
      badgeText: 'text-primary',
      badgeBorder: 'border-primary/20',
      badgeLabel: 'Free Plan',
      icon: Lock,
      checkColor: 'text-primary',
      buttonBg: 'bg-primary hover:bg-primary/90',
      defaultTitle: 'Unlock Full CRM Capabilities',
      description: `Upgrade to CRM Pro to unlock ${feature} and powerful features`,
      ctaText: 'Upgrade to CRM Pro - $42/month',
      additionalBenefits: [
        { icon: Zap, color: 'text-yellow-500', text: <><strong>$42 in AI credits/month</strong> for lead scoring & insights</> },
        { icon: Shield, color: 'text-blue-500', text: 'Priority support & advanced security' }
      ]
    },
    build_pro: {
      borderColor: 'border-purple-500/30',
      bgGradient: 'bg-gradient-to-br from-purple-500/10 via-background to-background',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-500/20',
      badgeText: 'text-purple-700 dark:text-purple-300',
      badgeBorder: 'border-purple-500/30',
      badgeLabel: 'CRM Pro',
      icon: Crown,
      checkColor: 'text-purple-600 dark:text-purple-400',
      buttonBg: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white',
      defaultTitle: 'Ready for Advanced Features?',
      description: `Upgrade to Build Pro Bundle for ${feature} and premium capabilities`,
      ctaText: 'Upgrade to Build Pro - +$46.11/month',
      additionalBenefits: [
        { icon: Zap, color: 'text-yellow-500', text: <><strong>Double your AI credits</strong> - $88.11/month for advanced insights</> },
        { icon: Rocket, color: 'text-purple-600 dark:text-purple-400', text: 'Dedicated account manager & custom integrations' }
      ]
    }
  };

  const currentConfig = config[variant];
  const Icon = currentConfig.icon;
  const displayTitle = title || currentConfig.defaultTitle;

  return (
    <Card className={`border-2 ${currentConfig.borderColor} ${currentConfig.bgGradient}`} data-testid={`upgrade-prompt-${variant}`}>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 ${currentConfig.iconBg} rounded-lg`}>
            <Icon className={`w-5 h-5 ${currentConfig.iconColor}`} />
          </div>
          <Badge variant="secondary" className={`${currentConfig.badgeBg} ${currentConfig.badgeText} ${currentConfig.badgeBorder}`}>
            <Sparkles className="w-3 h-3 mr-1" />
            {currentConfig.badgeLabel}
          </Badge>
        </div>
        <CardTitle className="text-2xl font-lato">{displayTitle}</CardTitle>
        <CardDescription className="text-base">
          {currentConfig.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {isBuildPro ? 'Everything in CRM Pro, plus:' : 'With CRM Pro, you get:'}
          </p>
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className={`w-5 h-5 ${currentConfig.checkColor} flex-shrink-0 mt-0.5`} />
                <span className="text-sm text-foreground">{benefit}</span>
              </li>
            ))}
            {currentConfig.additionalBenefits.map((benefit, index) => {
              const BenefitIcon = benefit.icon;
              return (
                <li key={`extra-${index}`} className="flex items-start gap-2">
                  <BenefitIcon className={`w-5 h-5 ${benefit.color} flex-shrink-0 mt-0.5`} />
                  <span className="text-sm text-foreground">{benefit.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="pt-4 border-t">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className={`flex-1 ${currentConfig.buttonBg}`}
              data-testid={`button-upgrade-to-${variant === 'build_pro' ? 'build-pro' : 'crm-pro'}`}
            >
              {isUpgrading ? (
                "Loading..."
              ) : (
                <>
                  {currentConfig.ctaText}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <Button
              variant="outline"
              asChild
              className="flex-1 sm:flex-initial"
              data-testid="button-compare-plans"
            >
              <Link href="/pricing">
                Compare Plans
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            {isBuildPro ? 'Unlock premium features • Advanced support included' : 'Cancel anytime • No long-term commitment'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
