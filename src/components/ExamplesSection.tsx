"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ExampleImage {
  id: number;
  beforeColor: string;
  afterColor: string;
  title: string;
  description: string;
}

interface ExampleImage {
  id: number;
  beforeColor: string;
  afterColor: string;
  title: string;
  description: string;
}

const exampleImages: ExampleImage[] = [
  {
    id: 1,
    beforeColor: "bg-gray-300",
    afterColor: "bg-gradient-to-br from-blue-400 to-blue-600", 
    title: "Living Room Transformation",
    description: "Empty space turned into a cozy, modern living area"
  },
  {
    id: 2,
    beforeColor: "bg-gray-200",
    afterColor: "bg-gradient-to-br from-purple-400 to-purple-600",
    title: "Bedroom Staging",
    description: "Bare bedroom transformed into a luxurious retreat"
  },
  {
    id: 3,
    beforeColor: "bg-gray-400",
    afterColor: "bg-gradient-to-br from-green-400 to-green-600",
    title: "Kitchen Makeover", 
    description: "Plain kitchen styled with modern furnishings"
  },
  {
    id: 4,
    beforeColor: "bg-stone-300",
    afterColor: "bg-gradient-to-br from-orange-400 to-orange-600",
    title: "Dining Room Setup",
    description: "Empty dining space becomes an elegant entertaining area"
  },
  {
    id: 5,
    beforeColor: "bg-slate-300",
    afterColor: "bg-gradient-to-br from-indigo-400 to-indigo-600",
    title: "Home Office Design",
    description: "Unused room converted to a productive workspace"
  },
  {
    id: 6,
    beforeColor: "bg-zinc-300",
    afterColor: "bg-gradient-to-br from-pink-400 to-pink-600",
    title: "Bathroom Renovation",
    description: "Basic bathroom elevated to spa-like elegance"
  }
];

export default function ExamplesSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const checkScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
      
      // Calculate current index based on scroll position
      const cardWidth = 320; // Width of one card
      const gap = 24; // Gap between cards
      const scrollPosition = scrollLeft + (cardWidth / 2);
      const index = Math.floor(scrollPosition / (cardWidth + gap));
      setCurrentIndex(Math.max(0, Math.min(index, exampleImages.length - 1)));
    }
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [checkScrollButtons]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = 320; // Width of one card
      const gap = 24; // Gap between cards
      const scrollAmount = cardWidth + gap;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  // Mouse drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scrollContainerRef.current) {
      setIsDragging(true);
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollStart(scrollContainerRef.current.scrollLeft);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
    scrollContainerRef.current.scrollLeft = scrollStart - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Touch drag functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current) {
      setIsDragging(true);
      setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
      setScrollStart(scrollContainerRef.current.scrollLeft);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollStart - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  return (
    <section className="py-20 bg-[#FFFBEB] border-t-4 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black font-brand text-[#1a1a1a] mb-4">
            See the <span className="inline-block bg-[#FF90E8] px-4 py-1 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">Transformation</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-800 max-w-3xl mx-auto font-medium">
            Transform empty spaces into stunning, furnished rooms that help your listings sell faster
          </p>
        </motion.div>

        {/* Scroll Navigation - Desktop only */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <div className="flex gap-3">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`group p-3 rounded-full border-2 transition-all duration-300 transform hover:scale-105 ${
                canScrollLeft 
                  ? 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white hover:shadow-lg' 
                  : 'border-gray-300 text-gray-300 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`group p-3 rounded-full border-2 transition-all duration-300 transform hover:scale-105 ${
                canScrollRight 
                  ? 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white hover:shadow-lg' 
                  : 'border-gray-300 text-gray-300 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>Drag or scroll to see more examples</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>

        {/* Mobile scroll hint */}
        <div className="md:hidden text-center mb-6">
          <div className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <span>Swipe to see more examples</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>        {/* Scrollable Images Container */}
        <div 
          ref={scrollContainerRef}
          className={`flex gap-4 md:gap-6 overflow-x-auto scroll-smooth pb-8 scrollbar-hide ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {exampleImages.map((example, index) => (
            <motion.div 
              key={example.id} 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-72 md:w-80 group"
            >
              {/* Before/After Comparison */}
              <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-4 transition-all duration-300 group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-2">
                <div className="grid grid-cols-2 border-b-2 border-black">
                  {/* Before Image */}
                  <div className="relative overflow-hidden border-r-2 border-black">
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 border border-black shadow-sm">
                      Before
                    </div>
                    <div className="relative group/image">
                      <div
                        className={`w-full h-48 ${example.beforeColor} transition-transform duration-300 group-hover/image:scale-105 flex items-center justify-center`}
                      >
                        <div className="text-white/50 text-sm font-bold">Empty Room</div>
                      </div>
                    </div>
                  </div>
                  {/* After Image */}
                  <div className="relative overflow-hidden">
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 border border-black shadow-sm">
                      After
                    </div>
                    <div className="relative group/image">
                      <div
                        className={`w-full h-48 ${example.afterColor} transition-transform duration-300 group-hover/image:scale-105 flex items-center justify-center`}
                      >
                        <div className="text-white/80 text-sm font-bold">AI Staged</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Card Content */}
                <div className="p-6">
                  <h3 className="text-xl font-black font-brand text-black mb-2 group-hover:text-[#FF90E8] transition-colors duration-300">
                    {example.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    {example.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>        {/* Scroll Progress Indicator */}
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            {exampleImages.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (scrollContainerRef.current) {
                    const cardWidth = 320;
                    const gap = 24;
                    const scrollPosition = index * (cardWidth + gap);
                    scrollContainerRef.current.scrollTo({
                      left: scrollPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-110 ${
                  index === currentIndex 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 scale-110' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to example ${index + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
