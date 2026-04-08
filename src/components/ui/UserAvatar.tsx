'use client';

import { useState } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { getInitials } from '@/lib/utils/formatting';

interface UserAvatarProps {
  image?: string | null;
  name?: string | null;
  size?: number;
  borderRadius?: string;
  fontSize?: string;
  sx?: SxProps<Theme>;
}

export default function UserAvatar({
  image,
  name,
  size = 32,
  borderRadius = '8px',
  fontSize = '0.6875rem',
  sx,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (image && !imgError) {
    return (
      <Box
        component="img"
        src={image}
        alt={name ?? 'Avatar'}
        onError={() => setImgError(true)}
        sx={{
          width: size,
          height: size,
          borderRadius,
          flexShrink: 0,
          objectFit: 'cover',
          ...sx as Record<string, unknown>,
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius,
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.accent.dark}, ${theme.palette.accent.gradientEnd})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize,
        fontWeight: 600,
        color: 'common.white',
        letterSpacing: '0.02em',
        ...sx as Record<string, unknown>,
      }}
    >
      {getInitials(name)}
    </Box>
  );
}
