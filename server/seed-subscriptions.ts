// Script to seed subscription plans for Earth Care Network

import { subscriptionPlans } from '@shared/schema';
import { nanoid } from 'nanoid';
import { db } from './db';
import Stripe from 'stripe';

// Initialize Stripe if configured
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
}

interface StripePriceIds {
  monthly: string | null;
  yearly: string | null;
}

/**
 * Create Stripe test products and prices for development/testing
 */
async function createStripeTestPrices(
  planName: string,
  description: string,
  priceMonthly: number,
  priceYearly: number
): Promise<StripePriceIds> {
  if (!stripe) {
    console.log(`⚠️  Stripe not configured - skipping price creation for ${planName}`);
    return { monthly: null, yearly: null };
  }

  const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
  
  if (!isTestMode) {
    console.log(`ℹ️  Production mode detected for ${planName} - using environment variables`);
    return { monthly: null, yearly: null };
  }

  try {
    console.log(`🔧 Creating Stripe test product and prices for ${planName}...`);
    
    // Create the product
    const product = await stripe.products.create({
      name: planName,
      description: description,
    });
    console.log(`  ✅ Created product: ${product.id}`);

    // Create monthly price (only if price is > 0)
    let monthlyPriceId: string | null = null;
    if (priceMonthly > 0) {
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: priceMonthly,
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      monthlyPriceId = monthlyPrice.id;
      console.log(`  ✅ Created monthly price: ${monthlyPriceId} ($${(priceMonthly / 100).toFixed(2)}/month)`);
    }

    // Create yearly price (only if price is > 0)
    let yearlyPriceId: string | null = null;
    if (priceYearly > 0) {
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: priceYearly,
        currency: 'usd',
        recurring: { interval: 'year' },
      });
      yearlyPriceId = yearlyPrice.id;
      console.log(`  ✅ Created yearly price: ${yearlyPriceId} ($${(priceYearly / 100).toFixed(2)}/year)`);
    }

    return {
      monthly: monthlyPriceId,
      yearly: yearlyPriceId,
    };
  } catch (error) {
    console.error(`❌ Error creating Stripe test prices for ${planName}:`, error);
    return { monthly: null, yearly: null };
  }
}

/**
 * Get price IDs from environment variables (for production use)
 */
function getPriceIdsFromEnv(planType: string): StripePriceIds {
  const envPrefix = planType.toUpperCase().replace(/_/g, '_');
  return {
    monthly: process.env[`STRIPE_${envPrefix}_MONTHLY_PRICE_ID`] || null,
    yearly: process.env[`STRIPE_${envPrefix}_YEARLY_PRICE_ID`] || null,
  };
}

