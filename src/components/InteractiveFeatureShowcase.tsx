'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const hotspots = [
  {
    id: 1,
    x: 50,
    y: 85,
    action: "Add a large middle eastern rug covering the floor",
    image: "/middleeastern-rug-removebg-preview.png"
  },
  {
    id: 2,
    x: 50,
    y: 60,
    action: "Add a simple modern gray sofa with a coffee table",
    image: "/sofa-coffee-table-removebg-preview.png"
  },
  {
    id: 3,
    x: 70,
    y: 40,
    action: "Add a tall rustic wooden closet against the wall",
    image: "/rustic-closet-removebg-preview.png"
  },
  {
    id: 4,
    x: 28,
    y: 30,
    action: "Add modern art on the wall",
    image: "/modern-art-removebg-preview.png"
  }
];

export default function InteractiveFeatureShowcase() {
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
      <div className="text-center mb-12 relative z-10">
        <h2 className="font-brand text-4xl md:text-5xl font-bold text-black mb-4">Interactive Staging Control</h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
          Take full control of your staging. Click to add points, specify exactly what furniture you want placed where, 
          and even upload reference images to guide the style.
        </p>
      </div>

      <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
        <img 
          src="/features-image.png" 
          alt="Smart Space Analysis" 
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Hotspots */}
        {hotspots.map((spot) => (
          <motion.div
            key={spot.id}
            className="absolute"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: spot.id * 0.2 }}
          >
            <button
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                activeHotspot === spot.id ? 'bg-yellow-400 text-black scale-110' : 'bg-white text-black hover:bg-yellow-100'
              }`}
              onMouseEnter={() => setActiveHotspot(spot.id)}
              onMouseLeave={() => setActiveHotspot(null)}
            >
              <span className="text-lg font-bold font-brand">+</span>
              
              {/* Pulse Effect */}
              <span className={`absolute inset-0 rounded-full opacity-75 animate-ping ${activeHotspot === spot.id ? 'bg-yellow-400' : 'bg-white'}`}></span>
            </button>

            <AnimatePresence>
              {activeHotspot === spot.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute left-1/2 bottom-full mb-6 -translate-x-1/2 w-64 bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 z-20 text-left pointer-events-none"
                >
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-purple-100 border-2 border-black p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                      <img src={spot.image} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div className="ml-3">
                      <p className="text-purple-600 text-sm font-bold font-brand leading-tight">{spot.action}</p>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute left-1/2 top-full -ml-3 w-6 h-6 bg-white border-r-2 border-b-2 border-black transform rotate-45 -mt-3"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
