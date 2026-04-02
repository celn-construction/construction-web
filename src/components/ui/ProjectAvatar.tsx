'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import { getProjectIcon } from '@/lib/constants/projectIconComponents';

interface ProjectAvatarProps {
  imageUrl?: string | null;
  icon?: string;
  size: number;
  borderRadius?: number | string;
  color?: string;
}

export default function ProjectAvatar({
  imageUrl,
  icon,
  size,
  borderRadius = 3,
  color,
}: ProjectAvatarProps) {
  const [imgError, setImgError] = useState(false);

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
  return <Icon size={size} style={{ color, flexShrink: 0 }} />;
}
