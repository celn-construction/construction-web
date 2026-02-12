'use client';

import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';

export default function GanttLoadingAnimation() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Blueprint grid background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.015,
          backgroundImage: `
            linear-gradient(currentColor 1px, transparent 1px),
            linear-gradient(90deg, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          color: 'text.primary',
        }}
      />

      {/* Construction crane mechanism */}
      <Box sx={{ position: 'relative', width: 256, height: 160, mb: 4 }}>
        {/* Crane arm */}
        <Box
          component={motion.div}
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            transformOrigin: 'bottom',
            bottom: '20%',
            width: '2px',
            height: '80px',
          }}
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Box sx={{ width: '100%', height: '100%', bgcolor: 'text.primary', opacity: 0.3 }} />
          {/* Horizontal beam */}
          <Box
            component={motion.div}
            sx={{
              position: 'absolute',
              top: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              height: '4px',
              width: '120px',
              bgcolor: 'text.primary',
              opacity: 0.3,
            }}
          />
        </Box>

        {/* Hanging cable */}
        <Box
          component={motion.div}
          sx={{
            position: 'absolute',
            left: '50%',
            transformOrigin: 'top',
            top: '20%',
            width: '1px',
            height: '60px',
            bgcolor: 'text.primary',
            opacity: 0.2,
          }}
          animate={{
            x: [-20, 20, -20],
            height: ['60px', '50px', '60px'],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Load block */}
          <Box
            component={motion.div}
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: 0,
              width: '32px',
              height: '24px',
              bgcolor: 'text.primary',
              opacity: 0.4,
              border: 1,
              borderColor: 'text.primary',
            }}
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Box>

        {/* Building progress bars */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 192,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                height: 4,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 2,
                bgcolor: 'action.hover',
              }}
            >
              <Box
                component={motion.div}
                sx={{
                  height: '100%',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  borderRadius: 2,
                  bgcolor: 'text.primary',
                  opacity: 0.3,
                }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 1.2,
                  ease: 'easeInOut',
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Status display */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        {/* Loading text with monospace engineering feel */}
        <Box
          component={motion.div}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: '#a3a3a3',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: 'text.secondary',
            }}
          >
            Building Schedule
          </Typography>
        </Box>

        {/* Progress counter */}
        <Box
          component={motion.div}
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.5,
            fontFamily: 'monospace',
            fontSize: '0.625rem',
            letterSpacing: '0.05em',
            color: 'text.disabled',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span>[</span>
          <Box
            component={motion.span}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.2 }}
          >
            ▓
          </Box>
          <Box
            component={motion.span}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, delay: 0.2, repeat: Infinity, repeatDelay: 0.2 }}
          >
            ▓
          </Box>
          <Box
            component={motion.span}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, delay: 0.4, repeat: Infinity, repeatDelay: 0.2 }}
          >
            ▓
          </Box>
          <span style={{ opacity: 0.3 }}>░░░░░</span>
          <span>]</span>
        </Box>
      </Box>
    </Box>
  );
}