async function seedSubscriptionPlans() {
  try {
    console.log('🌱 Seeding subscription plans...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY;
    
    if (!isStripeConfigured) {
      console.log('⚠️  STRIPE_SECRET_KEY not configured - price IDs will be set to null');
    } else if (isTestMode) {
      console.log('🧪 Test mode detected - will create test products and prices in Stripe');
    } else {
      console.log('🏭 Production mode detected - will use environment variable price IDs');
    }
    
    // Free plan - no Stripe prices needed
    const freePlan = {
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
    };
    
    await db.insert(subscriptionPlans)
      .values(freePlan)
      .onConflictDoUpdate({
        target: subscriptionPlans.planType,
        set: {
          name: freePlan.name,
          description: freePlan.description,
          priceMonthly: freePlan.priceMonthly,
          priceYearly: freePlan.priceYearly,
          stripePriceIdMonthly: freePlan.stripePriceIdMonthly,
          stripePriceIdYearly: freePlan.stripePriceIdYearly,
          features: freePlan.features,
          creditAllocation: freePlan.creditAllocation,
          isActive: freePlan.isActive,
          displayOrder: freePlan.displayOrder,
        }
      });
    console.log(`✅ Seeded plan: ${freePlan.name}`);
    
    // CRM Pro plan
    const crmProPriceMonthly = 4200; // $42 in cents
    const crmProPriceYearly = 42000; // $420/year
    
    let crmProPriceIds: StripePriceIds;
    if (isTestMode && isStripeConfigured) {
      crmProPriceIds = await createStripeTestPrices(
        'CRM Pro',
        'Self-hosted CRM + AI Sales Autopilot',
        crmProPriceMonthly,
        crmProPriceYearly
      );
    } else if (isStripeConfigured) {
      crmProPriceIds = getPriceIdsFromEnv('CRM_PRO');
      if (!crmProPriceIds.monthly || !crmProPriceIds.yearly) {
        console.log('⚠️  CRM Pro price IDs not found in environment variables');
        console.log('   Set STRIPE_CRM_PRO_MONTHLY_PRICE_ID and STRIPE_CRM_PRO_YEARLY_PRICE_ID');
      }
    } else {
      crmProPriceIds = { monthly: null, yearly: null };
    }
    
    const crmProPlan = {
      planType: 'crm_pro' as const,
      name: 'CRM Pro',
      description: 'Self-hosted CRM + AI Sales Autopilot',
      priceMonthly: crmProPriceMonthly,
      priceYearly: crmProPriceYearly,
      stripePriceIdMonthly: crmProPriceIds.monthly,
      stripePriceIdYearly: crmProPriceIds.yearly,
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
      creditAllocation: crmProPriceMonthly,
      isActive: true,
      displayOrder: 1
    };
    
    await db.insert(subscriptionPlans)
      .values(crmProPlan)
      .onConflictDoUpdate({
        target: subscriptionPlans.planType,
        set: {
          name: crmProPlan.name,
          description: crmProPlan.description,
          priceMonthly: crmProPlan.priceMonthly,
          priceYearly: crmProPlan.priceYearly,
          stripePriceIdMonthly: crmProPlan.stripePriceIdMonthly,
          stripePriceIdYearly: crmProPlan.stripePriceIdYearly,
          features: crmProPlan.features,
          creditAllocation: crmProPlan.creditAllocation,
          isActive: crmProPlan.isActive,
          displayOrder: crmProPlan.displayOrder,
        }
      });
    console.log(`✅ Seeded plan: ${crmProPlan.name}`);
    
    // Build Pro Bundle plan
    const buildProPriceMonthly = 8811; // $88.11 in cents
    const buildProPriceYearly = 88110; // $881.10/year
    
    let buildProPriceIds: StripePriceIds;
    if (isTestMode && isStripeConfigured) {
      buildProPriceIds = await createStripeTestPrices(
        'Build Pro Bundle',
        'CRM + Spatial Network Build Pro',
        buildProPriceMonthly,
        buildProPriceYearly
      );
    } else if (isStripeConfigured) {
      buildProPriceIds = getPriceIdsFromEnv('BUILD_PRO_BUNDLE');
      if (!buildProPriceIds.monthly || !buildProPriceIds.yearly) {
        console.log('⚠️  Build Pro Bundle price IDs not found in environment variables');
        console.log('   Set STRIPE_BUILD_PRO_BUNDLE_MONTHLY_PRICE_ID and STRIPE_BUILD_PRO_BUNDLE_YEARLY_PRICE_ID');
      }
    } else {
      buildProPriceIds = { monthly: null, yearly: null };
    }
    
    const buildProPlan = {
      planType: 'build_pro_bundle' as const,
      name: 'Build Pro Bundle',
      description: 'CRM + Spatial Network Build Pro',
      priceMonthly: buildProPriceMonthly,
      priceYearly: buildProPriceYearly,
      stripePriceIdMonthly: buildProPriceIds.monthly,
      stripePriceIdYearly: buildProPriceIds.yearly,
      features: [
        'Everything in CRM Pro',
        'Spatial Network Build Pro access',
        'Advanced project management',
        'Geographic visualization tools',
        'Team collaboration features',
        'Custom integrations',
        '$88.11 AI credits/month',
        'Top up credits anytime',
        'Dedicated account manager'
      ],
      creditAllocation: buildProPriceMonthly,
      isActive: true,
      displayOrder: 2
    };
    
    await db.insert(subscriptionPlans)
      .values(buildProPlan)
      .onConflictDoUpdate({
        target: subscriptionPlans.planType,
        set: {
          name: buildProPlan.name,
          description: buildProPlan.description,
          priceMonthly: buildProPlan.priceMonthly,
          priceYearly: buildProPlan.priceYearly,
          stripePriceIdMonthly: buildProPlan.stripePriceIdMonthly,
          stripePriceIdYearly: buildProPlan.stripePriceIdYearly,
          features: buildProPlan.features,
          creditAllocation: buildProPlan.creditAllocation,
          isActive: buildProPlan.isActive,
          displayOrder: buildProPlan.displayOrder,
        }
      });
    console.log(`✅ Seeded plan: ${buildProPlan.name}`);
    
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

export { seedSubscriptionPlans };
