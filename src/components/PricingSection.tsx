"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import FloatingElement from './FloatingElement';
import WigglyLine from './WigglyLine';
import { PRICING_PLANS } from '../services/pricingService';

export default function PricingSection() {
  const { isAuthenticated } = useAuth();

  const handleButtonClick = (planId: string) => {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      window.location.href = '/login';
      return;
    }

    if (planId === 'free') {
      // Free plan - redirect to upload page
      window.location.href = '/upload';
    } else {
      // Paid plans - redirect to payment page (placeholder for now)
      alert(`Payment integration coming soon! Currently everyone gets the free tier.`);
      // When payment is ready, this would redirect to:
      // window.location.href = `/payment?plan=${planId}`;
    }
  };
  return (
    <section id="pricing" className="relative py-12 md:py-16 bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden">
      {/* Floating Elements */}
      <FloatingElement 
        position={{ top: '20%', left: '10%' }}
        size="lg"
        imageSrc="/cactus.png"
        imageAlt="3D Lamp"
        animationDelay="0.8s"
        rotation="25deg"
      />

      <FloatingElement 
        position={{ bottom: '15%', right: '12%' }}
        size="lg"
        imageSrc="/officechair.png"
        imageAlt="3D Table"
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
                plan.recommended ? 'ring-4 ring-yellow-400 scale-105' : ''
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold">
                    Most Popular
                  </span>
                </div>
              )}

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
                <div className="text-3xl font-bold text-blue-600 mb-1">{plan.monthlyLimit}</div>
                <div className="text-gray-600">
                  {plan.id === 'free' 
                    ? `image${plan.dailyLimit > 1 ? 's' : ''} per day` 
                    : `images per month`
                  }
                </div>
                {plan.id !== 'free' && (
                  <div className="text-sm text-gray-500 mt-1">No daily limits</div>
                )}
              </div>              {/* Features */}
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
                    plan.recommended
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 hover:from-yellow-500 hover:to-orange-500'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                  onClick={() => handleButtonClick(plan.id)}
                >
                  {plan.id === 'free' 
                    ? (isAuthenticated ? 'Start Free' : 'Sign Up Free')
                    : `Choose ${plan.name}`
                  }
                </button>

                {plan.id === 'free' && (
                  <p className="text-xs text-gray-500 mt-3">
                    {isAuthenticated ? '' : 'No credit card required'}
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
