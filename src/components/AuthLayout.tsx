'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';

type AuthVariant = 'login' | 'register' | 'verify';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  variant?: AuthVariant;
}

const VARIANTS = {
  login: {
    bgColor: 'bg-[#A3E635]', // Lime
    shapes: [
      { className: "absolute top-12 right-12 w-24 h-24 bg-[#FB923C] rounded-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10" },
      { className: "absolute bottom-24 left-12 w-16 h-16 bg-[#60A5FA] rotate-12 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10" }
    ],
    images: [
      { src: "/sofa.png", className: "absolute top-[20%] right-[10%] w-64 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-20 hover:scale-105 transition-transform duration-300" },
      { src: "/plant.png", className: "absolute bottom-[15%] left-[15%] w-40 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-20 hover:scale-105 transition-transform duration-300" },
      { src: "/cabinet.png", className: "absolute bottom-[25%] right-[20%] w-48 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-10" },
      { src: "/lamp.png", className: "absolute top-[15%] left-[20%] w-32 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-10" }
    ],
    vectors: [
      { src: "/Vector 1.svg", className: "absolute top-0 right-0 w-full h-full object-cover opacity-10 pointer-events-none" },
      { src: "/Vector 2.svg", className: "absolute bottom-0 left-0 w-1/2 h-1/2 object-contain opacity-20 pointer-events-none" }
    ]
  },
  register: {
    bgColor: 'bg-[#FF90E8]', // Pink
    shapes: [
      { className: "absolute top-20 left-20 w-20 h-20 bg-[#FDE047] rotate-45 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10" },
      { className: "absolute bottom-16 right-16 w-28 h-28 bg-[#2DD4BF] rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10" }
    ],
    images: [
      { src: "/bed.png", className: "absolute top-[25%] left-[10%] w-72 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-20 hover:scale-105 transition-transform duration-300" },
      { src: "/chair.png", className: "absolute bottom-[15%] right-[15%] w-48 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-20 hover:scale-105 transition-transform duration-300" },
      { src: "/cactus.png", className: "absolute top-[15%] right-[10%] w-32 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-10" },
      { src: "/stool.png", className: "absolute bottom-[35%] left-[25%] w-24 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-10" }
    ],
    vectors: [
      { src: "/Vector 3.svg", className: "absolute top-0 left-0 w-full h-full object-cover opacity-10 pointer-events-none" },
      { src: "/Vector 4.svg", className: "absolute bottom-0 right-0 w-1/2 h-1/2 object-contain opacity-20 pointer-events-none" }
    ]
  },
  verify: {
    bgColor: 'bg-[#22D3EE]', // Cyan
    shapes: [
      { className: "absolute top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#A3E635] rounded-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10" },
      { className: "absolute bottom-20 right-20 w-24 h-24 bg-[#F472B6] rotate-12 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10" }
    ],
    images: [
      { src: "/lamp.png", className: "absolute top-[20%] left-[10%] w-40 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-20 hover:scale-105 transition-transform duration-300" },
      { src: "/rug.png", className: "absolute bottom-[10%] right-[10%] w-64 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-20 hover:scale-105 transition-transform duration-300" },
      { src: "/plant.png", className: "absolute top-[30%] right-[15%] w-32 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-10" },
      { src: "/stool.png", className: "absolute bottom-[25%] left-[15%] w-28 h-auto object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-10" }
    ],
    vectors: [
      { src: "/Vector 1.svg", className: "absolute top-0 left-0 w-full h-full object-cover opacity-10 pointer-events-none" },
      { src: "/Vector 2.svg", className: "absolute bottom-0 right-0 w-1/2 h-1/2 object-contain opacity-20 pointer-events-none" }
    ]
  }
};

export default function AuthLayout({ children, title, subtitle, variant = 'login' }: AuthLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const theme = VARIANTS[variant];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        mouse.current = { x, y };
        
        // Parallax effect for images
        const images = containerRef.current.querySelectorAll('.parallax-img');
        images.forEach((img, index) => {
          const speed = (index + 1) * 10;
          const xOffset = x * speed;
          const yOffset = y * speed;
          (img as HTMLElement).style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex overflow-hidden">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-12 lg:px-24 relative z-10">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 sm:gap-3 mb-12 hover:opacity-80 transition-opacity">
            <img 
              src="/logo.png" 
              alt="AI Staging App Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <span className="text-gray-900 font-bold text-lg sm:text-xl tracking-wide">AI Staging App</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">{title}</h1>
            <p className="text-lg text-gray-600 font-medium">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>

      {/* Right Side - Illustration Background */}
      <div ref={containerRef} className={`hidden lg:block w-1/2 ${theme.bgColor} relative border-l-4 border-black overflow-hidden`}>
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: 'linear-gradient(#000 2px, transparent 2px), linear-gradient(90deg, #000 2px, transparent 2px)', 
               backgroundSize: '40px 40px' 
             }} 
        />

        {/* Abstract Vectors */}
        {theme.vectors.map((vector, index) => (
          <img 
            key={`vector-${index}`}
            src={vector.src} 
            className={vector.className}
            alt=""
          />
        ))}

        {/* Illustrations */}
        {/* <div className="absolute inset-0 pointer-events-none">
          {theme.images.map((img, index) => (
            <img 
              key={`img-${index}`}
              src={img.src} 
              className={`${img.className} parallax-img transition-transform duration-100 ease-out`}
              alt="Decorative furniture"
            />
          ))}
        </div> */}
        
        {/* Geometric Shapes */}
        {theme.shapes.map((shape, index) => (
          <div key={`shape-${index}`} className={shape.className} />
        ))}
      </div>
    </div>
  );
}
