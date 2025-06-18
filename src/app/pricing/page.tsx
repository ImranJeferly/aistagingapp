import Navigation from '../../components/Navigation';
import PricingSection from '../../components/PricingSection';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Navigation />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumbs items={[{ label: 'Pricing', href: '/pricing' }]} />
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">
              Choose Your AI Staging Plan
            </h1>
            <p className="text-xl text-blue-700 max-w-3xl mx-auto">
              Transform your real estate listings with professional AI staging. 
              Start free and upgrade as your business grows.
            </p>
          </div>
          <PricingSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
