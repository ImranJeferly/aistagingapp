'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function UpscaleFeature() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (event: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in event ? event.touches[0].clientX : event.clientX;
    
    // Calculate position relative to the container
    const position = ((x - rect.left) / rect.width) * 100;
    
    // Clamp between 0 and 100
    setSliderPosition(Math.min(Math.max(position, 0), 100));
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        handleMove(e);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('touchmove', handleGlobalMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="w-full max-w-6xl mx-auto py-16 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <div>
          <div className="inline-block px-4 py-1 bg-purple-100 text-purple-700 rounded-md text-sm font-bold mb-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            New Feature
          </div>
          <h2 className="font-brand text-5xl font-bold text-black mb-6 leading-tight">
            Ultra-Optimized <span className="text-purple-600">Upscaling</span>
          </h2>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed font-medium">
            Don't settle for blurry, low-res outputs. Our proprietary upscaling engine enhances textures, sharpens edges, and delivers print-ready 4K resolution images.
          </p>
          
          <ul className="space-y-4 mb-8">
            {[
              "4K Ultra-HD Resolution Output",
              "Smart Texture Enhancement",
              "Noise Reduction & Sharpening",
              "Perfect for Large Format Printing"
            ].map((item, i) => (
              <motion.li 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center text-gray-800 font-bold"
              >
                <span className="w-8 h-8 rounded-md bg-green-400 text-black border-2 border-black flex items-center justify-center mr-4 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">✓</span>
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Comparison Slider */}
        <div 
          ref={containerRef}
          className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-ew-resize select-none group bg-white"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Layer 1: After Image (Right Side / Background) */}
          {/* This layer is fully visible, but covered by Layer 2 on the left */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-blue-900">
             {/* Simulated High Res Pattern */}
             <div className="absolute inset-0 opacity-30" 
                  style={{ 
                    backgroundImage: 'radial-gradient(circle at center, #fff 1px, transparent 1px)',
                    backgroundSize: '4px 4px'
                  }}>
             </div>
          </div>

          {/* Layer 2: Before Image (Left Side / Foreground) */}
          {/* This layer is clipped based on slider position */}
          <div 
            className="absolute inset-0 bg-gray-200 border-r-2 border-white"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
             {/* Simulated Low Res Pattern */}
             <div className="absolute inset-0 opacity-50" 
                  style={{ 
                    backgroundImage: 'repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), repeating-linear-gradient(45deg, #ccc 25%, #eee 25%, #eee 75%, #ccc 75%, #ccc)',
                    backgroundPosition: '0 0, 10px 10px',
                    backgroundSize: '20px 20px',
                    filter: 'blur(2px)'
                  }}>
             </div>
          </div>

          {/* Labels - Always Visible */}
          <span 
            className="absolute top-4 right-4 z-30 bg-purple-500 text-white px-3 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold font-brand text-sm whitespace-nowrap pointer-events-none select-none"
          >
            Ultra 4K Upscale
          </span>
          <span 
            className="absolute top-4 left-4 z-30 bg-white text-black px-3 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold font-brand text-sm whitespace-nowrap pointer-events-none select-none"
          >
            Standard 720p
          </span>

          {/* Slider Handle Line */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Handle Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-black hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
