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
}: FloatingElementProps) {
  // Responsive size classes - much smaller on mobile, gradually increase
  const sizeClasses = {
    sm: 'w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32',
    md: 'w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-40 lg:h-40',
    lg: 'w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-48 lg:h-48',
    xl: 'w-24 h-24 sm:w-28 sm:h-28 md:w-40 md:h-40 lg:w-64 lg:h-64',
    xxl: 'w-28 h-28 sm:w-32 sm:h-32 md:w-48 md:h-48 lg:w-96 lg:h-96'
  };

  // Create responsive positioning classes
  const getResponsivePositionClasses = () => {
    let classes = '';
    
    // Mobile positioning - move elements to screen edges to avoid layout issues
    if (position.left) {
      classes += 'left-[-1rem] sm:left-[-0.5rem] ';
    }
    if (position.right) {
      classes += 'right-[-1rem] sm:right-[-0.5rem] ';
    }
    
    return classes;
  };

  // For medium screens and up, use inline styles for precise positioning
  const getDesktopPositionStyles = () => {
    return {
      animationDelay: animationDelay,
      transform: `rotate(${rotation})`,
    };
  };

  // Get appropriate width/height for Next.js Image component
  const getImageDimensions = () => {
    const baseDimensions = {
      sm: 128,
      md: 160, 
      lg: 192,
      xl: 256,
      xxl: 384
    };
    return baseDimensions[size];
  };

  return (
    <>      {/* Mobile/Tablet version - positioned at screen edges */}
      <div 
        className={`
          absolute ${sizeClasses[size]} 
          opacity-100 hover:opacity-100 hover:scale-105 
          transition-all duration-500 ease-in-out 
          floating-element z-0 pointer-events-none overflow-hidden
          ${blur ? 'blur-sm' : ''}
          ${getResponsivePositionClasses()}
          md:hidden
        `}
        style={{
          top: position.top,
          bottom: position.bottom,
          animationDelay: animationDelay,
          transform: `rotate(${rotation})`,
        }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={getImageDimensions()}
          height={getImageDimensions()}
          className="w-full h-full object-contain drop-shadow-md transition-all duration-500"
        />
      </div>      {/* Desktop version - original positioning */}
      <div 
        className={`
          absolute ${sizeClasses[size]} 
          opacity-100 hover:opacity-100 hover:scale-105 
          transition-all duration-500 ease-in-out cursor-pointer 
          floating-element z-10 pointer-events-none
          ${blur ? 'blur-sm' : ''}
          hidden md:block
        `}
        style={{
          top: position.top,
          bottom: position.bottom,
          left: position.left,
          right: position.right,
          animationDelay: animationDelay,
          transform: `rotate(${rotation})`,
        }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={getImageDimensions()}
          height={getImageDimensions()}
          className="w-full h-full object-contain drop-shadow-lg hover:drop-shadow-2xl transition-all duration-500"
        />
      </div>
    </>
  );
}
