import { 
  Compass, 
  UserCircle, 
  Heart, 
  Building2, 
  Sparkles, 
  FileText,
  Users,
  Settings,
  ShieldCheck,
  TrendingUp,
  Layers
} from 'lucide-react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  icon?: any;
}

export interface OnboardingFlow {
  id: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
}

export const visitorFlow: OnboardingFlow = {
  id: 'visitor',
  title: 'Welcome to the Platform',
  description: 'Get started with exploring businesses and opportunities',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome!',
      description: 'Discover businesses committed to sustainability and social impact',
      icon: Compass,
    },
    {
      id: 'platform_tour',
      title: 'Platform Tour',
      description: 'Learn about our directory, opportunities, and community features',
      icon: Layers,
    },
    {
      id: 'explore_directory',
      title: 'Explore the Directory',
      description: 'Browse our curated list of sustainable businesses',
      action: 'View Directory',
      icon: Building2,
    },
  ],
};

export const freeMemberFlow: OnboardingFlow = {
  id: 'free_member',
  title: 'Complete Your Profile',
  description: 'Set up your account and start claiming businesses',
  steps: [
    {
      id: 'profile_setup',
      title: 'Set Up Your Profile',
      description: 'Add your information to personalize your experience',
      action: 'Edit Profile',
      icon: UserCircle,
    },
    {
      id: 'first_claim',
      title: 'Claim Your First Business',
      description: 'Take ownership of your business listing to manage it directly',
      action: 'Claim Business',
      icon: Building2,
    },
    {
      id: 'favorites_intro',
      title: 'Save Your Favorites',
      description: 'Keep track of businesses and opportunities you care about',
      action: 'Browse Directory',
      icon: Heart,
    },
  ],
};

export const crmProFlow: OnboardingFlow = {
  id: 'crm_pro',
  title: 'CRM Pro Setup',
  description: 'Configure your CRM tools and start managing relationships',
  steps: [
    {
      id: 'crm_setup',
      title: 'Set Up Your CRM',
      description: 'Configure your workspace and customize your dashboard',
      action: 'Go to CRM',
      icon: Settings,
    },
    {
      id: 'ai_copilot_config',
      title: 'Configure AI Copilot',
      description: 'Set up your AI assistant to help with relationship management',
      action: 'Configure Copilot',
      icon: Sparkles,
    },
    {
      id: 'first_opportunity',
      title: 'Create Your First Opportunity',
      description: 'Track partnerships, deals, and collaborations',
      action: 'Add Opportunity',
      icon: TrendingUp,
    },
  ],
};

export const buildProFlow: OnboardingFlow = {
  id: 'build_pro',
  title: 'Build Pro Setup',
  description: 'Unlock advanced features and team collaboration',
  steps: [
    {
      id: 'advanced_tour',
      title: 'Advanced Features Tour',
      description: 'Discover powerful tools for team collaboration and automation',
      icon: Layers,
    },
    {
      id: 'team_setup',
      title: 'Invite Your Team',
      description: 'Collaborate with team members and manage permissions',
      action: 'Manage Team',
      icon: Users,
    },
    {
      id: 'integrations',
      title: 'Set Up Integrations',
      description: 'Connect your favorite tools and streamline your workflow',
      action: 'View Integrations',
      icon: Settings,
    },
  ],
};

export const adminFlow: OnboardingFlow = {
  id: 'admin',
  title: 'Admin Dashboard',
  description: 'Master platform administration and moderation tools',
  steps: [
    {
      id: 'platform_overview',
      title: 'Platform Overview',
      description: 'Understand key metrics and administrative capabilities',
      action: 'View Dashboard',
      icon: ShieldCheck,
    },
    {
      id: 'moderation',
      title: 'Moderation Tools',
      description: 'Learn how to review and approve business claims and applications',
      action: 'Review Claims',
      icon: FileText,
    },
    {
      id: 'pledge_tracking',
      title: 'Pledge Tracking',
      description: 'Monitor and manage business sustainability pledges',
      action: 'View Pledges',
      icon: TrendingUp,
    },
    {
      id: 'user_management',
      title: 'User Management',
      description: 'Manage user roles, permissions, and memberships',
      action: 'Manage Users',
      icon: Users,
    },
  ],
};

export const onboardingFlows: Record<string, OnboardingFlow> = {
  visitor: visitorFlow,
  free_member: freeMemberFlow,
  crm_pro: crmProFlow,
  build_pro: buildProFlow,
  admin: adminFlow,
};

export function getFlowById(flowId: string): OnboardingFlow | undefined {
  return onboardingFlows[flowId];
}

export function getFlowSteps(flowId: string): OnboardingStep[] {
  const flow = getFlowById(flowId);
  return flow?.steps || [];
}
