import Image from 'next/image';

interface WigglyLineProps {
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  rotation?: string;
  vectorNumber?: 1 | 2 | 3 | 4;
  opacity?: number;
  scale?: number;
}

export default function WigglyLine({ 
  position, 
  rotation = '0deg',
  vectorNumber = 1,
  opacity = 1,
  scale = 0.5
}: WigglyLineProps) {
  const positionStyles = {
    top: position.top,
    bottom: position.bottom,
    left: position.left,
    right: position.right,
    transform: `rotate(${rotation}) scale(${scale})`,
    opacity: opacity
  };

  return (
    <div 
      className="absolute pointer-events-none z-[1]"
      style={positionStyles}
    >
      <Image
        src={`/vector ${vectorNumber}.svg`}
        alt={`Wiggly line ${vectorNumber}`}
        width={400}
        height={400}
        className="w-auto h-auto"
      />
    </div>
  );
}
