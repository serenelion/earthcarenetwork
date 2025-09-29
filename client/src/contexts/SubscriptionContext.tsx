import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Types for subscription data
export interface SubscriptionPlan {
  id: string;
  planType: 'free' | 'crm_basic' | 'build_pro_bundle';
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number | null;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  features: string[];
  tokenQuotaLimit: number;
  isActive: boolean;
  displayOrder: number;
}

export interface UserSubscriptionStatus {
  currentPlanType: 'free' | 'crm_basic' | 'build_pro_bundle';
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | null;
  subscriptionCurrentPeriodEnd: string | null;
  tokenUsageThisMonth: number;
  tokenQuotaLimit: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string;
  stripePriceId: string;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart: string | null;
  trialEnd: string | null;
  cancelAt: string | null;
  canceledAt: string | null;
  isYearly: boolean;
  lastPaymentAmount: number | null;
  lastPaymentAt: string | null;
  nextBillingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionContextType {
  // Data
  subscriptionPlans: SubscriptionPlan[];
  userSubscription: UserSubscriptionStatus | null;
  subscription: Subscription | null;
  
  // Loading states
  isLoadingPlans: boolean;
  isLoadingSubscription: boolean;
  
  // Actions
  createCheckoutSession: (planType: string, isYearly: boolean) => Promise<{ url: string; sessionId: string }>;
  createBillingPortalSession: () => Promise<{ url: string }>;
  cancelSubscription: () => Promise<void>;
  
  // Helpers
  hasActiveSubscription: () => boolean;
  hasPlanAccess: (planType: 'free' | 'crm_basic' | 'build_pro_bundle') => boolean;
  canAccessCRM: () => boolean;
  getRemainingTokens: () => number;
  getTokenUsagePercentage: () => number;
  
  // Refetch functions
  refetchSubscriptionStatus: () => void;
  refetchPlans: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscription plans
  const { 
    data: subscriptionPlans = [], 
    isLoading: isLoadingPlans,
    refetch: refetchPlans
  } = useQuery({
    queryKey: ['/api/subscription-plans'],
    enabled: true,
  });

  // Fetch user subscription status
  const { 
    data: subscriptionData, 
    isLoading: isLoadingSubscription,
    refetch: refetchSubscriptionStatus
  } = useQuery({
    queryKey: ['/api/subscription/status'],
    enabled: isAuthenticated && !!user,
  });

  const userSubscription = subscriptionData?.user || null;
  const subscription = subscriptionData?.subscription || null;

  // Create checkout session mutation
  const createCheckoutMutation = useMutation({
    mutationFn: async (data: { planType: string; isYearly: boolean }) => {
      const response = await apiRequest('POST', '/api/subscription/create-checkout', data);
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    }
  });

  // Create billing portal session mutation
  const createBillingPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/billing-portal', {});
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Billing Portal Error",
        description: error.message || "Failed to access billing portal",
        variant: "destructive",
      });
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/cancel', {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Canceled",
        description: data.message || "Your subscription has been canceled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  });

  // Helper functions
  const hasActiveSubscription = (): boolean => {
    return userSubscription?.subscriptionStatus === 'active' || 
           userSubscription?.subscriptionStatus === 'trial';
  };

  const hasPlanAccess = (planType: 'free' | 'crm_basic' | 'build_pro_bundle'): boolean => {
    if (!userSubscription) return planType === 'free';
    
    const userPlanType = userSubscription.currentPlanType;
    
    // Free access
    if (planType === 'free') return true;
    
    // CRM Basic access
    if (planType === 'crm_basic') {
      return userPlanType === 'crm_basic' || userPlanType === 'build_pro_bundle';
    }
    
    // Build Pro Bundle access
    if (planType === 'build_pro_bundle') {
      return userPlanType === 'build_pro_bundle';
    }
    
    return false;
  };

  const canAccessCRM = (): boolean => {
    return hasPlanAccess('crm_basic') && hasActiveSubscription();
  };

  const getRemainingTokens = (): number => {
    if (!userSubscription) return 0;
    return Math.max(0, userSubscription.tokenQuotaLimit - userSubscription.tokenUsageThisMonth);
  };

  const getTokenUsagePercentage = (): number => {
    if (!userSubscription || userSubscription.tokenQuotaLimit === 0) return 0;
    return (userSubscription.tokenUsageThisMonth / userSubscription.tokenQuotaLimit) * 100;
  };

  // Action functions
  const createCheckoutSession = async (planType: string, isYearly: boolean = false) => {
    const result = await createCheckoutMutation.mutateAsync({ planType, isYearly });
    return result;
  };

  const createBillingPortalSession = async () => {
    const result = await createBillingPortalMutation.mutateAsync();
    return result;
  };

  const cancelSubscription = async () => {
    await cancelSubscriptionMutation.mutateAsync();
  };

  const contextValue: SubscriptionContextType = {
    // Data
    subscriptionPlans,
    userSubscription,
    subscription,
    
    // Loading states
    isLoadingPlans,
    isLoadingSubscription,
    
    // Actions
    createCheckoutSession,
    createBillingPortalSession,
    cancelSubscription,
    
    // Helpers
    hasActiveSubscription,
    hasPlanAccess,
    canAccessCRM,
    getRemainingTokens,
    getTokenUsagePercentage,
    
    // Refetch functions
    refetchSubscriptionStatus,
    refetchPlans,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Subscription status badge component
export function SubscriptionStatusBadge() {
  const { userSubscription, hasActiveSubscription } = useSubscription();
  
  if (!userSubscription) return null;
  
  const { currentPlanType, subscriptionStatus } = userSubscription;
  
  let badgeColor = "bg-gray-100 text-gray-800";
  let statusText = currentPlanType.replace('_', ' ').toUpperCase();
  
  if (hasActiveSubscription()) {
    badgeColor = "bg-green-100 text-green-800";
  } else if (subscriptionStatus === 'past_due') {
    badgeColor = "bg-yellow-100 text-yellow-800";
    statusText = "PAST DUE";
  } else if (subscriptionStatus === 'canceled') {
    badgeColor = "bg-red-100 text-red-800";
    statusText = "CANCELED";
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`} data-testid="subscription-status-badge">
      {statusText}
    </span>
  );
}

// Token usage indicator component
export function TokenUsageIndicator() {
  const { userSubscription, getTokenUsagePercentage, getRemainingTokens } = useSubscription();
  
  if (!userSubscription) return null;
  
  const percentage = getTokenUsagePercentage();
  const remaining = getRemainingTokens();
  const isNearLimit = percentage > 80;
  
  return (
    <div className="space-y-2" data-testid="token-usage-indicator">
      <div className="flex justify-between items-center text-sm">
        <span>AI Tokens</span>
        <span className={isNearLimit ? 'text-yellow-600' : 'text-muted-foreground'}>
          {remaining.toLocaleString()} remaining
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${
            isNearLimit ? 'bg-yellow-500' : percentage > 95 ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="text-xs text-yellow-600">
          You're approaching your monthly token limit. Consider upgrading your plan.
        </p>
      )}
    </div>
  );
}