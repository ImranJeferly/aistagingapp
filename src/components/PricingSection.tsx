"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import FloatingElement from './FloatingElement';
// import Floating3DModel from './Floating3DModel';
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
    
    if (userCurrentPlan === planId) return true; // Always disable current plan

    switch (userCurrentPlan) {
      case 'basic':
        return planId === 'free'; // Disable free and basic
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
    <section id="pricing" className="relative py-20 overflow-hidden">
      {/* Floating Elements */}
      {/* <Floating3DModel 
        modelPath="/models/cactus2.glb"
        position={{ top: '15%', left: '8%' }}
        size="lg"
        rotation={[0.2, 0.5, 0]}
      />

      <Floating3DModel 
        modelPath="/models/cactus2.glb"
        position={{ top: '5%', left: '2%' }}
        size="lg"
        rotation={[0.2, 0.5, 0]}
      /> */}

      {/* <FloatingElement 
        position={{ bottom: '15%', right: '8%' }}
        size="lg"
        imageSrc="/officechair.png"
        imageAlt="Professional virtual home staging software"
        animationDelay="1.2s"
        rotation="-12deg"
      /> */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-brand text-[#1a1a1a] mb-6">
            Simple <span className="inline-block bg-[#FACC15] px-4 py-1 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">Pricing</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-800 max-w-3xl mx-auto font-medium">
            Professional AI staging that fits your budget and business needs
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div 
              key={plan.id}
              initial={{ opacity: 0, y: 50, skewX: -6 }}
              whileInView={{ opacity: 1, y: 0, skewX: -6 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className={`relative bg-white rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 text-center flex flex-col transform-gpu ${
                plan.recommended ? 'bg-yellow-50' : ''
              }`}
            >
              {userCurrentPlan === plan.id && isAuthenticated ? (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-full">
                  <span className="bg-green-500 text-white px-6 py-2 rounded-full text-sm font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    Current Plan
                  </span>
                </div>
              ) : plan.recommended ? (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-full">
                  <span className="bg-[#FF90E8] text-black px-6 py-2 rounded-full text-sm font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    Most Popular
                  </span>
                </div>
              ) : null}

              {/* Plan Name */}
              <h3 className="text-2xl font-black font-brand text-black mb-4">{plan.name}</h3>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center justify-center">
                  <span className="text-5xl md:text-6xl font-black text-black">${plan.monthlyPrice}</span>
                  {plan.monthlyPrice > 0 && (
                    <div className="ml-2 text-left">
                      <div className="text-gray-600 text-base font-bold">/month</div>
                    </div>
                  )}
                </div>
                {plan.monthlyPrice === 0 && (
                  <p className="text-blue-600 font-bold mt-2 font-brand text-xl">Forever Free</p>
                )}
              </div>

              {/* Daily/Monthly Limit */}
              <div className="mb-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-black text-blue-600">
                    {plan.id === 'free' ? plan.monthlyLimit : plan.monthlyLimit}
                  </span>
                  <span className="text-gray-800 font-bold">
                    {plan.id === 'free' 
                      ? `free images total` 
                      : `images per month`
                    }
                  </span>
                </div>
                {plan.id !== 'free' && (
                  <div className="text-sm text-gray-500 mt-1 font-medium">No daily limits</div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 bg-green-100 border-2 border-black rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-800 text-sm font-bold">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-auto">
                <button 
                  className={`w-full py-4 px-6 rounded-xl font-black text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 transition-all duration-200 ${
                    isPlanDisabled(plan.id)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none border-gray-400'
                      : userCurrentPlan === plan.id
                      ? 'bg-green-500 text-black'
                      : plan.recommended
                      ? 'bg-[#FACC15] text-black'
                      : 'bg-white text-black hover:bg-gray-50'
                  }`}
                  onClick={() => !isPlanDisabled(plan.id) && handleButtonClick(plan.id)}
                  disabled={isPlanDisabled(plan.id)}
                >
                  {getButtonText(plan.id)}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
