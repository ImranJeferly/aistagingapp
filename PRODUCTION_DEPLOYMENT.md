# Production Deployment Guide

## 🚀 Deploying to Vercel with Custom Domain

### **Step 1: Deploy to Vercel**

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-deploy

3. **Set Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add all variables from your `.env.local` file:

   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_value
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_value
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_value
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_value
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_value
   NEXT_PUBLIC_FIREBASE_APP_ID=your_value
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_value

   # OpenAI API
   OPENAI_API_KEY=your_openai_key

   # Stripe Configuration (PRODUCTION)
   STRIPE_SECRET_KEY=sk_live_your_live_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

   # Stripe Payment Links (PRODUCTION)
   NEXT_PUBLIC_STRIPE_BASIC_PAYMENT_LINK=https://buy.stripe.com/your_live_basic_link
   NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK=https://buy.stripe.com/your_live_pro_link

   # Application URL (UPDATE THIS!)
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

### **Step 2: Set Up Custom Domain**

1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Add your custom domain (e.g., `yourdomain.com`)
   - Follow Vercel's DNS configuration instructions

2. **Update DNS Records**
   - Add CNAME record pointing to Vercel
   - Wait for DNS propagation (can take up to 24 hours)

### **Step 3: Update Stripe Configuration**

#### **3.1 Create Production Payment Links**

1. **Switch to Live Mode in Stripe Dashboard**
2. **Go to Products → Payment Links**
3. **Create new payment links for production:**
   - Basic Plan: $15/month
   - Pro Plan: $30/month
4. **Copy the live payment link URLs**

#### **3.2 Update Webhook Endpoint**

1. **Go to Stripe Dashboard → Developers → Webhooks**
2. **Create new webhook for production:**
   - **Endpoint URL**: `https://yourdomain.com/api/stripe-webhook`
   - **Events to send**:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
3. **Copy the webhook signing secret** (starts with `whsec_live_...`)

#### **3.3 Update Environment Variables**

Update these in Vercel:
```bash
STRIPE_SECRET_KEY=sk_live_your_new_live_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_new_live_key
STRIPE_WEBHOOK_SECRET=whsec_live_your_new_webhook_secret
NEXT_PUBLIC_STRIPE_BASIC_PAYMENT_LINK=https://buy.stripe.com/your_new_live_basic_link
NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK=https://buy.stripe.com/your_new_live_pro_link
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### **Step 4: Update Firebase Configuration**

1. **Add your production domain to Firebase**
   - Go to Firebase Console → Authentication → Settings
   - Add `https://yourdomain.com` to authorized domains

2. **Update Firebase Hosting (if using)**
   - Update `firebase.json` with your domain
   - Run `firebase deploy`

### **Step 5: Test Production Setup**

1. **Test Authentication**
   - Sign up/login on your production site
   - Verify user creation in Firebase

2. **Test Payment Flow**
   - Try purchasing Basic plan
   - Check Stripe dashboard for payment
   - Verify webhook receives events
   - Confirm user plan upgrades in Firebase

3. **Test AI Staging**
   - Upload an image
   - Verify OpenAI API works
   - Check usage limits

### **Step 6: Monitoring & Analytics**

1. **Set up Vercel Analytics**
2. **Monitor Stripe webhooks**
3. **Track Firebase usage**
4. **Monitor OpenAI API costs**

## 🔧 **Key URLs to Update**

| Service | Configuration | New URL |
|---------|---------------|---------|
| **Stripe Webhook** | Dashboard → Webhooks | `https://yourdomain.com/api/stripe-webhook` |
| **Firebase Auth** | Authorized Domains | `https://yourdomain.com` |
| **Payment Success** | Stripe Payment Links | `https://yourdomain.com/upload?payment=success` |
| **Payment Cancel** | Stripe Payment Links | `https://yourdomain.com/#pricing` |

## ⚠️ **Important Notes**

1. **Never commit `.env.local` to git** - use Vercel environment variables
2. **Test webhook with live payments** using small amounts first
3. **Monitor webhook logs** in Vercel Functions tab
4. **Set up proper error monitoring** (Sentry, LogRocket, etc.)
5. **Enable Stripe webhook retry** for failed deliveries

## 🚨 **Troubleshooting**

### Webhook Not Working
- Check Vercel Functions logs
- Verify webhook URL is accessible
- Test webhook signature validation
- Check environment variables in Vercel

### Payment Links Not Working
- Verify live mode in Stripe
- Check payment link URLs
- Ensure customer email prefilling works
- Test with different browsers/devices

### Authentication Issues
- Verify Firebase authorized domains
- Check Firebase configuration
- Test social login redirects
