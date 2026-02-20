import { Box, Skeleton } from '@mui/material';

export default function TeamLoading() {
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Skeleton width={80} height={32} />
          <Skeleton width={120} height={20} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton width={100} height={40} variant="rounded" />
      </Box>
      <Skeleton width="100%" height={48} sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    </Box>
  );
}
