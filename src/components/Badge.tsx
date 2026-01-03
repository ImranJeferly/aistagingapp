import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  icon?: string;
  position?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  isStatic?: boolean;
  className?: string;
}

export default function Badge({ 
  children, 
  icon = '🎨', 
  position,
  isStatic = false,
  className = ''
}: BadgeProps) {
  const positionStyles = !isStatic && position ? {
    top: position.top,
    bottom: position.bottom,
    left: position.left,
    right: position.right
  } : {};

  const baseClasses = "bg-white px-4 py-2 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-sm font-bold tracking-wide transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";
  const positionClasses = isStatic ? "inline-flex items-center" : "absolute z-20";

  return (
    <div 
      className={`${positionClasses} ${baseClasses} ${className}`}
      style={!isStatic ? positionStyles : undefined}
    >
      <span className="flex items-center">
        <span className="mr-2 text-lg">{icon}</span>
        {children}
      </span>
    </div>
  );
}
