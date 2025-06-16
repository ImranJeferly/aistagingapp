import { NextRequest, NextResponse } from 'next/server';
import { stripe, createStripeCustomer, createCheckoutSession } from '../../../lib/stripe-server';
import { createCustomerRecord, getCustomerRecord } from '../../../services/subscriptionService';
import { getUserData } from '../../../services/authService';

export async function POST(request: NextRequest) {
  try {
    const { userId, planType, priceId, successUrl, cancelUrl } = await request.json();

    if (!userId || !planType || !priceId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, planType, or priceId' },
        { status: 400 }
      );
    }

    if (planType === 'free') {
      return NextResponse.json(
        { error: 'Cannot create checkout session for free plan' },
        { status: 400 }
      );
    }    // Get user data
    console.log('Fetching user data for userId:', userId);
    const userData = await getUserData(userId);
    if (!userData) {
      console.error('User document not found in Firestore for userId:', userId);
      return NextResponse.json(
        { error: 'User not found in database. Please ensure your account is properly set up.' },
        { status: 404 }
      );
    }
    console.log('User data found:', userData.email);

    // Get or create Stripe customer
    let customerRecord = await getCustomerRecord(userId);
    let customerId: string;

    if (!customerRecord) {
      // Create new Stripe customer
      const customer = await createStripeCustomer(
        userData.email,
        userData.displayName || `${userData.firstName} ${userData.lastName}`,
        userId
      );
      customerId = customer.id;

      // Save customer record to Firestore
      await createCustomerRecord(
        userId,
        customerId,
        userData.email,
        userData.displayName || `${userData.firstName} ${userData.lastName}`
      );    } else {
      customerId = customerRecord.customerId;
    }

    // Create checkout session
    const session = await createCheckoutSession({
      customerId,
      priceId,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/upload?payment=success`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment?plan=${planType}&payment=cancelled`,
      userId,
      planType,
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
