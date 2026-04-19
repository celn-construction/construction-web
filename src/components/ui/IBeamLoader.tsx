'use client';

import { useId } from 'react';

type Props = {
  size?: number;
  color?: string;
  speed?: number;
  className?: string;
};

export function IBeamLoader({
  size = 64,
  color = 'currentColor',
  speed = 1,
  className,
}: Props) {
  const dur = 2.4 / speed;
  const uid = useId().replace(/:/g, '');
  const cls = {
    g: `ibeam-g-${uid}`,
    r: `ibeam-r-${uid}`,
    colLeft: `ibeam-col-left-${uid}`,
    beamTop: `ibeam-beam-top-${uid}`,
    colRight: `ibeam-col-right-${uid}`,
    mid: `ibeam-mid-${uid}`,
    reset: `ibeam-reset-${uid}`,
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={className}
      style={{ width: size, height: size, display: 'inline-block' }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <style>{`
          @keyframes ${cls.colLeft}  { 0%,8%   { transform: scaleY(0); } 22%,100% { transform: scaleY(1); } }
          @keyframes ${cls.beamTop}  { 0%,22%  { transform: scaleX(0); } 38%,100% { transform: scaleX(1); } }
          @keyframes ${cls.colRight} { 0%,38%  { transform: scaleY(0); } 52%,100% { transform: scaleY(1); } }
          @keyframes ${cls.mid}      { 0%,52%  { transform: scaleY(0); } 68%,92%  { transform: scaleY(1); } 100% { transform: scaleY(1); opacity: 0; } }
          @keyframes ${cls.reset}    { 0%,92%  { opacity: 1; } 100% { opacity: 0; } }
          .${cls.g} { animation: ${cls.reset} ${dur}s infinite; }
          .${cls.r} { animation-duration: ${dur}s; animation-iteration-count: infinite; animation-timing-function: cubic-bezier(0.4,0,0.2,1); }
        `}</style>
        <g className={cls.g}>
          <rect
            className={cls.r}
            x="3"
            y="3"
            width="3"
            height="18"
            rx="0.5"
            fill={color}
            style={{ transformOrigin: '4.5px 21px', animationName: cls.colLeft }}
          />
          <rect
            className={cls.r}
            x="3"
            y="3"
            width="18"
            height="3"
            rx="0.5"
            fill={color}
            style={{ transformOrigin: '3px 4.5px', animationName: cls.beamTop }}
          />
          <rect
            className={cls.r}
            x="18"
            y="3"
            width="3"
            height="10"
            rx="0.5"
            fill={color}
            style={{ transformOrigin: '19.5px 3px', animationName: cls.colRight }}
          />
          <rect
            className={cls.r}
            x="10"
            y="9"
            width="2.5"
            height="12"
            rx="0.5"
            fill={color}
            style={{ transformOrigin: '11.25px 21px', animationName: cls.mid }}
          />
        </g>
      </svg>
    </div>
  );
}
