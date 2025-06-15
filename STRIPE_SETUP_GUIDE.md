# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payments for the subscription plans in your staging AI app.

## Prerequisites

1. **Stripe Account**: You need a Stripe account. Sign up at [stripe.com](https://stripe.com) if you don't have one.
2. **Node.js & Next.js**: Ensure your development environment is set up.

## Step 1: Create Stripe Products and Prices

### 1.1 Log into Stripe Dashboard
- Go to [dashboard.stripe.com](https://dashboard.stripe.com)
- Make sure you're in **Test mode** for development

### 1.2 Create Products
Navigate to **Products** in the Stripe Dashboard and create two products:

#### Basic Plan Product
- **Name**: "Staging AI Basic Plan"
- **Description**: "20 staged images per month with no daily limits"

#### Pro Plan Product  
- **Name**: "Staging AI Pro Plan"
- **Description**: "50 staged images per month with priority processing"

### 1.3 Create Recurring Prices
For each product, create a recurring price:

#### Basic Plan Price
- **Type**: Recurring
- **Price**: $15.00 USD
- **Billing period**: Monthly
- **Price ID**: Copy this (e.g., `price_1234567890abcdef`)

#### Pro Plan Price
- **Type**: Recurring  
- **Price**: $30.00 USD
- **Billing period**: Monthly
- **Price ID**: Copy this (e.g., `price_0987654321fedcba`)

## Step 2: Update Price IDs in Code

### 2.1 Update pricingService.ts
Replace the placeholder Price IDs with your actual Stripe Price IDs:

```typescript
// In src/services/pricingService.ts
{
  id: 'basic',
  name: 'Basic',
  stripePriceId: 'price_1234567890abcdef', // Replace with your actual Basic plan price ID
  // ... other properties
},
{
  id: 'pro', 
  name: 'Pro',
  stripePriceId: 'price_0987654321fedcba', // Replace with your actual Pro plan price ID
  // ... other properties
}
```

## Step 3: Configure Environment Variables

### 3.1 Get Stripe Keys
From your Stripe Dashboard:
- **Secret Key**: Developers → API keys → Secret key (starts with `sk_test_`)
- **Publishable Key**: Developers → API keys → Publishable key (starts with `pk_test_`)

### 3.2 Update .env.local
Add these variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here  # Set this up in Step 4

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change for production
```

## Step 4: Set Up Webhooks

### 4.1 Create Webhook Endpoint
In Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `http://localhost:3000/api/stripe-webhook` (for development)
4. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 4.2 Get Webhook Secret
After creating the webhook:
1. Click on your webhook endpoint
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Step 5: Test the Integration

### 5.1 Start Development Server
```bash
npm run dev
```

### 5.2 Test with Stripe Test Cards
Use these test card numbers:
- **Successful payment**: `4242 4242 4242 4242`
- **Declined payment**: `4000 0000 0000 0002`
- Use any future expiry date and any 3-digit CVC

### 5.3 Test Flow
1. Go to your app's pricing section
2. Click on a paid plan (Basic or Pro)
3. Complete the checkout process
4. Verify the user's plan is updated in Firestore
5. Check webhook events in Stripe Dashboard

## Step 6: Production Setup

### 6.1 Switch to Live Mode
1. In Stripe Dashboard, toggle to **Live mode**
2. Create new products and prices (repeat Steps 1.2-1.3)
3. Update the price IDs in your code
4. Get live API keys (they start with `sk_live_` and `pk_live_`)

### 6.2 Update Environment Variables
```bash
# Production Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
```

### 6.3 Update Webhook Endpoint
Create a new webhook endpoint with your production URL:
`https://your-production-domain.com/api/stripe-webhook`

## Troubleshooting

### Common Issues

1. **"No such price" error**: Double-check your price IDs match exactly
2. **Webhook signature verification failed**: Ensure webhook secret is correct
3. **User plan not updating**: Check webhook events are being received and processed
4. **CORS errors**: Ensure your domain is whitelisted in Stripe settings

### Testing Webhooks Locally

For local testing, use Stripe CLI:
```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

This will give you a webhook secret for local testing.

## Security Notes

1. **Never expose secret keys**: Keep `STRIPE_SECRET_KEY` server-side only
2. **Validate webhooks**: Always verify webhook signatures
3. **Use HTTPS in production**: Stripe requires HTTPS for live webhooks
4. **Test thoroughly**: Test all payment scenarios before going live

## Support

- Stripe Documentation: [stripe.com/docs](https://stripe.com/docs)
- Stripe Support: Available in your Stripe Dashboard
- Test your integration thoroughly before processing live payments
