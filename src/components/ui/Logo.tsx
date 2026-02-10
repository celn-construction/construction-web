import React from 'react';

interface LogoIconProps {
  size?: number;
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left column (full height I-beam) */}
      <rect x="3" y="3" width="3" height="18" rx="0.5" fill="currentColor" />

      {/* Top beam connecting columns */}
      <rect x="3" y="3" width="18" height="3" rx="0.5" fill="currentColor" />

      {/* Right column (shorter - under construction) */}
      <rect x="18" y="3" width="3" height="10" rx="0.5" fill="currentColor" />

      {/* Middle ascending bar (progress/tracking element) */}
      <rect x="10" y="9" width="2.5" height="12" rx="0.5" fill="currentColor" />
    </svg>
  );
};

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textVariant?: 'default' | 'large';
}

export const Logo: React.FC<LogoProps> = ({
  size = 24,
  className = '',
  showText = true,
  textVariant = 'default'
}) => {
  const textSize = textVariant === 'large' ? 'text-xl' : 'text-base';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={size} />
      {showText && (
        <span className={`font-semibold ${textSize}`}>
          BuildTrack Pro
        </span>
      )}
    </div>
  );
};
