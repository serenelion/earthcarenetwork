// Script to seed subscription plans for Earth Care Network

import { subscriptionPlans } from '@shared/schema';
import { nanoid } from 'nanoid';
import { db } from './db';

const subscriptionPlanData = [
  {
    id: nanoid(),
    planType: 'free' as const,
    name: 'Free',
    description: 'Perfect for exploring the Earth Care Network',
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    features: [
      'Browse enterprise directory',
      'Access member benefits', 
      'Basic search functionality',
      'Community access',
      'Claim 1 enterprise profile',
      '$0.10 AI credits/month'
    ],
    creditAllocation: 10, // $0.10 in cents
    isActive: true,
    displayOrder: 0
  },
  {
    id: nanoid(),
    planType: 'crm_basic' as const,
    name: 'CRM Basic',
    description: 'Full CRM access + AI Sales Autopilot',
    priceMonthly: 4200, // $42 in cents
    priceYearly: 42000, // $420/year (2 months free)
    stripePriceIdMonthly: 'price_crm_basic_monthly', // TODO: Replace with real Stripe price IDs
    stripePriceIdYearly: 'price_crm_basic_yearly',
    features: [
      'Everything in Free',
      'Full CRM access',
      'Unlimited enterprise profiles',
      'Opportunity management',
      'Lead scoring & AI insights',
      'Advanced search & filters',
      'Task management',
      'Contact relationship mapping',
      '$42 AI credits/month',
      'Top up credits anytime',
      'Priority support'
    ],
    creditAllocation: 4200, // $42 in cents
    isActive: true,
    displayOrder: 1
  },
  {
    id: nanoid(),
    planType: 'build_pro_bundle' as const,
    name: 'Build Pro Bundle',
    description: 'CRM + Spatial Network Build Pro',
    priceMonthly: 8811, // $88.11 in cents
    priceYearly: 88110, // $881.10/year (2 months free)
    stripePriceIdMonthly: 'price_build_pro_monthly',
    stripePriceIdYearly: 'price_build_pro_yearly',
    features: [
      'Everything in CRM Basic',
      'Spatial Network Build Pro access',
      'Advanced project management',
      'Geographic visualization tools',
      'Team collaboration features',
      'Custom integrations',
      '$88.11 AI credits/month',
      'Top up credits anytime',
      'Dedicated account manager'
    ],
    creditAllocation: 8811, // $88.11 in cents
    isActive: true,
    displayOrder: 2
  }
];

async function seedSubscriptionPlans() {
  try {
    console.log('Seeding subscription plans...');
    
    for (const plan of subscriptionPlanData) {
      await db.insert(subscriptionPlans).values(plan).onConflictDoNothing();
      console.log(`✅ Seeded plan: ${plan.name}`);
    }
    
    console.log('✅ Subscription plans seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  }
}

// Stand-alone seeding script version (exits process)
async function runSeedingScript() {
  try {
    await seedSubscriptionPlans();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeedingScript();
}

export { seedSubscriptionPlans, subscriptionPlanData };