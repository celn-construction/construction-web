'use client';

import { useMemo } from 'react';
import { Avatar, type SxProps, type Theme } from '@mui/material';
import { createAvatar } from '@dicebear/core';
import { glass } from '@dicebear/collection';
import { getInitials } from '@/lib/utils/formatting';

interface UserAvatarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  size?: number;
  borderRadius?: number | string;
  sx?: SxProps<Theme>;
}

export default function UserAvatar({
  user,
  size = 40,
  borderRadius = '50%',
  sx,
}: UserAvatarProps) {
  const dicebearDataUri = useMemo(
    () => createAvatar(glass, { seed: user.id }).toDataUri(),
    [user.id],
  );

  const src = user.image ?? dicebearDataUri;
  const label = user.name ?? user.email ?? undefined;

  return (
    <Avatar
      src={src}
      alt={label}
      sx={{
        width: size,
        height: size,
        borderRadius,
        fontSize: Math.max(10, Math.round(size * 0.35)),
        fontWeight: 600,
        ...sx,
      }}
    >
      {getInitials(user.name ?? user.email ?? null)}
    </Avatar>
  );
}
