'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { exploreService, StagedImage } from '@/services/exploreService';

// Fallback for visual variety
const visualPatterns = [
  { color: "bg-blue-100", pattern: "radial-gradient(circle at 50% 50%, #e0f2fe 10%, transparent 10%)" },
  { color: "bg-orange-100", pattern: "repeating-linear-gradient(45deg, #ffedd5 0px, #ffedd5 10px, transparent 10px, transparent 20px)" },
  { color: "bg-gray-200", pattern: "linear-gradient(0deg, #e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)" },
  { color: "bg-green-100", pattern: "radial-gradient(circle at 100% 100%, #dcfce7 15%, transparent 15%), radial-gradient(circle at 0% 0%, #dcfce7 15%, transparent 15%)" },
  { color: "bg-purple-100", pattern: "repeating-radial-gradient(circle at 0 0, transparent 0, #f3e8ff 10px, transparent 20px)" },
  { color: "bg-yellow-100", pattern: "conic-gradient(from 0deg at 50% 50%, #fef9c3 0deg, transparent 60deg, #fef9c3 120deg, transparent 180deg)" }
];

export default function ExploreGallery() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const approvedImages = await exploreService.getStagedImagesByStatus('approved', 6);
        
        // Transform to gallery format
        const galleryImages = approvedImages.map((img, index) => {
          const pattern = visualPatterns[index % visualPatterns.length];
          return {
            id: img.id,
            title: `${img.roomType || 'Room'} Makeover`,
            author: '', // Hidden in UI
            style: img.designStyle || 'Modern',
            likes: Math.floor(Math.random() * 300) + 50, // Mock likes for now
            imageUrl: img.imageUrl,
            beforeImage: img.originalImageUrl, // Keep track of before image if needed
            color: pattern.color,
            pattern: pattern.pattern
          };
        });
        
        setImages(galleryImages);
      } catch (error) {
        console.error("Failed to load explore gallery", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-[#FFFCF5] py-24">
      {/* Animated Diagonal Lines Background */}
      <div 
        className="absolute inset-0 opacity-[0.1] pointer-events-none overflow-hidden"
      >
        <div 
           className="absolute inset-0 w-[200%] h-[200%]"
           style={{
             backgroundImage: 'linear-gradient(45deg, #F97316 25%, transparent 25%, transparent 50%, #F97316 50%, #F97316 75%, transparent 75%, transparent)',
             backgroundSize: '160px 160px',
             animation: 'exploreStripeMove 15s linear infinite'
           }}
        />
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes exploreStripeMove {
          0% { background-position: 0 0; }
          100% { background-position: -160px 160px; }
        }
      `}} />

      <div className="relative z-10 w-full max-w-7xl mx-auto p-4">
        <div className="text-center mb-16 relative">
          <h2 className="font-brand text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Explore <span className="inline-block px-4 bg-orange-400 text-black rounded-lg border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">Creations</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
            See what others are creating. Get inspired by thousands of staged rooms from our community.
          </p>
        </div>

        {loading ? (
             <div className="flex justify-center items-center h-96">
                <div className="space-y-4 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-r-transparent"></div>
                    <p className="font-bold text-lg animate-pulse">Loading gallery...</p>
                </div>
            </div>
        ) : images.length === 0 ? (
             <div className="py-12 text-center bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto">
                <p className="font-bold">No approved images found.</p>
             </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {images.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all duration-300"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Image Placeholder Area */}
                <div className={`h-80 w-full ${item.color} relative overflow-hidden`}>
                  {item.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div 
                      className="absolute inset-0 opacity-60"
                      style={{ 
                        backgroundImage: item.pattern,
                        backgroundSize: '20px 20px' 
                      }}
                    />
                  )}
                  
                  {/* "View" Overlay */}
                  <div className={`absolute inset-0 bg-black/10 flex items-center justify-center transition-opacity duration-300 ${hoveredId === item.id ? 'opacity-100' : 'opacity-0'}`}>
                    <a 
                      href={`/explore/${item.id}`}
                      className="bg-white text-black font-bold py-2 px-6 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:scale-105 transition-transform"
                    >
                      View Details
                    </a>
                  </div>

                  {/* Style Tag */}
                  <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-bold font-brand">
                    {item.style}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      
        <div className="text-center mt-12">
          <a href="/explore" className="inline-flex items-center px-8 py-4 bg-white border-2 border-black text-lg font-bold rounded-xl text-black hover:bg-gray-50 transition-all transform hover:-translate-y-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            View All Creations
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
