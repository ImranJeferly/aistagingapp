import Image from 'next/image';

interface FloatingElementProps {
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  size: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  imageSrc: string;
  imageAlt: string;
  animationDelay?: string;
  blur?: boolean;
  rotation?: string;
}

export default function FloatingElement({ 
  position, 
  size, 
  imageSrc,
  imageAlt,
  animationDelay = '0s',
  blur = false,
  rotation = '0deg'
}: FloatingElementProps) {const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
    xxl: 'w-96 h-96'
  };
    const positionStyles = {
    top: position.top,
    bottom: position.bottom,
    left: position.left,
    right: position.right,
    animationDelay: animationDelay,
    transform: `rotate(${rotation})`
  };return (
    <div 
      className={`absolute ${sizeClasses[size]} opacity-100 hover:opacity-100 hover:scale-105 transition-all duration-500 ease-in-out cursor-pointer floating-element z-10 ${blur ? 'blur-sm' : ''}`}
      style={positionStyles}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}        width={size === 'sm' ? 128 : size === 'md' ? 160 : size === 'lg' ? 192 : size === 'xl' ? 256 : 384}
        height={size === 'sm' ? 128 : size === 'md' ? 160 : size === 'lg' ? 192 : size === 'xl' ? 256 : 384}
        className="w-full h-full object-contain drop-shadow-lg hover:drop-shadow-2xl transition-all duration-500"
      />
    </div>
  );
}
