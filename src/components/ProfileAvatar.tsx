import React, { useMemo } from 'react';

interface ProfileAvatarProps {
  tier: 'free' | 'basic' | 'pro' | string;
  userId?: string; // Used to seed the random color
  className?: string;
}

// 20 Neo-Brutalist / Playful Colors
const AVATAR_COLORS = [
  "#FF90E8", // Pink (Original Free)
  "#F8DA2C", // Yellow (Original Basic)
  "#984FBA", // Purple (Original Pro)
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Sky Blue
  "#96CEB4", // Sage Green
  "#FFEEAD", // Cream Yellow
  "#D4A5A5", // Mauve
  "#9B59B6", // Violet
  "#3498DB", // Blue
  "#E67E22", // Orange
  "#E74C3C", // Bright Red
  "#2ECC71", // Emerald
  "#1ABC9C", // Turquoise
  "#F1C40F", // Sunflower
  "#FD79A8", // Light Pink
  "#00B894", // Mint
  "#0984E3", // Electron Blue
  "#6C5CE7", // Iris Purple
];

export default function ProfileAvatar({ tier, userId = 'default', className = "w-8 h-8" }: ProfileAvatarProps) {
  
  // Deterministically select a color based on userId
  const backgroundColor = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }, [userId]);

  // Render the appropriate SVG based on tier
  // We use the SVG content directly to allow dynamic color injection
  const renderSvg = () => {
    switch (tier) {
      case 'pro':
        return (
          <svg viewBox="1 1 239 239" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="120.218" cy="120.218" r="113.77" transform="rotate(-0.457324 120.218 120.218)" fill={backgroundColor} stroke="black" strokeWidth="11"/>
            <path d="M169 147C159.667 156.667 131 173.7 91 164.5" stroke="black" strokeWidth="8" strokeLinecap="round"/>
            <path d="M121 186.5C127 187.5 137 185.5 142 182" stroke="black" strokeWidth="8" strokeLinecap="round"/>
            <path d="M113.954 97.5C113.954 102.95 112.764 108.346 110.452 113.381C108.141 118.416 104.752 122.991 100.481 126.845C96.2093 130.699 91.1383 133.755 85.5573 135.841C79.9763 137.927 73.9947 139 67.9539 139C61.913 139 55.9314 137.927 50.3504 135.841C44.7694 133.755 39.6984 130.699 35.4269 126.845C31.1554 122.991 27.7671 118.416 25.4554 113.381C23.1437 108.346 21.9539 102.95 21.9539 97.5L67.9539 97.5H113.954Z" fill="black"/>
            <path d="M220.954 97.5C220.954 102.95 219.738 108.346 217.376 113.381C215.014 118.416 211.552 122.991 207.188 126.845C202.824 130.699 197.642 133.755 191.94 135.841C186.238 137.927 180.126 139 173.954 139C167.782 139 161.67 137.927 155.968 135.841C150.265 133.755 145.084 130.699 140.72 126.845C136.355 122.991 132.893 118.416 130.532 113.381C128.17 108.346 126.954 102.95 126.954 97.5L173.954 97.5H220.954Z" fill="black"/>
            <rect x="9" y="89" width="222" height="11" fill="black"/>
            <path d="M158.5 123.58C151.939 120.011 146.917 114.556 144.25 108.102M52.3706 123.579C45.8097 120.01 40.7875 114.555 38.1204 108.101" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'basic':
        return (
          <svg viewBox="1 1 239 239" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="120.218" cy="120.218" r="113.77" transform="rotate(-0.457324 120.218 120.218)" fill={backgroundColor} stroke="black" strokeWidth="11"/>
            <ellipse cx="168.5" cy="114" rx="13.5" ry="24" fill="black"/>
            <path d="M155.075 172.567C142.49 177.276 109.284 180.315 77.1364 154.797" stroke="black" strokeWidth="8" strokeLinecap="round"/>
            <path d="M88.0117 120.918C84.506 108.513 70.7531 100.962 56.9999 111.479" stroke="black" strokeWidth="8" strokeLinecap="round"/>
          </svg>
        );
      default: // free
        return (
          <svg viewBox="1 1 239 239" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="120.218" cy="120.218" r="113.77" transform="rotate(-0.457324 120.218 120.218)" fill={backgroundColor} stroke="black" strokeWidth="11"/>
            <ellipse cx="69.5" cy="112" rx="13.5" ry="24" fill="black"/>
            <ellipse cx="165.5" cy="112" rx="13.5" ry="24" fill="black"/>
            <path d="M89 169C109.158 182.965 131.942 181.687 151 169" stroke="black" strokeWidth="8" strokeLinecap="round"/>
          </svg>
        );
    }
  };

  return (
    <div className={`${className} rounded-full overflow-hidden shrink-0`}>
      {renderSvg()}
    </div>
  );
}
