'use client';

import { Box } from '@mui/material';

type ViewMode = 'compact' | 'detail' | 'gallery';

interface DocumentSkeletonsProps {
  viewMode: ViewMode;
  count?: number;
}

const shimmerSx = {
  position: 'relative' as const,
  overflow: 'hidden' as const,
  bgcolor: 'action.hover',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    transform: 'translateX(-100%)',
    background: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)'
        : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.04), transparent)',
    animation: 'docSkeletonShimmer 1.4s ease-in-out infinite',
  },
  '@keyframes docSkeletonShimmer': {
    '100%': { transform: 'translateX(100%)' },
  },
};

function CompactSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: '14px',
        py: '10px',
        borderRadius: '10px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ width: 48, height: 48, borderRadius: '8px', flexShrink: 0, ...shimmerSx }} />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Box sx={{ height: 12, borderRadius: '4px', width: '38%', ...shimmerSx }} />
        <Box sx={{ height: 10, borderRadius: '4px', width: '60%', ...shimmerSx }} />
      </Box>
    </Box>
  );
}

function DetailSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: '16px', pt: '16px', pb: '12px' }}>
        <Box sx={{ width: 48, height: 48, borderRadius: '8px', flexShrink: 0, ...shimmerSx }} />
        <Box sx={{ flex: 1, height: 12, borderRadius: '4px', ...shimmerSx }} />
      </Box>
      <Box sx={{ height: '1px', bgcolor: 'divider', mx: '16px' }} />
      <Box sx={{ px: '16px', py: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[80, 90, 70, 85, 60].map((w, i) => (
          <Box key={i} sx={{ height: 10, borderRadius: '4px', width: `${w}%`, ...shimmerSx }} />
        ))}
      </Box>
      <Box sx={{ height: '1px', bgcolor: 'divider' }} />
      <Box sx={{ display: 'flex', gap: 1, px: '16px', py: '10px' }}>
        <Box sx={{ height: 24, width: 80, borderRadius: '6px', ...shimmerSx }} />
        <Box sx={{ height: 24, width: 70, borderRadius: '6px', ...shimmerSx }} />
      </Box>
    </Box>
  );
}

function GallerySkeleton() {
  return (
    <Box
      sx={{
        borderRadius: '10px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ width: '100%', aspectRatio: '1', ...shimmerSx }} />
    </Box>
  );
}

export default function DocumentSkeletons({ viewMode, count = 8 }: DocumentSkeletonsProps) {
  const items = Array.from({ length: count });

  if (viewMode === 'gallery') {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 1.5,
        }}
      >
        {items.map((_, i) => (
          <GallerySkeleton key={i} />
        ))}
      </Box>
    );
  }

  if (viewMode === 'detail') {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 260px)',
          gap: 2,
          alignItems: 'start',
        }}
      >
        {items.map((_, i) => (
          <DetailSkeleton key={i} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.map((_, i) => (
        <CompactSkeleton key={i} />
      ))}
    </Box>
  );
}
