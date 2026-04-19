'use client';

import { motion } from 'framer-motion';
import { Backdrop, Box, Typography } from '@mui/material';
import { IBeamLoader } from './IBeamLoader';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  text?: string;
}

const sizeMap = {
  sm: 16,
  md: 32,
  lg: 48,
  xl: 64,
};

export default function LoadingSpinner({
  size = 'md',
  fullScreen = false,
  text
}: LoadingSpinnerProps) {
  const spinner = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, color: fullScreen ? 'common.white' : 'text.secondary' }}>
      <IBeamLoader size={sizeMap[size]} />
      {text && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Typography variant="body2" sx={fullScreen ? { color: 'common.white', opacity: 0.85 } : { color: 'text.secondary' }}>
            {text}
          </Typography>
        </motion.div>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Backdrop
        open
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {spinner}
        </motion.div>
      </Backdrop>
    );
  }

  return spinner;
}
