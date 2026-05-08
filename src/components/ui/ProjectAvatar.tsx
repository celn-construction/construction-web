'use client';

import { useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { getProjectIcon } from '@/lib/constants/projectIconComponents';
import { resolveColorTint } from '@/lib/constants/projectColors';

interface ProjectAvatarProps {
  imageUrl?: string | null;
  icon?: string;
  /** Optional color id from VALID_PROJECT_COLORS. When set (and no image), the icon renders inside a tinted square. */
  colorId?: string | null;
  size: number;
  borderRadius?: number | string;
  /** Override the icon foreground color. Ignored when colorId is set. */
  color?: string;
}

export default function ProjectAvatar({
  imageUrl,
  icon,
  colorId,
  size,
  borderRadius = 3,
  color,
}: ProjectAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const theme = useTheme();

  if (imageUrl && !imgError) {
    return (
      <Box
        component="img"
        src={imageUrl}
        alt=""
        onError={() => setImgError(true)}
        sx={{
          width: size,
          height: size,
          borderRadius,
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  const Icon = getProjectIcon(icon);

  if (colorId) {
    const tint = resolveColorTint(colorId, theme.palette.mode);
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius,
          bgcolor: tint.bg,
          color: tint.fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color 0.2s ease, color 0.2s ease',
        }}
      >
        <Icon size={Math.round(size * 0.55)} />
      </Box>
    );
  }

  return <Icon size={size} style={{ color, flexShrink: 0 }} />;
}
