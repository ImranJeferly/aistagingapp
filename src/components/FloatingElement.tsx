import Image from 'next/image';

interface FloatingElementProps {
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  size: 'sm' | 'md' | 'lg' | 'xl';
  imageSrc: string;
  imageAlt: string;
  animationDelay?: string;
}

export default function FloatingElement({ 
  position, 
  size, 
  imageSrc,
  imageAlt,
  animationDelay = '0s' 
}: FloatingElementProps) {  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64'
  };
  
  const positionStyles = {
    top: position.top,
    bottom: position.bottom,
    left: position.left,
    right: position.right,
    animationDelay: animationDelay
  };
    return (
    <div 
      className={`absolute ${sizeClasses[size]} opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-500 ease-in-out cursor-pointer floating-element`}
      style={positionStyles}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}        width={size === 'sm' ? 128 : size === 'md' ? 160 : size === 'lg' ? 192 : 256}
        height={size === 'sm' ? 128 : size === 'md' ? 160 : size === 'lg' ? 192 : 256}
        className="w-full h-full object-contain drop-shadow-lg hover:drop-shadow-2xl transition-all duration-500"
      />
    </div>
  );
}
