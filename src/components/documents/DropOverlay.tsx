'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadSimple } from '@phosphor-icons/react';

interface DropOverlayProps {
  visible: boolean;
}

export default function DropOverlay({ visible }: DropOverlayProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <AnimatePresence>
      {visible && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            bgcolor: isDark ? 'rgba(15,16,17,0.72)' : 'rgba(247,248,248,0.78)',
            pointerEvents: 'none',
          }}
        >
          <Box
            component={motion.div}
            initial={{ scale: 0.96, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              px: 5,
              py: 4,
              borderRadius: '16px',
              border: '2px dashed',
              borderColor: 'primary.main',
              bgcolor: 'background.paper',
              boxShadow: isDark
                ? '0 12px 32px rgba(0,0,0,0.5)'
                : '0 12px 32px rgba(43,45,66,0.12)',
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
                color: 'primary.main',
              }}
            >
              <UploadSimple size={26} weight="regular" />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
                Drop to upload
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.4 }}>
                Release to add files to this project
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </AnimatePresence>
  );
}
