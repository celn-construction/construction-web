import { Box, Skeleton, Stack } from '@mui/material';

export default function TimelineLoading() {
  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      {/* Resource list skeleton */}
      <Box sx={{ width: 192 }}>
        <Stack spacing={1} sx={{ p: 2 }}>
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={48} />
          ))}
        </Stack>
      </Box>

      {/* Calendar grid skeleton */}
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="rounded" height={64} sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.25,
            p: 2,
          }}
        >
          {[...Array(35)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={80} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
