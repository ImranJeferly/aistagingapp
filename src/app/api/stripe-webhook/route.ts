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
    // Query users collection to find user with matching email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('No user found with email:', email);
      return;
    }
    
    // Update the first matching user (should be unique)
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    
    console.log(`Upgrading user ${userId} (${email}) to ${planType} plan`);
    await updateUserPlan(userId, planType);
    
  } catch (error) {
    console.error('Error handling payment link upgrade:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {    switch (event.type) {      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        // Handle both subscription checkout and payment link checkout
        if (session.mode === 'subscription' && session.subscription) {
          // Traditional subscription checkout with metadata
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const userId = session.metadata?.userId;
          const planType = session.metadata?.planType as PricingTier;

          if (userId && planType) {
            await createSubscriptionRecord(
              userId,
              subscription.id,
              subscription.customer as string,
              planType,
              subscription.status,              new Date((subscription as any).current_period_start * 1000),
              new Date((subscription as any).current_period_end * 1000)
            );
          }
        } else if (session.mode === 'payment' && session.customer_email) {
          // Payment link checkout - we need to find user by email
          console.log('Processing payment link checkout for email:', session.customer_email);
          
          // For payment links, we'll need to identify the plan by the amount
          // This is a temporary solution until we can pass user metadata in payment links
          const amountPaid = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents
          
          let planType: PricingTier = 'free';
          if (amountPaid === 15) {
            planType = 'basic';
          } else if (amountPaid === 30) {
            planType = 'pro';
          }
          
          if (planType !== 'free') {
            // Find user by email and update their plan
            await handlePaymentLinkUpgrade(session.customer_email, planType);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);        if ((invoice as any).subscription) {
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
