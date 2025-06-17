import Navigation from '../components/Navigation';
import Button from '../components/Button';
import AuthButton from '../components/AuthButton';
import FloatingElement from '../components/FloatingElement';
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
  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Navigation */}
      <Navigation />

      {/* Hero Section Container */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Background gradient for hero only */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-purple-50/30 to-gray-100"></div>
        
        {/* Hero Content with padding-top to account for fixed navigation */}
        <div className="relative pt-24 min-h-screen">

          {/* Floating 3D Objects - positioned relative to hero section */}
          <FloatingElement 
            position={{ top: '8rem', left: '8rem' }}
            size="sm"
            imageSrc="/lamp.png"
            imageAlt="3D Lamp"
            animationDelay="0s"
            rotation="20deg"
          />
          
          <FloatingElement 
            position={{ top: '5rem', right: '20%' }}
            size="md"
            imageSrc="/chair.png"
            imageAlt="3D Chair"
            animationDelay="1.5s"
            rotation="20deg"
          />

          <FloatingElement 
            position={{ top: '60%', left: '6rem' }}
            size="xxl"
            imageSrc="/bed.png"
            imageAlt="3D Bed"
            animationDelay="3s"
            blur={true}
            rotation="20deg"
          />

          <FloatingElement 
            position={{ top: '90%', right: '6rem' }}
            size="md"
            imageSrc="/cactus.png"
            imageAlt="3D Plant"
            animationDelay="4.2s"
            blur={true}
            rotation="-20deg"
          />

          <FloatingElement 
            position={{ top: '50%', right: '8%' }}
            size="md"
            imageSrc="/table.png"
            imageAlt="3D Table"
            animationDelay="2.7s"
            rotation="-20deg"
          />

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
            {/* Japanese text */}
            <div className="text-purple-600 text-sm mb-2 tracking-widest font-light">
              AI STAGING APP
            </div>

            {/* Main heading */}
            <h1 className="text-gray-900 text-5xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-4xl leading-tight">
              Stage Your Listing<br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                100% Free AI Staging App
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-gray-600 text-lg md:text-xl mb-12 max-w-2xl leading-relaxed">
              The most powerful AI staging platform that helps you<br />
              visualize and design beautiful interiors instantly
            </p>

            {/* CTA Button */}
            <AuthButton size="lg" hoverColor="bg-purple-400" redirectTo="/upload">
              Get Started
            </AuthButton>
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
