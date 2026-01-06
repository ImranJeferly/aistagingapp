"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import FloatingElement from './FloatingElement';
// import Floating3DModel from './Floating3DModel';
import WigglyLine from './WigglyLine';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is AI staging and how does it work?",
    answer: "AI staging uses advanced artificial intelligence to digitally furnish empty rooms in real estate photos. Our technology analyzes your room's dimensions and lighting to automatically place realistic furniture and decor, transforming vacant spaces into beautiful, inviting homes in seconds."
  },
  {
    question: "Is AI staging really free?",
    answer: "Yes! We offer a Free Tier that includes 5 high-quality staged images so you can experience the magic of AI staging at no cost. For professional real estate agents and high-volume users, we offer affordable monthly plans starting at just $15/month."
  },
  {
    question: "How long does the process take?",
    answer: "Our AI is incredibly fast! While traditional virtual staging takes days, our AI processes and stages your images in about 30 seconds. You can stage an entire home in minutes and have listing-ready photos instantly."
  },
  {
    question: "Can I choose different interior design styles?",
    answer: "Absolutely! You can select from a variety of popular interior design styles including Modern, Contemporary, Scandinavian, Traditional, Industrial, and Bohemian. This allows you to tailor the look to match the property's architecture and target buyer."
  },
  {
    question: "What is the difference between the Free and Pro plans?",
    answer: "The Free plan is perfect for trying out the service with 5 lifetime images. Our Pro plans unlock monthly allowances (up to 50 images/month), access to 4K High-Quality resolution, priority processing, and commercial usage rights for all generated images."
  },
  {
    question: "Do I own the commercial rights to the images?",
    answer: "Yes, you retain full ownership and commercial rights to all images you generate on our platform. You are free to use them on MLS, Zillow, social media, and all marketing materials without any additional fees or royalties."
  },
  {
    question: "What types of rooms can be staged?",
    answer: "We support all major room types including Living Rooms, Bedrooms, Kitchens, Dining Rooms, Home Offices, and even Outdoor spaces like Patios. Our AI understands the specific furniture requirements for each room type."
  },
  {
    question: "What are the image requirements?",
    answer: "For best results, upload clear, well-lit photos in JPG, PNG, or WEBP format. We support resolutions up to 4K. Our AI works best with empty rooms, but can also handle rooms with existing furniture (though results vary)."
  },
  {
    question: "Is it cheaper than traditional virtual staging?",
    answer: "Significantly! Traditional manual virtual staging can cost $30-$100 per photo and takes days. Our AI staging costs less than $1 per image on paid plans and is completed in seconds, saving you thousands of dollars and hours of time."
  },
  {
    question: "Can I use these photos for real estate listings?",
    answer: "Yes, our AI-staged photos are specifically designed for real estate marketing. They are realistic, high-resolution, and formatted perfectly for MLS listings and property marketing platforms."
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
    <section className="relative py-20 bg-[#FDF4FF] overflow-hidden">
      {/* Wavy Background Animation */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='200' viewBox='0 0 400 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 80 C 100 80 100 120 200 120 S 300 80 400 80' fill='none' stroke='%23d946ef' stroke-width='100'/%3E%3C/svg%3E")`,
            backgroundSize: '800px 400px',
            animation: 'waveSlide 20s linear infinite'
          }}
        />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes waveSlide {
            from { background-position: 0 0; }
            to { background-position: 800px 0; }
          }
        `}} />
      </div>
      {/* Floating Elements */}
      {/* <Floating3DModel 
        modelPath="/models/chair2.glb"
        position={{ top: '10%', left: '5%' }}
        size="lg"
        rotation={[0.1, 0.2, 0]}
      />

      <Floating3DModel 
        modelPath="/models/plant2.glb"
        position={{ top: '70%', right: '8%' }}
        size="lg"
        rotation={[0, -0.5, 0]}
      /> */}

      {/* Wiggly Lines */}
      {/* <WigglyLine 
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
      /> */}

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black font-brand text-[#1a1a1a] mb-4">
            Frequently Asked <span className="inline-block bg-[#FF90E8] px-4 py-1 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-2">Questions</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-800 max-w-3xl mx-auto font-medium">
            Everything you need to know about AI staging for real estate
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between transition-colors duration-200 hover:bg-gray-50"
              >
                <span className="text-lg font-bold font-brand text-black pr-4">
                  {item.question}
                </span>
                <div className="flex-shrink-0">
                  <motion.div
                    animate={{ rotate: openItems.includes(index) ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-8 h-8 bg-[#FACC15] border-2 border-black rounded-full flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </motion.div>
                </div>
              </button>
              
              <AnimatePresence>
                {openItems.includes(index) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-5">
                      <div className="border-t-2 border-black pt-4 border-dashed">
                        <p className="text-gray-800 leading-relaxed font-medium">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
