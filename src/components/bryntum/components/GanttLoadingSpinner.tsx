'use client';

import { Box } from '@mui/material';

const CUBE_SIZE = 44;
const HALF = CUBE_SIZE / 2;

export default function GanttLoadingSpinner() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2.5,
      }}
    >
      <Box
        sx={{
          width: CUBE_SIZE,
          height: CUBE_SIZE,
          transformStyle: 'preserve-3d',
          animation: 'ganttCubeSpin 2s infinite ease',
          '@keyframes ganttCubeSpin': {
            '0%': { transform: 'rotate(45deg) rotateX(-25deg) rotateY(25deg)' },
            '50%': { transform: 'rotate(45deg) rotateX(-385deg) rotateY(25deg)' },
            '100%': { transform: 'rotate(45deg) rotateX(-385deg) rotateY(385deg)' },
          },
          '& > div': {
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '2px solid var(--accent-primary, #004dff)',
            bgcolor: 'rgba(0, 77, 255, 0.15)',
          },
          '& > div:nth-of-type(1)': {
            transform: `translateZ(-${HALF}px) rotateY(180deg)`,
          },
          '& > div:nth-of-type(2)': {
            transform: 'rotateY(-270deg) translateX(50%)',
            transformOrigin: 'top right',
          },
          '& > div:nth-of-type(3)': {
            transform: 'rotateY(270deg) translateX(-50%)',
            transformOrigin: 'center left',
          },
          '& > div:nth-of-type(4)': {
            transform: 'rotateX(90deg) translateY(-50%)',
            transformOrigin: 'top center',
          },
          '& > div:nth-of-type(5)': {
            transform: 'rotateX(-90deg) translateY(50%)',
            transformOrigin: 'bottom center',
          },
          '& > div:nth-of-type(6)': {
            transform: `translateZ(${HALF}px)`,
          },
        }}
      >
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </Box>

      <Box
        sx={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'text.secondary',
          letterSpacing: '0.02em',
        }}
      >
        Loading Gantt chart…
      </Box>
    </Box>
  );
}
