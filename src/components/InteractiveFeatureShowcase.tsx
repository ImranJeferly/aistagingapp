'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const hotspots = [
  {
    id: 1,
    x: 20,
    y: 60,
    label: "Empty Floor Area",
    action: "Placing Modern Rug",
    icon: "🧶"
  },
  {
    id: 2,
    x: 50,
    y: 50,
    label: "Main Living Space",
    action: "Adding Sofa Set & Coffee Table",
    icon: "🛋️"
  },
  {
    id: 3,
    x: 80,
    y: 40,
    label: "Blank Wall",
    action: "Hanging Abstract Art",
    icon: "🖼️"
  },
  {
    id: 4,
    x: 30,
    y: 30,
    label: "Natural Light Source",
    action: "Optimizing Lighting & Shadows",
    icon: "☀️"
  }
];

export default function InteractiveFeatureShowcase() {
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
      <div className="text-center mb-12 relative z-10">
        <h2 className="font-brand text-4xl md:text-5xl font-bold text-black mb-4">Smart Space Analysis</h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
          Our AI doesn't just paste images. It understands the geometry, lighting, and potential of your room.
          Hover over the points below to see how it thinks.
        </p>
      </div>

      <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
        {/* Placeholder for Room Image - Using a gradient for now */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
          <div className="absolute inset-0 opacity-10" 
               style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>
          
          {/* Simulated Room Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 L20 70 L80 70 L100 100" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M20 70 L20 20 L80 20 L80 70" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>

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
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                activeHotspot === spot.id ? 'bg-yellow-400 text-black scale-110' : 'bg-white text-black hover:bg-yellow-100'
              }`}
              onMouseEnter={() => setActiveHotspot(spot.id)}
              onMouseLeave={() => setActiveHotspot(null)}
            >
              <span className="text-xl font-bold font-brand">+</span>
              
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
                  <div className="flex items-start gap-3">
                    <div className="text-2xl bg-purple-100 border-2 border-black p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{spot.icon}</div>
                    <div>
                      <h4 className="font-bold font-brand text-black text-lg leading-tight">{spot.label}</h4>
                      <p className="text-purple-600 text-sm font-bold mt-1 font-brand">{spot.action}</p>
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
