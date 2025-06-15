"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { PRICING_PLANS, type PricingTier } from '../../services/pricingService';
import { useUploadLimit } from '../../hooks/useUploadLimit';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();  const { userTier } = useUploadLimit();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planId = searchParams.get('plan') as PricingTier | null;
  const selectedPlan = planId ? PRICING_PLANS.find(p => p.id === planId) : null;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Redirect if no plan selected or invalid plan
  useEffect(() => {
    if (!planId || !selectedPlan || planId === 'free') {
      router.push('/#pricing');
    }
  }, [planId, selectedPlan, router]);

  // Redirect if user already has this plan or a higher plan
  useEffect(() => {
    if (userTier && selectedPlan) {
      const currentPlanData = PRICING_PLANS.find(p => p.id === userTier);
      if (currentPlanData && currentPlanData.monthlyPrice >= selectedPlan.monthlyPrice) {
        router.push('/upload');
      }
    }
  }, [userTier, selectedPlan, router]);
  const handleCheckout = async () => {
    if (!user || !selectedPlan || !selectedPlan.stripePriceId) {
      setError('Plan configuration error. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          planType: selectedPlan.id,
          priceId: selectedPlan.stripePriceId,
          successUrl: `${window.location.origin}/upload?payment=success`,
          cancelUrl: `${window.location.origin}/payment?plan=${selectedPlan.id}&payment=cancelled`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during checkout');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
          <p className="text-gray-600">You're upgrading to the {selectedPlan.name} plan</p>
        </div>

        {/* Plan Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.name} Plan</h2>
              <p className="text-gray-600 mt-1">Perfect for {selectedPlan.name.toLowerCase()} users</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">${selectedPlan.monthlyPrice}</div>
              <div className="text-gray-600">per month</div>
            </div>
          </div>

          {/* Features */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">What's included:</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">
                  <strong>{selectedPlan.monthlyLimit}</strong> images per month
                </span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">No daily limits</span>
              </div>
              {selectedPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-blue-50 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Secure Payment with Stripe</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Your payment is processed securely by Stripe</li>
                <li>• You can cancel your subscription anytime</li>
                <li>• Your plan will upgrade immediately after payment</li>
                <li>• You'll receive a receipt via email</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/#pricing')}
            className="flex-1 py-3 px-6 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Back to Pricing
          </button>
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              `Proceed to Payment • $${selectedPlan.monthlyPrice}/month`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
