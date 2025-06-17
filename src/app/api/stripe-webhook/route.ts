import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe-server';
import { 
  createSubscriptionRecord, 
  updateSubscriptionRecord, 
  cancelUserSubscription 
} from '../../../services/subscriptionService';
import { type PricingTier } from '../../../services/pricingService';
import { updateUserPlan } from '../../../services/uploadService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Stripe from 'stripe';

// Helper function to handle payment link upgrades by finding user via email
async function handlePaymentLinkUpgrade(email: string, planType: PricingTier): Promise<void> {
  try {
    console.log('Starting handlePaymentLinkUpgrade for:', email, 'plan:', planType);
    
    // Query users collection to find user with matching email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    console.log('Query results:', querySnapshot.size, 'users found');
    
    if (querySnapshot.empty) {
      console.error('No user found with email:', email);
      // Try to find by auth email field as backup
      const qAuth = query(usersRef, where('authEmail', '==', email));
      const authSnapshot = await getDocs(qAuth);
      
      if (authSnapshot.empty) {
        console.error('No user found with authEmail either:', email);
        return;
      } else {
        console.log('Found user by authEmail field');
        const userDoc = authSnapshot.docs[0];
        const userId = userDoc.id;
        console.log(`Upgrading user ${userId} (${email}) to ${planType} plan via authEmail`);
        await updateUserPlan(userId, planType);
        return;
      }
    }
    
    // Update the first matching user (should be unique)
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log(`Found user ${userId} with data:`, userData);
    console.log(`Upgrading user ${userId} (${email}) to ${planType} plan`);
    
    await updateUserPlan(userId, planType);
    console.log('Plan upgrade completed successfully');
    
  } catch (error) {
    console.error('Error handling payment link upgrade:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 Webhook received!');
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  console.log('📝 Request body length:', body.length);
  console.log('🔑 Signature present:', !!sig);  // Verify webhook signature for security
  if (!sig) {
    console.error('❌ No signature provided');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('✅ Webhook signature verified, event type:', event.type);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  try {    console.log('🔄 Processing event:', event.type);
    switch (event.type) {      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Checkout session completed:', session.id);
        console.log('Session customer_email:', session.customer_email);
        console.log('Session mode:', session.mode);

        // Handle both subscription checkout and payment link checkout
        if (session.mode === 'subscription' && session.subscription) {
          console.log('📝 Processing subscription checkout...');
          // Traditional subscription checkout with metadata
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const userId = session.metadata?.userId;
          const planType = session.metadata?.planType as PricingTier;

          if (userId && planType) {
            console.log('💾 Creating subscription record...');
            await createSubscriptionRecord(
              userId,
              subscription.id,
              subscription.customer as string,
              planType,
              subscription.status,              new Date((subscription as any).current_period_start * 1000),
              new Date((subscription as any).current_period_end * 1000)
            );
            console.log('✅ Subscription record created successfully');
          } else {
            console.log('⚠️ No userId or planType in metadata');
          }
        } else if (session.customer_email) {
          console.log('💳 Processing payment link checkout...');
          // Payment link checkout - we need to find user by email
          console.log('Processing payment link checkout for email:', session.customer_email);
          console.log('Session mode:', session.mode);
          console.log('Session amount_total:', session.amount_total);
          console.log('Session amount_subtotal:', session.amount_subtotal);
          
          // For payment links, we'll need to identify the plan by the amount
          const amountPaid = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents
          console.log('Amount paid in dollars:', amountPaid);
          
          let planType: PricingTier = 'free';
          if (amountPaid === 15) {
            planType = 'basic';
          } else if (amountPaid === 30) {
            planType = 'pro';
          }
          
          console.log('Determined plan type:', planType);
            if (planType !== 'free') {
            // Find user by email and update their plan
            console.log('Calling handlePaymentLinkUpgrade...');
            try {
              await handlePaymentLinkUpgrade(session.customer_email, planType);
              console.log('✅ Plan upgrade completed for:', session.customer_email);
            } catch (upgradeError) {
              console.error('❌ Plan upgrade failed:', upgradeError);
              throw upgradeError;
            }
          } else {
            console.error('Could not determine plan type from amount:', amountPaid);
          }
        } else {
          console.log('Session completed but no customer_email found');
          console.log('Session object keys:', Object.keys(session));
        }
        break;
      }case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);
        console.log('Invoice amount_paid:', invoice.amount_paid);
        console.log('Invoice customer_email:', invoice.customer_email);
        console.log('Invoice billing_reason:', invoice.billing_reason);

        // Handle subscription creation (from payment links)
        if (invoice.billing_reason === 'subscription_create' && invoice.customer_email) {
          console.log('Processing subscription creation from payment link');
          
          // Determine plan type from amount
          const amountPaid = invoice.amount_paid / 100; // Convert from cents
          console.log('Amount paid in dollars:', amountPaid);
          
          let planType: PricingTier = 'free';
          if (amountPaid === 15) {
            planType = 'basic';
          } else if (amountPaid === 30) {
            planType = 'pro';
          }
          
          console.log('Determined plan type:', planType);
            if (planType !== 'free') {
            console.log('Upgrading user plan for email:', invoice.customer_email);
            try {
              await handlePaymentLinkUpgrade(invoice.customer_email, planType);
              console.log('✅ Plan upgrade completed for:', invoice.customer_email);
            } catch (upgradeError) {
              console.error('❌ Plan upgrade failed:', upgradeError);
              throw upgradeError;
            }
          }
        }

        // Also handle regular subscription updates
        if ((invoice as any).subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            (invoice as any).subscription as string
          );

          await updateSubscriptionRecord(subscription.id, {
            status: subscription.status as any,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoice.id);        if ((invoice as any).subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            (invoice as any).subscription as string
          );

          await updateSubscriptionRecord(subscription.id, {
            status: 'past_due',
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);

        await updateSubscriptionRecord(subscription.id, {
          status: subscription.status as any,          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);

        const userId = subscription.metadata?.userId;
        if (userId) {
          await cancelUserSubscription(userId, subscription.id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
