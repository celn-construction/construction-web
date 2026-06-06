'use client';

import { Box, Typography } from '@mui/material';
import { Info } from '@phosphor-icons/react';

/**
 * Footer note rendered inside a MUI X DatePicker popup (via the `actionBar`
 * slot) to explain why dates beyond `limitLabel` are disabled. Placed in the
 * popup — not below the field — so it's visible right next to the greyed-out
 * days while the calendar is open.
 */
export default function DatePickerMaxHint({ limitLabel }: { limitLabel: string }) {
  return (
    <Box
      sx={{
        gridColumn: '1 / -1',
        px: 2,
        py: 1.25,
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        gap: 1,
        alignItems: 'flex-start',
        maxWidth: 320,
      }}
    >
      <Box component="span" sx={{ color: 'text.secondary', mt: '1px', flexShrink: 0, display: 'inline-flex' }}>
        <Info size={15} weight="fill" />
      </Box>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.45 }}>
        Dates after{' '}
        <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {limitLabel}
        </Box>{' '}
        are unavailable — your earliest task starts then, and a project can&apos;t begin after its first task.
      </Typography>
    </Box>
  );
}
