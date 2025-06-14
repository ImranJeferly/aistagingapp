import Navigation from '../components/Navigation';
import Button from '../components/Button';
import FloatingElement from '../components/FloatingElement';
import Badge from '../components/Badge';

export default function Home() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-purple-50/30 to-gray-100"></div>
      
      {/* Navigation */}
      <Navigation />

      {/* Main Content - Add padding-top to account for fixed navigation */}
      <div className="pt-24">

      {/* Floating 3D Objects */}
      <FloatingElement 
        position={{ top: '8rem', left: '8rem' }}
        size="sm"
        imageSrc="/lamp.png"
        imageAlt="3D Lamp"
        animationDelay="0s"
      />
      
      <FloatingElement 
        position={{ top: '5rem', right: '20%' }}
        size="md"
        imageSrc="/chair.png"
        imageAlt="3D Chair"
        animationDelay="1.5s"
      />

      <FloatingElement 
        position={{ bottom: '8rem', left: '6rem' }}
        size="xl"
        imageSrc="/bed.png"
        imageAlt="3D Bed"
        animationDelay="3s"
      />

      <FloatingElement 
        position={{ bottom: '6rem', right: '6rem' }}
        size="sm"
        imageSrc="/plant.png"
        imageAlt="3D Plant"
        animationDelay="4.2s"
      />

      <FloatingElement 
        position={{ top: '50%', right: '8%' }}
        size="md"
        imageSrc="/table.png"
        imageAlt="3D Table"
        animationDelay="2.7s"
      />

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
        <Button size="lg" hoverColor="bg-purple-400">
          Get Started
        </Button>
      </main>

      {/* Made in Framer badge */}
      <Badge>
        Made in Framer
      </Badge>
      
      </div> {/* Close the padding div */}
    </div>
  );
}
