"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface CautionTapeProps {
  text?: string;
  rotate?: number;
  top?: string;
  bottom?: string;
  zIndex?: number;
  delay?: number;
  direction?: 'left' | 'right';
}

export default function CautionTape({ 
  text = "CAUTION • PAGE NOT FOUND • 404 ERROR • ", 
  rotate = -15, 
  top, bottom,
  zIndex = 10,
  delay = 0,
  direction = 'left'
}: CautionTapeProps) {
  
  // Create enough text to fill the width
  const content = (
    <div className="flex items-center gap-4 font-black font-brand text-lg md:text-xl text-black tracking-widest whitespace-nowrap select-none">
      {Array(100).fill(text).map((t, i) => (
        <span key={i}>{t}</span>
      ))}
    </div>
  );

  const initialX = direction === 'left' ? '-120%' : '120%';

  return (
    <div 
      className="absolute left-1/2 transform -translate-x-1/2 w-[400vw] pointer-events-none"
      style={{ top, bottom, zIndex }}
    >
      <motion.div
        initial={{ x: initialX, rotate: rotate }}
        animate={{ x: '0%', rotate: rotate }}
        transition={{ 
          duration: 1.2, 
          delay: delay, 
          type: "spring",
          damping: 15,
          stiffness: 50
        }}
        className="w-full h-10 bg-[#FACC15] border-y-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] flex items-center justify-center relative overflow-hidden"
      >
        {/* Diagonal Stripes Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)'
          }}
        />
        
        {content}
      </motion.div>
    </div>
  );
}
