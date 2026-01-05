'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import InteractiveFeatureShowcase from '../../components/InteractiveFeatureShowcase';
import UpscaleFeature from '../../components/UpscaleFeature';
import ExploreGallery from '../../components/ExploreGallery';
import VirtualRenovation from '../../components/VirtualRenovation';
import WigglyLine from '../../components/WigglyLine';
import Badge from '../../components/Badge';
import Link from 'next/link';

const features = [
  {
    title: "Instant AI Staging",
    description: "Transform empty rooms in 30 seconds with professional-quality AI staging.",
    icon: "🚀",
    color: "bg-blue-100"
  },
  {
    title: "Multiple Design Styles",
    description: "Choose from modern, traditional, minimalist, and luxury interior design styles.",
    icon: "🎨",
    color: "bg-purple-100"
  },
  {
    title: "High-Resolution Output",
    description: "Get professional-quality staged images ready for MLS listings and marketing.",
    icon: "📸",
    color: "bg-pink-100"
  },
  {
    title: "Easy Upload",
    description: "Simple drag-and-drop interface. No design experience required.",
    icon: "📤",
    color: "bg-yellow-100"
  },
  {
    title: "Real Estate Focused",
    description: "Specifically designed for real estate agents and property marketing.",
    icon: "🏠",
    color: "bg-green-100"
  },
  {
    title: "Cost Effective",
    description: "Save thousands compared to traditional staging. Start with 5 free images.",
    icon: "💰",
    color: "bg-orange-100"
  }
];

export default function FeaturesPage() {
  const headerRef = useRef(null);
  const subHeaderRef = useRef(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "back.out(1.7)", duration: 1 } });

    tl.fromTo(headerRef.current,
      { y: 50, opacity: 0, rotation: 2 },
      { y: 0, opacity: 1, rotation: 0, delay: 0.2 }
    );

    tl.fromTo(subHeaderRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, ease: "power3.out" },
      "-=0.6"
    );

    if (cardsRef.current) {
      gsap.fromTo(cardsRef.current.children,
        { y: 50, opacity: 0, scale: 0.9 },
        { 
          y: 0, 
          opacity: 1, 
          scale: 1, 
          stagger: 0.1, 
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top bottom-=100",
          }
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF5] overflow-x-hidden">
      <Navigation />
      
      <main className="pt-24 relative">
        {/* Decorative Background Elements */}
        <WigglyLine 
          position={{ top: '10%', left: '-5%' }} 
          rotation="-15deg" 
          vectorNumber={1} 
          opacity={0.6} 
          scale={0.6}
        />
        <WigglyLine 
          position={{ top: '40%', right: '-5%' }} 
          rotation="15deg" 
          vectorNumber={2} 
          opacity={0.6} 
          scale={0.6}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          
          {/* Hero Section */}
          <div className="text-center mb-24 relative">
            <div ref={headerRef} className="inline-block">
              <h1 className="font-brand text-6xl md:text-7xl lg:text-8xl font-bold text-black mb-6 tracking-tight relative">
                Powerful <span className="text-blue-600 relative inline-block transform -rotate-2">
                  AI Staging
                  <svg className="absolute w-full h-4 -bottom-2 left-0 text-yellow-300 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span> Features
              </h1>
            </div>
            
            <p ref={subHeaderRef} className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              Everything you need to create stunning staged photos for your real estate listings. 
              Professional results without the professional cost.
            </p>

            <div className="flex justify-center gap-4 flex-wrap">
              <div className="transform rotate-2 hover:rotate-0 transition-transform duration-200">
                <Badge icon="✨" isStatic>AI Powered</Badge>
              </div>
              <div className="transform -rotate-2 hover:rotate-0 transition-transform duration-200">
                <Badge icon="⚡" isStatic>Instant Results</Badge>
              </div>
              <div className="transform rotate-1 hover:rotate-0 transition-transform duration-200">
                <Badge icon="💎" isStatic>Premium Quality</Badge>
              </div>
            </div>
          </div>

          {/* Interactive Showcase Section */}
          <section className="mb-32 relative">
            <InteractiveFeatureShowcase />
          </section>

          {/* Upscale Feature Section */}
          <section className="mb-32 bg-white rounded-[3rem] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 relative overflow-hidden">
            <UpscaleFeature />
          </section>

          {/* Features Grid */}
          <div className="mb-32">
            <div className="text-center mb-16">
              <h2 className="font-brand text-5xl font-bold text-black mb-4">Complete Feature Set</h2>
              <p className="text-xl text-gray-700 font-medium">Designed for modern real estate professionals</p>
            </div>
            
            <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-3xl p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 group"
                >
                  <div className={`text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300 ${feature.color} w-20 h-20 rounded-2xl border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-brand text-2xl font-bold text-black mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg font-medium">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Explore Gallery Section */}
          {/* <section className="mb-32">
            <ExploreGallery />
          </section> */}

          {/* Virtual Renovation Section */}
          {/* <section className="mb-32 bg-white rounded-[3rem] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 relative overflow-hidden">
            <VirtualRenovation />
          </section> */}

          {/* Benefits Section */}
          <div className="bg-blue-50 rounded-[3rem] p-12 md:p-20 mb-24 text-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative border-2 border-black">
            
            <div className="relative z-10">
              <div className="text-center mb-16">
                <h2 className="font-brand text-5xl md:text-6xl font-bold mb-6 text-black">
                  Why Choose AI Staging?
                </h2>
                <p className="text-gray-700 text-xl max-w-2xl mx-auto font-medium">
                  Join the revolution in real estate marketing. Faster, cheaper, and better than traditional methods.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 max-w-5xl mx-auto">
                {[
                  "Save 90% compared to traditional staging",
                  "Get results in seconds, not days",
                  "No physical furniture or logistics",
                  "Perfect for vacant properties",
                  "Multiple style options for every taste",
                  "Professional quality guaranteed"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center group">
                    <div className="bg-white text-black border-2 border-black rounded-lg p-2 mr-6 flex-shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:-translate-y-1">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center pb-12">
            <div className="inline-block relative">
              <h2 className="font-brand text-6xl font-bold text-black mb-6">
                Ready to Transform Your Listings?
              </h2>
              <WigglyLine 
                position={{ bottom: '-20px', right: '-40px' }} 
                rotation="0deg" 
                vectorNumber={3} 
                scale={0.3}
              />
            </div>
            <p className="text-2xl text-gray-700 mb-10 max-w-2xl mx-auto mt-8 font-medium">
              Join thousands of real estate agents using AI to sell homes faster. 
              Start with <span className="font-bold text-black bg-yellow-300 px-2 py-1 rounded border-2 border-black transform -rotate-1 inline-block">5 free staged images</span>.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center px-12 py-5 border-2 border-black text-xl font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-all transform hover:-translate-y-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              Start Staging Now
              <svg className="ml-3 -mr-1 w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="mt-6 text-gray-600 font-bold">No credit card required • Cancel anytime</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
