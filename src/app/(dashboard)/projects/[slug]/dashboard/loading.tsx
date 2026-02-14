'use client';

import { Box } from '@mui/material';
import GanttLoadingAnimation from '@/components/dashboard/GanttLoadingAnimation';

export default function DashboardLoading() {
  return (
    <Box
      sx={{
        height: '100%',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'card.background',
      }}
    >
      <GanttLoadingAnimation />
    </Box>
  );
}
