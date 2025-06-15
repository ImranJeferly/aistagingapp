import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { updateUserPlan } from './uploadService';
import { type PricingTier } from './pricingService';

export interface SubscriptionData {
  userId: string;
  customerId: string;
  subscriptionId: string;
  plan: PricingTier;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface CustomerData {
  userId: string;
  customerId: string;
  email: string;
  name: string;
  createdAt: any;
  updatedAt: any;
}

// Create or get Stripe customer record in Firestore
export const createCustomerRecord = async (
  userId: string,
  customerId: string,
  email: string,
  name: string
): Promise<void> => {
  try {
    const customerRef = doc(db, 'customers', userId);
    await setDoc(customerRef, {
      userId,
      customerId,
      email,
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('Customer record created successfully');
  } catch (error) {
    console.error('Error creating customer record:', error);
    throw error;
  }
};

// Get customer record from Firestore
export const getCustomerRecord = async (userId: string): Promise<CustomerData | null> => {
  try {
    const customerRef = doc(db, 'customers', userId);
    const customerDoc = await getDoc(customerRef);
    
    if (customerDoc.exists()) {
      return customerDoc.data() as CustomerData;
    }
    return null;
  } catch (error) {
    console.error('Error getting customer record:', error);
    return null;
  }
};

// Create subscription record in Firestore
export const createSubscriptionRecord = async (
  userId: string,
  subscriptionId: string,
  customerId: string,
  plan: PricingTier,
  status: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
    await setDoc(subscriptionRef, {
      userId,
      subscriptionId,
      customerId,
      plan,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update user's plan in their main document
    await updateUserPlan(userId, plan);
    
    console.log('Subscription record created successfully');
  } catch (error) {
    console.error('Error creating subscription record:', error);
    throw error;
  }
};

// Update subscription record in Firestore
export const updateSubscriptionRecord = async (
  subscriptionId: string,
  updates: Partial<SubscriptionData>
): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(subscriptionRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    // If plan is being updated, also update user's plan
    if (updates.plan && updates.userId) {
      await updateUserPlan(updates.userId, updates.plan);
    }
    
    console.log('Subscription record updated successfully');
  } catch (error) {
    console.error('Error updating subscription record:', error);
    throw error;
  }
};

// Get subscription record from Firestore
export const getSubscriptionRecord = async (subscriptionId: string): Promise<SubscriptionData | null> => {
  try {
    const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (subscriptionDoc.exists()) {
      return subscriptionDoc.data() as SubscriptionData;
    }
    return null;
  } catch (error) {
    console.error('Error getting subscription record:', error);
    return null;
  }
};

// Get user's active subscription
export const getUserActiveSubscription = async (userId: string): Promise<SubscriptionData | null> => {
  try {
    // Query subscriptions collection for active subscription by userId
    const subscriptionsRef = doc(db, 'subscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionsRef);
    
    if (subscriptionDoc.exists()) {
      const data = subscriptionDoc.data() as SubscriptionData;
      if (data.status === 'active') {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user active subscription:', error);
    return null;
  }
};

// Cancel subscription and revert to free plan
export const cancelUserSubscription = async (userId: string, subscriptionId: string): Promise<void> => {
  try {
    // Update subscription record
    await updateSubscriptionRecord(subscriptionId, {
      status: 'canceled',
      cancelAtPeriodEnd: true,
    });

    // Revert user to free plan
    await updateUserPlan(userId, 'free');
    
    console.log('User subscription canceled successfully');
  } catch (error) {
    console.error('Error canceling user subscription:', error);
    throw error;
  }
};
