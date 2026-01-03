import Navigation from '../../components/Navigation';
import PricingSection from '../../components/PricingSection';
import Footer from '../../components/Footer';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Navigation />
      <main className="pt-30">
        <div className="">
          
          <PricingSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
