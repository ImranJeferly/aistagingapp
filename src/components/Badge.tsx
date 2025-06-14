interface BadgeProps {
  children: React.ReactNode;
  icon?: string;
  position?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

export default function Badge({ 
  children, 
  icon = '🎨', 
  position = { bottom: '2rem', right: '2rem' } 
}: BadgeProps) {
  const positionStyles = {
    top: position.top,
    bottom: position.bottom,
    left: position.left,
    right: position.right
  };
    return (
    <div 
      className="absolute bg-gray-100/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-200/80 transition-all duration-200"
      style={positionStyles}
    >
      <span className="text-gray-700 text-sm flex items-center">
        <span className="mr-2">{icon}</span>
        {children}
      </span>
    </div>
  );
}
