'use client';

import { useState, useCallback, useMemo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ArrowsClockwise } from '@phosphor-icons/react';

const AVATAR_COUNT = 12;
const AVATAR_SIZE = 56;

function generateSeeds(count: number): string[] {
  return Array.from({ length: count }, () =>
    Math.random().toString(36).substring(2, 10),
  );
}

function seedToUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}`;
}

interface AvatarPickerProps {
  value?: string;
  onChange: (url: string) => void;
}

export default function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const [seeds, setSeeds] = useState(() => generateSeeds(AVATAR_COUNT));

  const urls = useMemo(() => seeds.map(seedToUrl), [seeds]);

  const handleShuffle = useCallback(() => {
    setSeeds(generateSeeds(AVATAR_COUNT));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
          Choose an avatar
        </Typography>
        <IconButton onClick={handleShuffle} size="small" sx={{ color: 'text.secondary' }}>
          <ArrowsClockwise size={16} weight="bold" />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1.5,
          justifyItems: 'center',
        }}
      >
        {urls.map((url) => (
          <Box
            key={url}
            onClick={() => onChange(url)}
            sx={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: '12px',
              border: '2px solid',
              borderColor: value === url ? 'primary.main' : 'divider',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'border-color 0.15s, transform 0.15s',
              bgcolor: 'background.paper',
              p: 0.5,
              '&:hover': {
                borderColor: value === url ? 'primary.main' : 'text.secondary',
                transform: 'scale(1.05)',
              },
            }}
          >
            <Box
              component="img"
              src={url}
              alt="Avatar option"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
