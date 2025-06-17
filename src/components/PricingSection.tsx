"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import FloatingElement from './FloatingElement';
import WigglyLine from './WigglyLine';
import { PRICING_PLANS } from '../services/pricingService';

export default function PricingSection() {
  const { isAuthenticated, user, userData, isLoading: authLoading } = useAuth();
  
  // Get user's current plan
  const userCurrentPlan = userData?.plan || 'free';
  const handleButtonClick = async (planId: string) => {
    // Check if button should be disabled
    if (isPlanDisabled(planId)) {
      return; // Do nothing if disabled
    }

    // Check if auth is still loading
    if (authLoading) {
      console.log('Authentication still loading, please wait...');
      return;
    }

    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      window.location.href = '/login';
      return;
    }

    if (planId === 'free') {
      // Free plan - redirect to upload page
      window.location.href = '/upload';
      return;
    }

    // For paid plans, use direct Stripe payment links
    const selectedPlan = PRICING_PLANS.find(p => p.id === planId);
    
    if (!selectedPlan || !selectedPlan.paymentLink) {
      console.error('Plan or payment link not found for:', planId);
      alert('Plan configuration error. Please try again or contact support.');
      return;
    }    if (!user || !user.uid || !user.email) {
      console.error('User object, uid, or email not found:', user);
      alert('Please wait for authentication to complete, then try again.');
      return;
    }

    // Create payment link URL with prefilled email
    const paymentUrl = new URL(selectedPlan.paymentLink);
    paymentUrl.searchParams.set('prefilled_email', user.email);
      // Redirect directly to Stripe Payment Link with prefilled email
    console.log('Redirecting to payment link for plan:', planId, 'with email:', user.email);
    window.location.href = paymentUrl.toString();
  };

  // Function to determine if a plan button should be disabled
  const isPlanDisabled = (planId: string) => {
    if (!isAuthenticated) return false; // Show all options for non-authenticated users
    
    switch (userCurrentPlan) {
      case 'basic':
        return planId === 'free' || planId === 'basic'; // Disable free and basic
      case 'pro':
        return true; // Disable all buttons
      default: // 'free'
        return false; // Enable all buttons
    }
  };

  // Function to get button text based on user's plan
  const getButtonText = (planId: string) => {
    if (!isAuthenticated) {
      return planId === 'free' ? 'Sign Up Free' : `Choose ${PRICING_PLANS.find(p => p.id === planId)?.name}`;
    }

    if (userCurrentPlan === planId) {
      return 'Current Plan';
    }

    if (isPlanDisabled(planId)) {
      return 'Not Available';
    }

    return planId === 'free' ? 'Start Free' : `Upgrade to ${PRICING_PLANS.find(p => p.id === planId)?.name}`;
  };

  return (
    <section id="pricing" className="relative py-12 md:py-16 bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden">      {/* Floating Elements */}
      <FloatingElement 
        position={{ top: '20%', left: '10%' }}
        size="lg"
        imageSrc="/cactus.png"
        imageAlt="Affordable AI virtual staging pricing plans for real estate agents property managers"
        animationDelay="0.8s"
        rotation="25deg"
      />

      <FloatingElement 
        position={{ bottom: '15%', right: '12%' }}
        size="lg"
        imageSrc="/officechair.png"
        imageAlt="Professional virtual home staging software subscriptions increase property value real estate success"
        animationDelay="1.2s"
        rotation="-18deg"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Simple <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
            Professional AI staging that fits your budget and business needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {PRICING_PLANS.map((plan, index) => (            <div 
              key={plan.id}
              className={`relative bg-white rounded-3xl shadow-2xl p-6 md:p-8 text-center flex flex-col ${
                userCurrentPlan === plan.id && isAuthenticated
                  ? 'ring-4 ring-green-500 scale-105'
                  : plan.recommended
                  ? 'ring-4 ring-yellow-400 scale-105'
                  : ''
              }`}
            >
              {userCurrentPlan === plan.id && isAuthenticated ? (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                    Current Plan
                  </span>
                </div>
              ) : plan.recommended ? (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold">
                    Most Popular
                  </span>
                </div>
              ) : null}

              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center justify-center">
                  <span className="text-5xl md:text-6xl font-bold text-gray-900">${plan.monthlyPrice}</span>
                  {plan.monthlyPrice > 0 && (
                    <div className="ml-2 text-left">
                      <div className="text-gray-600 text-base">/month</div>
                    </div>
                  )}
                </div>                {plan.monthlyPrice === 0 && (
                  <p className="text-blue-600 font-semibold mt-2">Forever Free</p>
                )}
              </div>              {/* Daily/Monthly Limit */}
              <div className="mb-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-bold text-blue-600">
                    {plan.id === 'free' ? plan.monthlyLimit : plan.monthlyLimit}
                  </span>
                  <span className="text-gray-600">
                    {plan.id === 'free' 
                      ? `free images total` 
                      : `images per month`
                    }
                  </span>
                </div>
                {plan.id !== 'free' && (
                  <div className="text-sm text-gray-500 mt-1">No daily limits</div>
                )}
              </div>{/* Features */}
              <div className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>              {/* CTA Button - Consistent positioning at bottom */}
              <div className="mt-auto">
                <button 
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    isPlanDisabled(plan.id)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : userCurrentPlan === plan.id
                      ? 'bg-green-600 text-white'
                      : plan.recommended
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 hover:from-yellow-500 hover:to-orange-500'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                  onClick={() => !isPlanDisabled(plan.id) && handleButtonClick(plan.id)}
                  disabled={isPlanDisabled(plan.id)}
                >
                  {getButtonText(plan.id)}
                </button>

                {plan.id === 'free' && !isAuthenticated && (
                  <p className="text-xs text-gray-500 mt-3">
                    No credit card required
                  </p>
                )}
                
                {userCurrentPlan === plan.id && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    ✓ Active Plan
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 text-center">
          <div>
            <div className="w-12 h-12 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>            <h3 className="text-lg font-semibold text-white mb-2">Affordable</h3>
            <p className="text-blue-100 text-sm">Start at just $15/month for 20 images</p>
          </div>
          
          <div>
            <div className="w-12 h-12 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Save Time</h3>
            <p className="text-blue-100 text-sm">Get staged photos in seconds, not weeks</p>
          </div>
          
          <div>
            <div className="w-12 h-12 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Sell Faster</h3>
            <p className="text-blue-100 text-sm">Staged homes sell 73% faster on average</p>
          </div>
        </div>
      </div>
    </section>
  );
}
