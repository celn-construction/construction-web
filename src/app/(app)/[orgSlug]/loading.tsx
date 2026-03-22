import { Box, Skeleton } from '@mui/material';
import Grid from '@mui/material/GridLegacy';

export default function OrgHomeLoading() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Skeleton width={200} height={40} />
        <Skeleton width={140} height={48} variant="rounded" />
      </Box>
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: '12px' }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
