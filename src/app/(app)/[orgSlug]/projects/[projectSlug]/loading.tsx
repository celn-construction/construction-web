import { Box, Skeleton } from '@mui/material';

export default function ProjectLoading() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3, gap: 2 }}>
      {/* Toolbar row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton width={180} height={36} variant="rounded" />
        <Skeleton width={100} height={36} variant="rounded" />
        <Box sx={{ flex: 1 }} />
        <Skeleton width={120} height={36} variant="rounded" />
      </Box>
      {/* Main content area */}
      <Skeleton variant="rectangular" sx={{ flex: 1, borderRadius: '12px' }} />
    </Box>
  );
}
