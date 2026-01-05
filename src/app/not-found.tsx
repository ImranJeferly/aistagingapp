"use client";

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import Button from '../components/Button';
import ChromaKeyVideo from '../components/ChromaKeyVideo';
import CautionTape from '../components/CautionTape';

export default function NotFound() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate rotation based on mouse position
      const rotateY = ((clientX / innerWidth) - 0.5) * 20;
      const rotateX = -((clientY / innerHeight) - 0.5) * 20;
      
      gsap.to(".animate-tilt", {
        rotationY: rotateY,
        rotationX: rotateX,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
        ease: "power2.out",
        duration: 0.5
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col items-center justify-center relative overflow-hidden perspective-1000">
      {/* Caution Tapes - Animated Individually to preserve Z-index stacking with static elements */}
      <div className="animate-tilt absolute inset-0 pointer-events-none preserve-3d" style={{ zIndex: 5 }}>
        <CautionTape 
          rotate={15} 
          top="20%" 
          zIndex={0} // Z-index handled by wrapper
          delay={0.2} 
          direction="left"
          text="WRONG TURN • GO BACK • "
        />
      </div>
      
      <div className="animate-tilt absolute inset-0 pointer-events-none preserve-3d" style={{ zIndex: 18 }}>
        <CautionTape 
          rotate={-10} 
          bottom="30%" 
          zIndex={0} // Z-index handled by wrapper
          delay={0.5} 
          direction="right"
          text="404 ERROR • PAGE MISSING • "
        />
      </div>

      <div className="animate-tilt absolute inset-0 pointer-events-none preserve-3d" style={{ zIndex: 50 }}>
        <CautionTape 
          rotate={-35} 
          top="10%" 
          zIndex={0} // Z-index handled by wrapper
          delay={0.8} 
          direction="left"
          text="DO NOT ENTER • CAUTION • "
        />
      </div>

      <div className="relative w-full h-screen flex flex-col items-center justify-center">
        {/* Video Overlay - Static */}
        <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[15] w-56 md:w-80 pointer-events-none">
          <ChromaKeyVideo 
            src="/404.mp4" 
            className="w-full h-full"
            threshold={100}
            keyColor="green"
          />
        </div>

        <div className="relative text-center px-4 w-full">
          {/* 404 Text - Animated */}
          <div className="animate-tilt relative inline-block preserve-3d z-10">
            {/* Secondary 3D Shadow Layer */}
            <h1 className="absolute top-0 left-0 w-full font-brand text-[40vw] font-black text-[#FACC15] leading-[0.8] tracking-tighter select-none transform translate-x-6 translate-y-4 rotate-3 z-0" aria-hidden="true" style={{ transform: 'translate(24px, 16px) rotate(3deg) translateZ(-50px)' }}>
              404
            </h1>
            
            {/* Main Text Layer */}
            <h1 className="relative font-brand text-[40vw] font-black text-[#1a1a1a] leading-[0.8] mb-8 tracking-tighter select-none z-10">
              404
            </h1>
          </div>
          
          {/* Banner - Static */}
          <div className="mb-12 relative -mt-4 md:-mt-12 z-20">
            <span className="inline-block bg-[#FACC15] px-6 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 text-xl md:text-2xl font-bold">
              Page Not Found
            </span>
          </div>

          {/* Button - Static */}
          <div className="relative z-20">
            <Link href="/">
              <Button size="lg" className="min-w-[200px]">
                Back Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
