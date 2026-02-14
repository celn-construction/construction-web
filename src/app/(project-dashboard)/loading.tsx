import { Box, Skeleton, Stack } from '@mui/material';

export default function AppLoading() {
  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      {/* Header skeleton */}
      <Skeleton variant="rounded" height={48} />

      {/* Content skeleton */}
      <Skeleton variant="rounded" sx={{ flex: 1 }} />
    </Stack>
  );
}
