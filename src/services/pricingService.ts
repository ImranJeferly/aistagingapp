// Pricing and subscription service

export type PricingTier = 'free' | 'basic' | 'pro';

export interface PricingPlan {
  id: PricingTier;
  name: string;
  dailyLimit: number;
  monthlyLimit: number; // New: monthly limit for paid plans
  monthlyPrice: number; // in USD
  yearlyPrice: number; // in USD (with discount)
  features: string[];
  recommended?: boolean;
  stripePriceId?: string; // Stripe price ID for subscription
}

// Cost structure
export const COST_PER_IMAGE = 0.5; // OpenAI API cost per image
export const PROFIT_MARGIN_BASIC = 2; // 2x markup for basic plan
export const PROFIT_MARGIN_PRO = 1.8; // 1.8x markup for pro plan (volume discount)

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    dailyLimit: 1,
    monthlyLimit: 30, // 1 per day max
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '1 staged image per day',
      'All room types supported',
      'All interior styles',
      'High-quality AI staging',
      'Download images'
    ]
  },  {
    id: 'basic',
    name: 'Basic',
    dailyLimit: 999, // No daily limit, only monthly
    monthlyLimit: 20, // 20 images per month
    monthlyPrice: 15, // $0.75 per image
    yearlyPrice: 150, // 2 months free
    recommended: true,
    stripePriceId: 'price_basic_monthly', // This will need to be updated with actual Stripe price ID
    features: [
      '20 staged images per month',
      'All room types supported',
      'All interior styles',
      'High-quality AI staging',
      'Download images',
      'No daily limits',
    ]
  },  {
    id: 'pro',
    name: 'Pro',
    dailyLimit: 999, // No daily limit, only monthly
    monthlyLimit: 50, // 50 images per month
    monthlyPrice: 30, // $0.60 per image
    yearlyPrice: 300, // 2 months free
    stripePriceId: 'price_pro_monthly', // This will need to be updated with actual Stripe price ID
    features: [
      '50 staged images per month',
      'All room types supported',
      'All interior styles',
      'High-quality AI staging',
      'Download images',
      'No daily limits',
      'Priority processing',
    ]
  }
];

export const getCurrentPlan = (tier: PricingTier): PricingPlan => {
  return PRICING_PLANS.find(plan => plan.id === tier) || PRICING_PLANS[0];
};

export const getDailyLimit = (tier: PricingTier): number => {
  return getCurrentPlan(tier).dailyLimit;
};

export const getMonthlyLimit = (tier: PricingTier): number => {
  return getCurrentPlan(tier).monthlyLimit;
};

// Calculate pricing metrics
export const calculateMetrics = () => {
  return {
    costPerImage: COST_PER_IMAGE,
    basicPlan: {
      monthlyImages: PRICING_PLANS[1].monthlyLimit,
      monthlyPrice: PRICING_PLANS[1].monthlyPrice,
      costPerImage: PRICING_PLANS[1].monthlyPrice / PRICING_PLANS[1].monthlyLimit,
      profitMargin: (PRICING_PLANS[1].monthlyPrice / PRICING_PLANS[1].monthlyLimit) / COST_PER_IMAGE
    },
    proPlan: {
      monthlyImages: PRICING_PLANS[2].monthlyLimit,
      monthlyPrice: PRICING_PLANS[2].monthlyPrice,
      costPerImage: PRICING_PLANS[2].monthlyPrice / PRICING_PLANS[2].monthlyLimit,
      profitMargin: (PRICING_PLANS[2].monthlyPrice / PRICING_PLANS[2].monthlyLimit) / COST_PER_IMAGE
    }
  };
};
