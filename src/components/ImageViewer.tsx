"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import FloatingElement from './FloatingElement';
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
    <section className="relative py-16 md:py-20 bg-white overflow-hidden">
      {/* Floating Lamp */}
      <FloatingElement 
        position={{ top: '10%', right: '8%' }}
        size="md"
        imageSrc="/stool.png"
        imageAlt="3D Lamp"
        animationDelay="1s"
        rotation="15deg"
      />

      {/* Wiggly Line
      <WigglyLine 
        position={{ top: '60%', left: '5%' }}
        rotation="-25deg"
        vectorNumber={4}
        opacity={1}
        scale={0.3}
      /> */}

      {/* Floating Cabinet */}
      <FloatingElement 
        position={{ bottom: '10%', left: '8%' }}
        size="lg"
        imageSrc="/cabinet.png"
        imageAlt="3D Cabinet"
        animationDelay="2s"
        rotation="-10deg"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            See AI Staging <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Examples</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Explore real room transformations and see how AI staging brings empty spaces to life
          </p>
        </div>

        {/* Room Type Buttons */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-12">          {roomTypes.map((room) => (
            <button
              key={room.id}
              ref={(el) => { buttonRefs.current[room.id] = el; }}
              onClick={(e) => handleRoomButtonClick(e, room)}
              className={`relative overflow-hidden px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                selectedRoom.id === room.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              {/* Ripple effect overlay */}
              {rippleStates[room.id]?.show && (
                <div
                  className="absolute rounded-full bg-white opacity-30 pointer-events-none transition-transform duration-500 ease-out"
                  style={rippleStates[room.id]}
                />
              )}
              
              {/* Button content */}
              <span className="relative z-10">
                {room.name}
              </span>
            </button>
          ))}
        </div>        {/* Large Image Viewer with Draggable Divider */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
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
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                After
              </div>
            </div>
            <div className="absolute top-6 right-6 z-20">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Before
              </div>
            </div>

            {/* Image Container */}
            <div 
              ref={containerRef}
              className="relative w-full h-96 md:h-[500px] overflow-hidden select-none"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >              {/* After Image (Left side) */}
              <div className="absolute inset-0">
                <Image
                  src={selectedRoom.afterImage}
                  alt={`AI Staged ${selectedRoom.name}`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Before Image (Right side) - Clipped by slider position */}
              <div 
                className="absolute inset-0"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <Image
                  src={selectedRoom.beforeImage}
                  alt={`Empty ${selectedRoom.name}`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Draggable Divider Line */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-30 cursor-ew-resize"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                onMouseDown={handleSliderMouseDown}
                onTouchStart={handleTouchStart}
              >
                {/* Drag Handle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
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
          </div>          {/* Room Info */}
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
