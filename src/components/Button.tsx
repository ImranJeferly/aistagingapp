"use client";

import React, { useState, useRef } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  hoverColor?: string;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  onClick,
  hoverColor = 'bg-blue-600'
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [rippleStyle, setRippleStyle] = useState({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  const baseClasses = "font-semibold rounded-full transition-all duration-200 hover:scale-105 active:scale-95 relative overflow-hidden";
    const variantClasses = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 shadow-lg",
    secondary: "bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200 backdrop-blur-sm"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    
    // Calculate mouse position relative to button
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate the maximum distance to cover the entire button
    const maxDistance = Math.max(
      Math.sqrt(x * x + y * y),
      Math.sqrt((rect.width - x) * (rect.width - x) + y * y),
      Math.sqrt(x * x + (rect.height - y) * (rect.height - y)),
      Math.sqrt((rect.width - x) * (rect.width - x) + (rect.height - y) * (rect.height - y))
    );
    
    setRippleStyle({
      left: x,
      top: y,
      width: maxDistance * 2,
      height: maxDistance * 2,
      transform: 'translate(-50%, -50%) scale(0)',
    });
    
    setIsHovered(true);
    
    // Trigger animation
    setTimeout(() => {
      setRippleStyle(prev => ({
        ...prev,
        transform: 'translate(-50%, -50%) scale(1)',
      }));
    }, 10);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRippleStyle({});
  };
  
  return (
    <button 
      ref={buttonRef}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >      {/* Ripple effect overlay */}
      {isHovered && (
        <div
          className={`absolute rounded-full ${hoverColor} opacity-60 pointer-events-none transition-transform duration-500 ease-out`}
          style={rippleStyle}
        />
      )}
      
      {/* Button content */}
      <span className="relative z-10">
        {children}
      </span>
    </button>
  );
}
