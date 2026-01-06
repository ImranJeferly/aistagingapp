"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ComparisonViewerProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function ComparisonViewer({ 
  beforeImage, 
  afterImage,
  beforeLabel = "Before 🏚️",
  afterLabel = "After ✨"
}: ComparisonViewerProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };
    
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleMove(e.touches[0].clientX);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove);
      document.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="relative w-full select-none group">
            {/* Before/After Labels */}
            <div className="absolute top-6 left-6 z-20 pointer-events-none">
              <div className="bg-[#FACC15] text-black border-2 border-black px-4 py-1 rounded-lg text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
                {afterLabel}
              </div>
            </div>
            <div className="absolute top-6 right-6 z-20 pointer-events-none">
              <div className="bg-white text-black border-2 border-black px-4 py-1 rounded-lg text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-2">
                {beforeLabel}
              </div>
            </div>

            {/* Image Container */}
            <div 
              ref={containerRef}
              className="relative w-full overflow-hidden bg-gray-50"
              onMouseDown={(e) => {
                   // Click to jump
                   handleMove(e.clientX);
                   setIsDragging(true);
              }}
              onTouchStart={(e) => {
                   handleMove(e.touches[0].clientX);
                   setIsDragging(true);
              }}
            >
              {/* After Image (Left side) - Base layer (Relative to set height) */}
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img
                 src={afterImage}
                 alt="After transformation"
                 className="w-full h-auto block"
                 draggable={false}
               />

              {/* Before Image (Right side) - Clipped Overlay */}
              <div 
                className="absolute inset-0 w-full h-full"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={beforeImage}
                      alt="Before transformation"
                      className="w-full h-full object-cover" 
                      draggable={false}
                    />
              </div>

              {/* Draggable Divider Line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-black z-30 cursor-ew-resize hover:scale-110 transition-transform"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                onMouseDown={handleSliderMouseDown}
                onTouchStart={handleTouchStart}
              >
                {/* Drag Handle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>
            </div>
    </div>
  );
}
