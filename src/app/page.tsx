'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import gsap from 'gsap';
import { exploreService, StagedImage } from '../services/exploreService';
import Navigation from '../components/Navigation';
import Button from '../components/Button';
import AuthButton from '../components/AuthButton';
import ComparisonViewer from '../components/ComparisonViewer';
// import FloatingElement from '../components/FloatingElement';
// import Floating3DModel from '../components/Floating3DModel';
import Badge from '../components/Badge';
import WigglyLine from '../components/WigglyLine';
import ImageViewer from '../components/ImageViewer';
import UploadSection from '../components/UploadSection';
import PricingSection from '../components/PricingSection';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';
import ExploreGallery from '../components/ExploreGallery';
import TestimonialsSection from '../components/TestimonialsSection';

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
  const { isAuthenticated, isLoading, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [heroImage, setHeroImage] = useState<StagedImage | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs for animation
  const badgeRef = useRef(null);
  const word1Ref = useRef(null);
  const word2Ref = useRef(null);
  const word3Ref = useRef(null);
  const freeTagRef = useRef(null);
  const appNameRef = useRef(null);
  const subTitleRef = useRef(null);
  const ctaRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    // Check if this is the first visit in this session (direct entry)
    const hasVisited = sessionStorage.getItem('app_session_active');
    if (!hasVisited) {
      setIsFirstVisit(true);
    }

    // Fetch random image
    const fetchRandomHeroImage = async () => {
      try {
        const images = await exploreService.getStagedImagesByStatus('approved', 50);
        if (images.length > 0) {
          const validImages = images.filter(img => img.originalImageUrl && img.imageUrl);
          if (validImages.length > 0) {
            const randomIndex = Math.floor(Math.random() * validImages.length);
            setHeroImage(validImages[randomIndex]);
          }
        }
      } catch (error) {
        console.error("Error fetching hero images:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRandomHeroImage();
  }, []);

  useEffect(() => {
    // Only redirect if authenticated AND it's the first visit (direct entry)
    if (!isLoading && isAuthenticated && isFirstVisit) {
      router.push('/upload');
    }
  }, [isAuthenticated, isLoading, router, isFirstVisit]);

  useEffect(() => {
    const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 } });

        // Badge animation
        if (badgeRef.current) {
            tl.fromTo(badgeRef.current, 
                { y: 20, autoAlpha: 0 }, 
                { y: 0, autoAlpha: 1, delay: 0.2 }
            );
        }

        // Words animation (staggered)
        const words = [word1Ref.current, word2Ref.current, word3Ref.current].filter(Boolean);
        if (words.length > 0) {
            tl.fromTo(words, 
                { y: 50, autoAlpha: 0, rotation: 10 },
                { y: 0, autoAlpha: 1, rotation: 0, stagger: 0.15, ease: "elastic.out(1, 0.75)" },
                "-=0.7"
            );
        }

        // "100% Free" tag pop in
        if (freeTagRef.current) {
            tl.fromTo(freeTagRef.current,
                { scale: 0, rotation: -15, autoAlpha: 0 },
                { scale: 1, rotation: -2, autoAlpha: 1, ease: "elastic.out(1, 0.5)" },
                "-=0.5"
            );
        }

        // "AI Staging App" slide in
        if (appNameRef.current) {
            tl.fromTo(appNameRef.current,
                { x: 50, autoAlpha: 0 },
                { x: 0, autoAlpha: 1, ease: "power3.out" },
                "-=0.8"
            );
        }

        // Subtitle
        if (subTitleRef.current) {
            tl.fromTo(subTitleRef.current,
                { y: 20, autoAlpha: 0 },
                { y: 0, autoAlpha: 1 },
                "-=0.6"
            );
        }

        // CTA
        if (ctaRef.current) {
            tl.fromTo(ctaRef.current,
                { y: 20, autoAlpha: 0 },
                { y: 0, autoAlpha: 1 },
                "-=0.6"
            );
        }
        
        // Image Side
        if (imageRef.current) {
            tl.fromTo(imageRef.current,
                { x: 50, autoAlpha: 0 },
                { x: 0, autoAlpha: 1, duration: 1.2 },
                "-=1"
            );
        }
    });

    return () => ctx.revert();
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
        <div className="relative pt-24 min-h-screen flex flex-col justify-center">

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
          <main className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 w-[90%] max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-24">
            {/* Left Content */}
            <div className="flex-1 text-left z-10 w-full lg:w-1/2">
                <div ref={badgeRef} className="inline-block mb-6" style={{ opacity: 0 }}>
                    <span className="bg-white px-4 py-1.5 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-sm font-bold tracking-wide transform -rotate-2 inline-block">
                        ✨ #1 AI Staging App
                    </span>
                </div>

                <div>
                    <h1 className="font-brand text-[#1a1a1a] text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight text-left">
                        <div className="inline-block overflow-hidden">
                            <span ref={word1Ref} className="inline-block" style={{ opacity: 0 }}>Stage</span>
                        </div>{' '}
                        <div className="inline-block overflow-hidden">
                            <span ref={word2Ref} className="inline-block" style={{ opacity: 0 }}>Your</span>
                        </div>{' '}
                        <div className="inline-block overflow-hidden">
                            <span ref={word3Ref} className="inline-block" style={{ opacity: 0 }}>Listing</span>
                        </div>
                        <br />
                        <div className="mt-2 flex flex-wrap justify-start items-center gap-3">
                            <span ref={freeTagRef} className="bg-[#FACC15] text-black px-4 py-1 rounded-md transform -rotate-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{ opacity: 0 }}>
                                100% Free
                            </span>
                            <span ref={appNameRef} style={{ opacity: 0 }}>AI Staging App</span>
                        </div>
                    </h1>
                </div>

                <p ref={subTitleRef} className="text-gray-700 text-base md:text-lg mb-10 max-w-xl leading-relaxed font-medium" style={{ opacity: 0 }}>
                    Transform empty rooms into irresistible living spaces in seconds using our advanced AI technology. No expensive furniture rentals required.
                </p>

                <div ref={ctaRef} className="flex flex-wrap gap-4" style={{ opacity: 0 }}>
                    <AuthButton 
                        size="lg" 
                        className="!px-8 !py-4 !text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                        redirectTo="/upload"
                    >
                        Start Staging Free
                    </AuthButton>
                    {!isAuthenticated && (
                        <Button
                            variant="secondary"
                            size="lg"
                            className="!px-8 !py-4 !text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                            onClick={async () => {
                                await loginWithGoogle();
                                router.push('/upload');
                            }}
                        >
                            <span className="flex items-center gap-3">
                                <svg className="w-6 h-6 min-w-[24px]" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Sign in with Google
                            </span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Right Content - Comparison/Image */}
            <div ref={imageRef} className="flex-1 w-full lg:w-1/2 relative z-10" style={{ opacity: 0 }}>
                {/* Decorative Elements */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-yellow-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

                {loading ? (
                    <div className="w-full aspect-[4/3] bg-gray-100 rounded-2xl border-4 border-black border-dashed flex items-center justify-center animate-pulse">
                        <p className="font-bold text-gray-400">Loading generative previews...</p>
                    </div>
                ) : heroImage ? (
                    <div className="relative">
                        <div className="rounded-2xl overflow-hidden border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white relative">
                            <ComparisonViewer 
                                beforeImage={heroImage.originalImageUrl || heroImage.imageUrl} 
                                afterImage={heroImage.imageUrl}
                            />
                        </div>
                    </div>
                ) : (

                    // Fallback if no images found
                    <div className="w-full aspect-[4/3] bg-[#E0F2FE] rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-8 text-center">
                        <div>
                            <h3 className="text-2xl font-brand font-bold mb-2">Ready to see magic?</h3>
                            <p className="mb-6">Upload your first photo to see the transformation.</p>
                            <AuthButton 
                                className="inline-block bg-white text-black font-bold px-6 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:-translate-y-1 transition-transform"
                                redirectTo="/upload"
                            >
                                Upload Now
                            </AuthButton>
                        </div>
                    </div>
                )}
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

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Explore Gallery Section */}
      <section>
        <ExploreGallery />
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
