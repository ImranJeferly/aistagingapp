'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Navigation from '../components/Navigation';
import Button from '../components/Button';
import AuthButton from '../components/AuthButton';
// import FloatingElement from '../components/FloatingElement';
// import Floating3DModel from '../components/Floating3DModel';
import Badge from '../components/Badge';
import WigglyLine from '../components/WigglyLine';
import ImageViewer from '../components/ImageViewer';
import UploadSection from '../components/UploadSection';
import PricingSection from '../components/PricingSection';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "AI Staging App",
  "description": "Transform empty rooms into stunning spaces with our free AI staging platform. Professional home staging in 30 seconds.",
  "url": process.env.NEXT_PUBLIC_APP_URL || "https://aistagingapp.com",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free AI home staging tool"
  },
  "creator": {
    "@type": "Organization",
    "name": "AI Staging App",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://aistagingapp.com"
  },
  "featureList": [
    "AI-powered home staging",
    "Real estate photo enhancement",
    "Virtual furniture placement",
    "Multiple interior design styles",
    "Instant results in 30 seconds",
    "Free tier available",
    "Professional quality staging"
  ],
  "screenshot": "https://aistagingapp.com/og-image.png",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "100",
    "bestRating": "5",
    "worstRating": "1"
  }
};

export default function Home() {
  const badgeRef = useRef(null);
  const word1Ref = useRef(null);
  const word2Ref = useRef(null);
  const word3Ref = useRef(null);
  const freeTagRef = useRef(null);
  const appNameRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "back.out(1.7)", duration: 1 } });

    // Badge animation
    tl.fromTo(badgeRef.current, 
      { y: -50, opacity: 0, scale: 0.5, rotation: -15 },
      { y: 0, opacity: 1, scale: 1, rotation: -1, delay: 0.2 }
    );

    // Words animation (staggered)
    const words = [word1Ref.current, word2Ref.current, word3Ref.current];
    tl.fromTo(words, 
      { y: 50, opacity: 0, rotation: 10 },
      { y: 0, opacity: 1, rotation: 0, stagger: 0.15, ease: "elastic.out(1, 0.75)" },
      "-=0.5"
    );

    // "100% Free" tag pop in
    tl.fromTo(freeTagRef.current,
      { scale: 0, rotation: -15, opacity: 0 },
      { scale: 1, rotation: -2, opacity: 1, ease: "elastic.out(1, 0.5)" },
      "-=0.5"
    );

    // "AI Staging App" slide in
    tl.fromTo(appNameRef.current,
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, ease: "power3.out" },
      "-=0.8"
    );

    // Subtitle
    tl.fromTo(subtitleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, ease: "power3.out" },
      "-=0.6"
    );

    // CTA
    tl.fromTo(ctaRef.current,
      { y: 30, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1 },
      "-=0.6"
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Navigation */}
      <Navigation />

      {/* Hero Section Container */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Background gradient removed for cleaner look */}
        
        {/* Hero Content with padding-top to account for fixed navigation */}
        <div className="relative pt-24 min-h-screen">

          {/* Floating 3D Objects - positioned relative to hero section */}
          {/* <Floating3DModel 
            position={{ top: '8rem', left: '8rem' }}
            size="md"
            modelPath="/models/lamp.glb"
            rotation={[0.1, 0.5, 0]}
            scale={3}
          />
          
          <Floating3DModel 
            position={{ top: '5rem', right: '20%' }}
            size="md"
            modelPath="/models/chair.glb"
            rotation={[0.1, -0.2, 0.35]}
            scale={2.5}
          />

          <Floating3DModel 
            position={{ top: '60%', left: '6rem' }}
            size="xxl"
            modelPath="/models/bed.glb"
            rotation={[0.4, 0.8, 0]}
            scale={3}
          />

          <Floating3DModel 
            position={{ top: '80%', right: '20%' }}
            size="lg"
            modelPath="/models/cactus.glb"
            scale={2}
          /> */}

          {/* <Floating3DModel 
            position={{ top: '50%', right: '8%' }}
            size="lg"
            modelPath="/models/table.glb"
            rotation={[0.1, -0.5, 0]}
            scale={2.8}
          /> */}

          {/* Wiggly Lines - positioned relative to hero section */}
          {/* <WigglyLine 
            position={{ top: '50%', left: '20%' }}
            rotation="20deg"
            vectorNumber={1}
            opacity={1}
            scale={0.3}
          />
          
          <WigglyLine 
            position={{ top: '20%', right: '10%' }}
            rotation="-15deg"
            vectorNumber={2}
            opacity={1}
            scale={0.3}
          />
          
          <WigglyLine 
            position={{ top: '75%', right: '30%' }}
            rotation="30deg"
            vectorNumber={3}
            opacity={1}
            scale={0.3}
          /> */}

          {/* Main Content */}
          <main className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-8 text-center">
            {/* Badge */}
            <div ref={badgeRef} className="bg-white px-6 py-2 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-sm mb-8 font-bold tracking-wide transform -rotate-1 opacity-0">
              ✨ #1 AI STAGING APP
            </div>

            {/* Main heading */}
            <h1 className="font-brand text-[#1a1a1a] text-5xl md:text-6xl lg:text-7xl font-bold mb-8 max-w-5xl leading-[1.1] tracking-tight">
              <div className="inline-block overflow-hidden">
                <span ref={word1Ref} className="inline-block opacity-0">Stage</span>
              </div>{' '}
              <div className="inline-block overflow-hidden">
                <span ref={word2Ref} className="inline-block opacity-0">Your</span>
              </div>{' '}
              <div className="inline-block overflow-hidden">
                <span ref={word3Ref} className="inline-block opacity-0">Listing</span>
              </div>
              <br />
              <div className="mt-2 flex flex-wrap justify-center items-center gap-3">
                <span ref={freeTagRef} className="bg-[#FACC15] text-black px-4 py-1 rounded-lg transform -rotate-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-0">
                  100% Free
                </span>
                <span ref={appNameRef} className="opacity-0">AI Staging App</span>
              </div>
            </h1>

            {/* Subtitle */}
            <p ref={subtitleRef} className="text-gray-700 text-lg md:text-xl mb-12 max-w-2xl leading-relaxed font-medium opacity-0">
              AI Staging App is the most powerful free platform for real estate agents and homeowners.<br />
              Transform empty rooms into stunning spaces and visualize beautiful interiors instantly with artificial intelligence.
            </p>

            {/* CTA Button */}
            <div ref={ctaRef} className="transform hover:-translate-y-1 transition-transform duration-200 opacity-0">
              <AuthButton size="lg" hoverColor="bg-purple-400" redirectTo="/upload">
                Get Started
              </AuthButton>
            </div>
          </main>

  
        </div>
      </section>

      {/* Image Viewer Section */}
      <section id="features">
        <ImageViewer />
      </section>

      {/* Upload Section */}
      <section id="gallery">
        <UploadSection />
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <PricingSection />
      </section>

      {/* FAQ Section */}
      <section id="faq">
        <FAQSection />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
