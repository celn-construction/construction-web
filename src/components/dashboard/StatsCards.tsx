'use client';

import { TrendingUp } from 'lucide-react';
import { Box, Typography, Stack, Paper } from '@mui/material';

export default function StatsCards() {
  return (
    <Stack direction="row" spacing={3}>
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'card.background',
          borderRadius: '12px',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            Active Projects
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 500, color: 'text.primary' }}>
              12
            </Typography>
            <TrendingUp size={16} />
          </Stack>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          bgcolor: 'card.background',
          borderRadius: '12px',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            Tasks completed
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 500, color: 'text.primary' }}>
              847
            </Typography>
            <TrendingUp size={16} />
          </Stack>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          bgcolor: 'card.background',
          borderRadius: '12px',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            On schedule
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 500, color: 'text.primary' }}>
              94%
            </Typography>
            <TrendingUp size={16} />
          </Stack>
        </Box>
      </Paper>
    </Stack>
  );
}
