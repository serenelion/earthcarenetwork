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
      '1,000 AI tokens/month'
    ],
    tokenQuotaLimit: 1000,
    isActive: true,
    displayOrder: 0
  },
  {
    id: nanoid(),
    planType: 'crm_basic' as const,
    name: 'CRM Basic',
    description: 'Full CRM access for regenerative entrepreneurs',
    priceMonthly: 4200, // $42 in cents
    priceYearly: 42000, // $420/year (2 months free)
    stripePriceIdMonthly: 'price_crm_basic_monthly', // TODO: Replace with real Stripe price IDs
    stripePriceIdYearly: 'price_crm_basic_yearly',
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
    displayOrder: 1
  },
  {
    id: nanoid(),
    planType: 'build_pro_bundle' as const,
    name: 'Build Pro Bundle',
    description: 'Coming soon - CRM + Spatial Network Build Pro',
    priceMonthly: 9900, // $99 in cents
    priceYearly: 99000, // $990/year
    stripePriceIdMonthly: 'price_build_pro_monthly',
    stripePriceIdYearly: 'price_build_pro_yearly',
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
    isActive: false, // Coming soon
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