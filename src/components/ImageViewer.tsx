"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
// import FloatingElement from './FloatingElement';
// import Floating3DModel from './Floating3DModel';
import WigglyLine from './WigglyLine';

interface RoomType {
  id: string;
  name: string;
  beforeImage: string;
  afterImage: string;
  afterColor: string; // Keeping as fallback for styling
}

const roomTypes: RoomType[] = [  {
    id: 'living-room',
    name: 'Living Room',
    beforeImage: '/living room.jpeg',
    afterImage: '/livingroom_ai.png',
    afterColor: 'bg-gradient-to-br from-blue-400 to-blue-600'
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    beforeImage: '/kitchen.jpg',
    afterImage: '/kitchen.png',
    afterColor: 'bg-gradient-to-br from-green-400 to-green-600'
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    beforeImage: '/bedroom.jpg',
    afterImage: '/bedroom_ai.png',
    afterColor: 'bg-gradient-to-br from-purple-400 to-purple-600'
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    beforeImage: '/bathroom.png',
    afterImage: '/bathroom_ai.png',
    afterColor: 'bg-gradient-to-br from-teal-400 to-teal-600'
  },
  {
    id: 'dining-room',
    name: 'Dining Room',
    beforeImage: '/diningroom.png',
    afterImage: '/diningroom_ai.png',
    afterColor: 'bg-gradient-to-br from-orange-400 to-orange-600'
  },
  {
    id: 'office',
    name: 'Home Office',
    beforeImage: '/office.png',
    afterImage: '/office_ai.png',
    afterColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600'
  }
];

export default function ImageViewer() {
  const [selectedRoom, setSelectedRoom] = useState<RoomType>(roomTypes[0]);
  const [sliderPosition, setSliderPosition] = useState(50); // Percentage from left (50 = middle)
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rippleStates, setRippleStates] = useState<{[key: string]: any}>({});
  const buttonRefs = useRef<{[key: string]: HTMLButtonElement | null}>({});

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Global mouse events for smooth dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  const handleRoomButtonClick = (e: React.MouseEvent<HTMLButtonElement>, room: RoomType) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Calculate click position relative to button
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate the maximum distance to cover the entire button
    const maxDistance = Math.max(
      Math.sqrt(x * x + y * y),
      Math.sqrt((rect.width - x) * (rect.width - x) + y * y),
      Math.sqrt(x * x + (rect.height - y) * (rect.height - y)),
      Math.sqrt((rect.width - x) * (rect.width - x) + (rect.height - y) * (rect.height - y))
    );
    
    // Set initial ripple state
    setRippleStates(prev => ({
      ...prev,
      [room.id]: {
        left: x,
        top: y,
        width: maxDistance * 2,
        height: maxDistance * 2,
        transform: 'translate(-50%, -50%) scale(0)',
        show: true
      }
    }));
    
    // Trigger animation
    setTimeout(() => {
      setRippleStates(prev => ({
        ...prev,
        [room.id]: {
          ...prev[room.id],
          transform: 'translate(-50%, -50%) scale(1)',
        }
      }));
    }, 10);

    // Clean up ripple after animation
    setTimeout(() => {
      setRippleStates(prev => ({
        ...prev,
        [room.id]: { ...prev[room.id], show: false }
      }));
    }, 600);    // Set selected room and reset slider to middle
    setSelectedRoom(room);
    setSliderPosition(50);
  };
  return (
    <section className="relative py-16 md:py-20 bg-white overflow-hidden">      {/* Floating Lamp */}
      {/* <Floating3DModel 
        position={{ top: '10%', right: '8%' }}
        size="md"
        modelPath="/models/stool.glb"
        rotation={[0.1, -0.2, 0.26]}
        scale={2.5}
      /> */}

      {/* Floating Cabinet */}
      {/* <Floating3DModel 
        position={{ bottom: '10%', left: '8%' }}
        size="lg"
        modelPath="/models/cabinet.glb"
        rotation={[0.1, 0.4, 0]}
        scale={3}
      /> */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-brand text-[#1a1a1a] mb-6">
            See AI Staging <span className="inline-block bg-[#FACC15] px-4 py-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">Examples</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-800 max-w-3xl mx-auto font-medium">
            Explore real room transformations and see how AI staging brings empty spaces to life
          </p>
        </motion.div>

        {/* Room Type Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >          {roomTypes.map((room) => (
            <button
              key={room.id}
              onClick={(e) => {
                setSelectedRoom(room);
                setSliderPosition(50);
              }}
              className={`relative px-6 py-3 rounded-xl border-2 border-black font-bold text-sm md:text-base transition-all duration-200 ${
                selectedRoom.id === room.id
                  ? 'bg-[#FF90E8] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                  : 'bg-white text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'
              }`}
            >
              {room.name}
            </button>
          ))}
        </motion.div>        {/* Large Image Viewer with Draggable Divider */}
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring", bounce: 0.3 }}
            className="relative bg-white rounded-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
          >
            {/* Instructions */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">            <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2" style={{ display: 'none' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              <span className="hidden md:inline">Drag the line to compare</span>
              <span className="md:hidden">Drag line to compare</span>
            </div>
            </div>            {/* Before/After Labels */}
            <div className="absolute top-6 left-6 z-20">
              <div className="bg-[#FACC15] text-black border-2 border-black px-4 py-1 rounded-lg text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
                After ✨
              </div>
            </div>
            <div className="absolute top-6 right-6 z-20">
              <div className="bg-white text-black border-2 border-black px-4 py-1 rounded-lg text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-2">
                Before 🏚️
              </div>
            </div>

            {/* Image Container */}
            <div 
              ref={containerRef}
              className="relative w-full h-96 md:h-[500px] overflow-hidden select-none group"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >              {/* After Image (Left side) */}
              <div className="absolute inset-0 transition-opacity duration-500">
                <Image
                  src={selectedRoom.afterImage}
                  alt={`Professional AI home staging transforms ${selectedRoom.name} virtual furniture placement real estate marketing success`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Before Image (Right side) - Clipped by slider position */}
              <div 
                className="absolute inset-0 transition-opacity duration-500"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <Image
                  src={selectedRoom.beforeImage}
                  alt={`Empty property ${selectedRoom.name} before AI staging virtual home staging increases property value real estate listings`}
                  fill
                  className="object-cover"
                  priority
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
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>
            </div>            {/* Progress Indicator */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-20" style={{ display: 'none' }}>
              <span className="text-sm text-gray-600">After</span>
              <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${sliderPosition}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">Before</span>
            </div>
          </motion.div>          {/* Room Info */}
          <div className="text-center mt-8" style={{ display: 'none' }}>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Drag the divider line to reveal how AI staging transforms your {selectedRoom.name.toLowerCase()}. 
              See the difference between an empty space and a beautifully furnished room.
            </p>
          </div>
        </div>
      </div> {/* Close relative z-10 div */}
    </section>
  );
}
