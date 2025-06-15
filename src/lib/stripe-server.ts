import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Helper function to create a customer
export async function createStripeCustomer(email: string, name: string, userId: string) {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });
}

// Helper function to create a checkout session
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  userId,
  planType,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  planType: string;
}) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planType,
    },
    subscription_data: {
      metadata: {
        userId,
        planType,
      },
    },
    billing_address_collection: 'auto',
    allow_promotion_codes: true,
  });
}

// Helper function to retrieve a subscription
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

// Helper function to cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}
