"use client";

import React, { useState } from 'react';
import FloatingElement from './FloatingElement';
import WigglyLine from './WigglyLine';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is AI staging and how does it work?",
    answer: "AI staging uses artificial intelligence to digitally furnish and decorate empty rooms in real estate photos. Our advanced AI analyzes your room photos and automatically adds furniture, decor, and styling to make spaces look more appealing to potential buyers or renters."
  },
  {
    question: "How long does AI staging take?",
    answer: "Our AI staging process is incredibly fast! Most images are processed and staged within 30 seconds. You'll receive your professionally staged photos almost instantly after uploading."
  },
  {
    question: "What types of rooms can be staged with AI?",
    answer: "We support all major room types including living rooms, bedrooms, kitchens, dining rooms, bathrooms, offices, basements, and outdoor spaces. Our AI is trained on thousands of interior design styles and can adapt to any space."
  },
  {
    question: "Is AI staging really free?",
    answer: "Yes! We're currently in beta and offering completely free AI staging with up to 3 images per day. No credit card required, no hidden fees, and no watermarks on your staged photos."
  },
  {
    question: "How does AI staging compare to traditional staging?",
    answer: "AI staging is 95% faster and 90% more cost-effective than traditional staging. While traditional staging can cost $2,000-$5,000 and take weeks, AI staging costs $0 and takes 30 seconds, making it perfect for any budget."
  },
  {
    question: "What image formats and sizes are supported?",
    answer: "We support JPG, PNG, and WEBP formats. Images should be at least 512x512 pixels for best results. We can process images up to 4K resolution and will output high-quality staged photos perfect for listings."
  },
  {
    question: "Can I choose specific furniture styles for my staged rooms?",
    answer: "Our AI automatically selects the most appropriate furniture and decor based on the room type, lighting, and architectural features. We use modern, contemporary styles that appeal to the widest range of potential buyers."
  },
  {
    question: "How accurate is AI staging compared to real furniture?",
    answer: "Our AI staging is photorealistic and indistinguishable from real furniture in photos. The AI considers lighting, shadows, perspective, and room proportions to create incredibly realistic staged images."
  },
  {
    question: "Can AI staging help sell my property faster?",
    answer: "Studies show that staged homes sell 73% faster than unstaged homes. AI staging provides the same visual appeal as traditional staging, helping potential buyers envision themselves in the space and increasing interest in your property."
  },
  {
    question: "Do I own the rights to my AI staged images?",
    answer: "Yes! You retain full ownership and commercial rights to all staged images. You can use them in listings, marketing materials, social media, and any other promotional purposes without restrictions."
  },
  {
    question: "What if I'm not satisfied with the AI staging results?",
    answer: "While our AI is highly accurate, if you're not satisfied with the results, you can upload a different angle or lighting of the same room, or try staging a different room. We're constantly improving our AI to deliver better results."
  },
  {
    question: "Can real estate agents use AI staging for multiple clients?",
    answer: "Absolutely! Real estate agents love our platform for quickly staging multiple properties. With 3 free images per day, agents can efficiently stage key rooms across different listings to maximize their marketing impact."
  },
  {
    question: "Is my uploaded data secure and private?",
    answer: "Yes, we take privacy seriously. Your uploaded images are processed securely and automatically deleted from our servers after 30 days. We never share your images or data with third parties."
  },
  {
    question: "Can AI staging work with poorly lit or low-quality photos?",
    answer: "Our AI works best with well-lit, clear photos, but it can enhance and stage even challenging images. For optimal results, we recommend bright, natural lighting and multiple angles of each room."
  },
  {
    question: "Will there be paid plans in the future?",
    answer: "We may introduce premium features in the future, but our core AI staging service will always remain free. Any future paid plans would include additional features like bulk processing, priority support, or advanced customization options."
  },
  {
    question: "Can I stage the same room multiple times with different styles?",
    answer: "Each upload is processed independently, so you can upload the same room multiple times to see different staging variations. This helps you find the perfect look for your property marketing."
  },
  {
    question: "Does AI staging work for commercial properties?",
    answer: "Yes! Our AI can stage office spaces, retail locations, restaurants, and other commercial properties. The AI adapts to create appropriate professional environments that help commercial properties attract tenants."
  },
  {
    question: "How does AI staging help with property photography?",
    answer: "AI staging transforms empty, cold spaces into warm, inviting homes in photos. This dramatically improves your property photography without the cost and logistics of traditional staging, making every listing photo more compelling."
  },
  {
    question: "Can I use AI staged photos on MLS listings?",
    answer: "Yes, AI staged photos can be used on MLS listings, Zillow, Realtor.com, and other platforms. Many agents note when photos are virtually staged to maintain transparency with potential buyers."
  },
  {
    question: "What makes your AI staging better than competitors?",
    answer: "Our AI staging offers the perfect combination of speed (30 seconds), quality (photorealistic results), price (completely free), and convenience (no account required). Plus, we support all room types with no watermarks or restrictions."
  }
];

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="relative py-16 md:py-24 bg-gray-50 overflow-hidden">
      {/* Floating Elements */}
      <FloatingElement 
        position={{ top: '10%', left: '5%' }}
        size="sm"
        imageSrc="/chair.png"
        imageAlt="3D Chair"
        animationDelay="0.5s"
        rotation="15deg"
      />

      <FloatingElement 
        position={{ top: '70%', right: '8%' }}
        size="md"
        imageSrc="/plant.png"
        imageAlt="3D Plant"
        animationDelay="1.8s"
        rotation="-25deg"
        blur={true}
      />

      {/* Wiggly Lines */}
      <WigglyLine 
        position={{ top: '20%', right: '15%' }}
        rotation="45deg"
        vectorNumber={2}
        opacity={0.3}
        scale={0.4}
      />

      <WigglyLine 
        position={{ bottom: '25%', left: '10%' }}
        rotation="-30deg"
        vectorNumber={4}
        opacity={0.4}
        scale={0.3}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Questions</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about AI staging for real estate
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between  transition-colors duration-200 hover:bg-gray-50"
              >
                <span className="text-lg font-semibold text-gray-900 pr-4">
                  {item.question}
                </span>
                <div className="flex-shrink-0">
                  <svg
                    className={`w-6 h-6 text-purple-600 transition-transform duration-300 ${
                      openItems.includes(index) ? 'rotate-180' : 'rotate-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openItems.includes(index) 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-5">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-gray-600 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}        </div>
      </div>
    </section>
  );
}
