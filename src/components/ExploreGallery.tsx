'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const galleryItems = [
  {
    id: 1,
    title: "Modern Minimalist Living",
    author: "Sarah J.",
    style: "Modern",
    likes: 124,
    color: "bg-blue-100",
    pattern: "radial-gradient(circle at 50% 50%, #e0f2fe 10%, transparent 10%)" // Light blue dots
  },
  {
    id: 2,
    title: "Boho Chic Bedroom",
    author: "Mike R.",
    style: "Bohemian",
    likes: 89,
    color: "bg-orange-100",
    pattern: "repeating-linear-gradient(45deg, #ffedd5 0px, #ffedd5 10px, transparent 10px, transparent 20px)" // Orange stripes
  },
  {
    id: 3,
    title: "Industrial Loft Kitchen",
    author: "Alex D.",
    style: "Industrial",
    likes: 256,
    color: "bg-gray-200",
    pattern: "linear-gradient(0deg, #e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)" // Grid
  },
  {
    id: 4,
    title: "Scandi Home Office",
    author: "Emma W.",
    style: "Scandinavian",
    likes: 167,
    color: "bg-green-100",
    pattern: "radial-gradient(circle at 100% 100%, #dcfce7 15%, transparent 15%), radial-gradient(circle at 0% 0%, #dcfce7 15%, transparent 15%)" // Green corners
  },
  {
    id: 5,
    title: "Luxury Penthouse",
    author: "David K.",
    style: "Luxury",
    likes: 342,
    color: "bg-purple-100",
    pattern: "repeating-radial-gradient(circle at 0 0, transparent 0, #f3e8ff 10px, transparent 20px)" // Purple ripples
  },
  {
    id: 6,
    title: "Cozy Reading Nook",
    author: "Lisa M.",
    style: "Cozy",
    likes: 95,
    color: "bg-yellow-100",
    pattern: "conic-gradient(from 0deg at 50% 50%, #fef9c3 0deg, transparent 60deg, #fef9c3 120deg, transparent 180deg)" // Yellow burst
  }
];

export default function ExploreGallery() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 py-24">
      <div className="text-center mb-16 relative">
        <h2 className="font-brand text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
          Explore <span className="inline-block px-4 bg-orange-400 text-black rounded-lg border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">Creations</span>
        </h2>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
          See what others are creating. Get inspired by thousands of staged rooms from our community.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {galleryItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: item.id * 0.1 }}
            className="group relative bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all duration-300"
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Image Placeholder Area */}
            <div className={`h-64 w-full ${item.color} relative overflow-hidden border-b-2 border-black`}>
              <div 
                className="absolute inset-0 opacity-60"
                style={{ 
                  backgroundImage: item.pattern,
                  backgroundSize: '20px 20px' 
                }}
              />
              
              {/* "View" Overlay */}
              <div className={`absolute inset-0 bg-black/10 flex items-center justify-center transition-opacity duration-300 ${hoveredId === item.id ? 'opacity-100' : 'opacity-0'}`}>
                <button className="bg-white text-black font-bold py-2 px-6 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:scale-105 transition-transform">
                  View Details
                </button>
              </div>

              {/* Style Tag */}
              <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-bold font-brand">
                {item.style}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-brand text-xl font-bold text-black leading-tight mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 font-bold">by {item.author}</p>
                </div>
                <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-red-500">❤️</span>
                  <span className="text-xs font-bold">{item.likes}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center mt-12">
        <button className="inline-flex items-center px-8 py-4 bg-white border-2 border-black text-lg font-bold rounded-xl text-black hover:bg-gray-50 transition-all transform hover:-translate-y-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          View All Creations
          <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
