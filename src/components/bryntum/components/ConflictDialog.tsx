'use client';

import { Dialog, Box, Typography, Divider, Button } from '@mui/material';
import { AlertTriangle } from 'lucide-react';

interface ConflictDialogProps {
  open: boolean;
  onProceed: () => void;
  onRefresh: () => void;
}

export default function ConflictDialog({ open, onProceed, onRefresh }: ConflictDialogProps) {
  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      onClose={(_event, reason) => {
        if (reason === 'backdropClick') return;
      }}
      PaperProps={{
        sx: {
          width: 420,
          borderRadius: '12px',
          boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Body */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Icon */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: 'warning.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 0.5,
          }}
        >
          <AlertTriangle style={{ width: 18, height: 18, color: 'var(--status-amber, #ed6c02)' }} />
        </Box>

        {/* Title */}
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
          Save Conflict
        </Typography>

        {/* Description */}
        <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
          Another user has made changes to this project that conflict with yours.
          You can overwrite their changes with yours, or discard your changes and
          load the latest version.
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'divider' }} />

      {/* Footer */}
      <Box
        sx={{
          px: 3,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          onClick={onRefresh}
          sx={{
            height: 32,
            px: 2,
            fontSize: 13,
            fontWeight: 500,
            color: 'text.primary',
            borderColor: 'divider',
            borderRadius: '8px',
            '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
          }}
        >
          Discard My Changes
        </Button>
        <Button
          variant="contained"
          onClick={onProceed}
          sx={{
            height: 32,
            px: 2,
            fontSize: 13,
            fontWeight: 500,
            borderRadius: '8px',
          }}
        >
          Keep My Changes
        </Button>
      </Box>
    </Dialog>
  );
}
