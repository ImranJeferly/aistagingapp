"use client";

import React, { useEffect, useState } from 'react';
import { getApprovedReviews, Review } from '../services/reviewService';
import { Star, User, BadgeCheck } from 'lucide-react';

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    async function loadReviews() {
        const data = await getApprovedReviews();
        
        // Shuffle the array using Fisher-Yates algorithm
        for (let i = data.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [data[i], data[j]] = [data[j], data[i]];
        }

        // Select the first 20 items
        const randomSelection = data.slice(0, 20);
        setReviews(randomSelection);
    }
    loadReviews();
  }, []);

  if (reviews.length === 0) return null;

  // Duplicate the reviews to ensure we have enough content to scroll seamlessly
  // If we have fewer than 10 reviews, duplicate them more times to ensure the track is long enough
  const minItems = 10;
  let displayReviews = [...reviews];
  while (displayReviews.length < minItems) {
      displayReviews = [...displayReviews, ...reviews];
  }
  // Then double it for the loop
  displayReviews = [...displayReviews, ...displayReviews];

  return (
    <section className="w-full overflow-hidden py-16 bg-[#FDF4FF] relative">
      {/* Wavy Background Animation (Same as FAQ) */}
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

      <div className="relative w-full z-10">
         <div 
           className="flex gap-6 w-max"
           style={{
             animation: 'scroll 60s linear infinite',
           }}
           onMouseEnter={(e) => {
             const target = e.currentTarget as HTMLDivElement;
             target.style.animationPlayState = 'paused';
           }}
           onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLDivElement;
            target.style.animationPlayState = 'running';
          }}
         >
           {displayReviews.map((review, i) => {
             const fallbackImages = ['/free.svg', '/basic.svg', '/pro.svg'];
             const fallbackImage = fallbackImages[i % fallbackImages.length];
             const hasRealAvatar = !!review.userAvatar;

             return (
             <div 
               key={`${review.id}-${i}`}
               className="w-[350px] bg-white border-2 border-black p-8 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-shrink-0 flex flex-col justify-between h-auto min-h-[220px]"
             >
                {/* Top: Big Stars */}
                <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, starIndex) => (
                        <Star 
                        key={starIndex}
                        size={24} 
                        className={`${starIndex < review.rating ? "fill-[#FACC15] text-black" : "fill-gray-200 text-gray-300"}`}
                        strokeWidth={2}
                        />
                    ))}
                </div>

                {/* Middle: Text */}
                <div className="relative mb-6 flex-grow">
                   <p className="relative z-10 text-black text-base font-bold font-brand leading-relaxed">
                       {review.text}
                   </p>
                </div>

                {/* Bottom: User Info */}
                <div className="flex items-center gap-3 pt-4 border-t-2 border-dashed border-gray-200">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${hasRealAvatar ? 'border-2 border-black bg-gray-100' : ''}`}>
                        {hasRealAvatar ? (
                            <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
                        ) : (
                            <img src={fallbackImage} alt="User Avatar" className="w-full h-full object-cover" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="font-bold text-black font-brand leading-tight text-sm">{review.userName || 'Anonymous'}</p>
                            <BadgeCheck size={16} className="text-blue-500 fill-blue-50" />
                        </div>
                    </div>
                </div>
             </div>
           );
          })}
         </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
