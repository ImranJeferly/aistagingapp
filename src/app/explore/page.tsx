'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { exploreService } from '@/services/exploreService';

const visualPatterns = [
  { color: "bg-blue-100", pattern: "radial-gradient(circle at 50% 50%, #e0f2fe 10%, transparent 10%)" },
  { color: "bg-orange-100", pattern: "repeating-linear-gradient(45deg, #ffedd5 0px, #ffedd5 10px, transparent 10px, transparent 20px)" },
  { color: "bg-gray-200", pattern: "linear-gradient(0deg, #e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)" },
  { color: "bg-green-100", pattern: "radial-gradient(circle at 100% 100%, #dcfce7 15%, transparent 15%), radial-gradient(circle at 0% 0%, #dcfce7 15%, transparent 15%)" },
  { color: "bg-purple-100", pattern: "repeating-radial-gradient(circle at 0 0, transparent 0, #f3e8ff 10px, transparent 20px)" },
  { color: "bg-yellow-100", pattern: "conic-gradient(from 0deg at 50% 50%, #fef9c3 0deg, transparent 60deg, #fef9c3 120deg, transparent 180deg)" }
];

export default function ExplorePage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const approvedImages = await exploreService.getStagedImagesByStatus('approved', 100);
        
        const galleryImages = approvedImages.map((img, index) => {
          const pattern = visualPatterns[index % visualPatterns.length];
          return {
            id: img.id,
            title: `${img.roomType || 'Room'} Makeover`,
            author: img.userName || `User ${img.userId.substring(0,6)}`,
            style: img.designStyle || 'Modern',
            likes: Math.floor(Math.random() * 300) + 50,
            imageUrl: img.imageUrl,
            beforeImage: img.originalImageUrl,
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
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <Navigation />
      
      <div className="flex-1 pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Animation */}
        <div 
          className="absolute inset-0 opacity-[0.1] pointer-events-none"
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

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h1 className="font-brand text-5xl md:text-6xl font-bold text-black mb-6">
              Explore <span className="inline-block px-4 bg-orange-400 text-black rounded-lg border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">Everything</span>
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              Browse through the complete collection of amazing room transformations.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : images.length === 0 ? (
             <div className="text-center py-24">
                <p className="text-xl text-gray-500">No images found.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {images.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group relative bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all duration-300"
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className={`h-64 w-full ${item.color} relative overflow-hidden border-b-2 border-black`}>
                    {item.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                       <div 
                         className="absolute inset-0 opacity-60" 
                         style={{ backgroundImage: item.pattern, backgroundSize: '20px 20px' }} 
                       />
                    )}

                    <div className={`absolute inset-0 bg-black/10 flex items-center justify-center transition-opacity duration-300 ${hoveredId === item.id ? 'opacity-100' : 'opacity-0'}`}>
                      <a 
                        href={`/explore/${item.id}`}
                        className="bg-white text-black font-bold py-2 px-6 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:scale-105 transition-transform"
                      >
                        View Details
                      </a>
                    </div>
                    
                    <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-bold font-brand">
                      {item.style}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {/* Removed Title as per request for consistency with home */}
                        <p className="text-lg text-gray-800 font-bold">by {item.author}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
