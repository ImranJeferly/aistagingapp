'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VirtualRenovation() {
  const [activeUpgrades, setActiveUpgrades] = useState<string[]>([]);

  const upgrades = [
    { id: 'flooring', label: 'Install Hardwood', price: '+$15', color: 'bg-amber-100', activeColor: 'bg-amber-400' },
    { id: 'walls', label: 'Fresh Paint (White)', price: '+$10', color: 'bg-slate-100', activeColor: 'bg-slate-400' },
    { id: 'lighting', label: 'Modern Lighting', price: '+$5', color: 'bg-yellow-100', activeColor: 'bg-yellow-400' }
  ];

  const toggleUpgrade = (id: string) => {
    setActiveUpgrades(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        
        {/* Controls Section */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <div className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-md text-sm font-bold mb-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
              Pro Feature
            </div>
            <h2 className="font-brand text-5xl font-bold text-black mb-4 leading-tight">
              Virtual <br/><span className="text-green-600">Renovation</span>
            </h2>
            <p className="text-lg text-gray-700 font-medium mb-6">
              Fixer-upper? No problem. Digitally replace floors, paint, and fixtures to show potential buyers what's possible.
            </p>
          </div>

          <div className="space-y-4">
            {upgrades.map((upgrade) => (
              <button
                key={upgrade.id}
                onClick={() => toggleUpgrade(upgrade.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 border-black transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                  activeUpgrades.includes(upgrade.id) ? upgrade.activeColor : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded border-2 border-black flex items-center justify-center ${activeUpgrades.includes(upgrade.id) ? 'bg-black' : 'bg-white'}`}>
                    {activeUpgrades.includes(upgrade.id) && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-bold font-brand text-xl">{upgrade.label}</span>
                </div>
                <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded">{upgrade.price}</span>
              </button>
            ))}
          </div>
          
          <div className="p-4 bg-blue-50 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">Total Value Added:</span>
              <span className="font-brand text-2xl font-bold text-green-600">
                {activeUpgrades.length === 0 ? '$0' : activeUpgrades.length === 1 ? '+$15k' : activeUpgrades.length === 2 ? '+$35k' : '+$50k'}
              </span>
            </div>
            <div className="w-full bg-white h-3 rounded-full border-2 border-black overflow-hidden">
              <motion.div 
                className="h-full bg-green-500"
                initial={{ width: '0%' }}
                animate={{ width: `${(activeUpgrades.length / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Preview Window */}
        <div className="lg:col-span-2">
          <div className="relative aspect-video bg-gray-200 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            
            {/* Base Room (Messy/Old) */}
            <div className="absolute inset-0 bg-gray-300">
               {/* Old Floor Pattern */}
               <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-[#a89f91] opacity-50" 
                    style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 40px, #8c8273 40px, #8c8273 41px)' }}></div>
               {/* Old Wall Pattern */}
               <div className="absolute top-0 left-0 right-0 h-[70%] bg-[#d6d3cd]"></div>
               {/* Old Light */}
               <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-100 rounded-full blur-xl opacity-20"></div>
            </div>

            {/* Layers */}
            <AnimatePresence>
              {activeUpgrades.includes('flooring') && (
                <motion.div 
                  initial={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
                  animate={{ opacity: 1, clipPath: 'inset(0 0 0 0)' }}
                  exit={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
                  transition={{ duration: 0.5 }}
                  className="absolute bottom-0 left-0 right-0 h-[30%] bg-[#8B4513] z-10"
                >
                  {/* Wood Texture Simulation */}
                  <div className="w-full h-full opacity-40"
                       style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 10px, #5c2e0b 10px, #5c2e0b 11px)' }}></div>
                </motion.div>
              )}

              {activeUpgrades.includes('walls') && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute top-0 left-0 right-0 h-[70%] bg-white z-10"
                >
                  {/* Shadow/Corner Simulation */}
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-transparent opacity-50"></div>
                </motion.div>
              )}

              {activeUpgrades.includes('lighting') && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
                >
                  <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[80%] bg-yellow-200 rounded-full blur-3xl opacity-30"></div>
                  <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-white/20 to-transparent"></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Before/After Label */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded border-2 border-black font-bold text-xs z-30">
              {activeUpgrades.length === 0 ? 'Original Condition' : 'Renovated Preview'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
