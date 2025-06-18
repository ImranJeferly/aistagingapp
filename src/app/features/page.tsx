import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-5 w-5 text-green-500"} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const features = [
  {
    title: "Instant AI Staging",
    description: "Transform empty rooms in 30 seconds with professional-quality AI staging.",
    icon: "🚀"
  },
  {
    title: "Multiple Design Styles",
    description: "Choose from modern, traditional, minimalist, and luxury interior design styles.",
    icon: "🎨"
  },
  {
    title: "High-Resolution Output",
    description: "Get professional-quality staged images ready for MLS listings and marketing.",
    icon: "📸"
  },
  {
    title: "Easy Upload",
    description: "Simple drag-and-drop interface. No design experience required.",
    icon: "📤"
  },
  {
    title: "Real Estate Focused",
    description: "Specifically designed for real estate agents and property marketing.",
    icon: "🏠"
  },
  {
    title: "Cost Effective",
    description: "Save thousands compared to traditional staging. Start with 5 free images.",
    icon: "💰"
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful AI Staging Features
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Everything you need to create stunning staged photos for your real estate listings. 
              Professional results without the professional cost.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="bg-blue-50 rounded-2xl p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Why Choose AI Staging?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Save 90% compared to traditional staging",
                "Get results in seconds, not days",
                "No physical furniture or logistics",
                "Perfect for vacant properties",
                "Multiple style options for every taste",
                "Professional quality guaranteed"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Listings?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Start with 5 free staged images. No credit card required.
            </p>
            <a
              href="/upload"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Start Staging Now
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
