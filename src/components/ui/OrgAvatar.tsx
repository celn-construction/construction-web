'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';

interface OrgAvatarProps {
  name: string;
  seed: string;
  logoUrl?: string | null;
  size?: number;
  borderRadius?: number | string;
  className?: string;
}

function dicebearUrl(seed: string) {
  // `initials` style: colored disc with the org's first letter(s). Background
  // is locked to brand violet (#7c5cff) — a hue already present in the sidebar
  // bokeh gradient, so the avatar feels native to the surface.
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&fontFamily=Inter&fontWeight=600&radius=20&backgroundColor=7c5cff`;
}

export default function OrgAvatar({
  name,
  seed,
  logoUrl,
  size = 34,
  borderRadius = '8px',
  className,
}: OrgAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const src = logoUrl && !imgError ? logoUrl : dicebearUrl(seed);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  return (
    <Box
      className={className}
      component="img"
      src={src}
      alt={name}
      onError={() => {
        if (logoUrl && !imgError) setImgError(true);
      }}
      sx={{
        width: size,
        height: size,
        borderRadius,
        objectFit: 'cover',
        flexShrink: 0,
        bgcolor: '#ffffff',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  );
}
