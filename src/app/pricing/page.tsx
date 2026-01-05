import Navigation from '../../components/Navigation';
import PricingSection from '../../components/PricingSection';
import Footer from '../../components/Footer';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#E0F2FE]">
      <Navigation />
      <main className="pt-32">
        <div className="">
          
          <PricingSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
