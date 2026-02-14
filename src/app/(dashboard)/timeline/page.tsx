'use client';

import { Box, Typography, Stack } from '@mui/material';

export default function TimelinePage() {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack spacing={2} sx={{ textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Timeline View
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Timeline functionality is being reimplemented.
        </Typography>
      </Stack>
    </Box>
  );
}
