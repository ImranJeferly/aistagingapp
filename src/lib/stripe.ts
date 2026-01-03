import { loadStripe } from '@stripe/stripe-js';

// Client-side Stripe instance
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'usd',
  payment_method_types: ['card'],
  billing_address_collection: 'auto' as const,
  payment_method_collection: 'always' as const,
  mode: 'subscription' as const,
};

// Product and price mappings
export const STRIPE_PRODUCTS = {
  basic: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID!,
    productId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRODUCT_ID!,
  },
  pro: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    productId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRODUCT_ID!,
  },
};
