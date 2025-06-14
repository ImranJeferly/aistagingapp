"use client";

import React from 'react';
import FloatingElement from './FloatingElement';
import WigglyLine from './WigglyLine';
import Button from './Button';

export default function PricingSection() {
  return (
    <section className="relative py-12 md:py-16 bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden">
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

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Simple <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
            Professional AI staging at an unbeatable price
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 text-center relative overflow-hidden">
          

            {/* Price */}
            <div className="mt-6 mb-8">
              <div className="flex items-center justify-center">
                <span className="text-6xl md:text-7xl font-bold text-gray-900">$0</span>
                <div className="ml-3 text-left">
                  <div className="text-gray-500 text-sm line-through">$99</div>
                  <div className="text-gray-600 text-base">per image</div>
                </div>
              </div>
              <p className="text-blue-600 font-semibold mt-2">100% Free Beta</p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">3 images per day</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">High-resolution images</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Multiple room types</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">30-second processing</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">No watermarks</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button size="lg" hoverColor="bg-blue-500">
              Start Staging for Free
            </Button>

            {/* Small Print */}
            <p className="text-xs text-gray-500 mt-4">
              No credit card required • Cancel anytime
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 text-center">
          <div>
            <div className="w-12 h-12 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Save Money</h3>
            <p className="text-blue-100 text-sm">Save thousands compared to traditional staging</p>
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
