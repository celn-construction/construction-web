'use client';

import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

interface TaskProgressCardProps {
  completedTaskCount: number;
  taskCount: number;
}

const SEGMENT_COUNT = 8;

export default function TaskProgressCard({ completedTaskCount, taskCount }: TaskProgressCardProps) {
  const percent = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;
  const filledSegments = Math.round((percent / 100) * SEGMENT_COUNT);

  const fillColor = useMemo(() => {
    if (percent >= 100) return 'var(--status-green)';
    if (percent >= 60) return 'var(--status-amber)';
    return 'var(--accent-primary)';
  }, [percent]);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        height: 34,
        pl: 1.25,
        pr: 1.5,
        borderRadius: '10px',
        bgcolor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        flexShrink: 0,
      }}
    >
      {/* Segment gauge */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
          const isFilled = i < filledSegments;
          return (
            <Box
              key={i}
              sx={{
                width: 4,
                height: 14,
                borderRadius: '1.5px',
                bgcolor: isFilled ? fillColor : 'var(--border-color)',
                opacity: isFilled ? 1 - i * 0.03 : 0.5,
                transition: 'background-color 0.3s ease, opacity 0.3s ease',
              }}
            />
          );
        })}
      </Box>

      {/* Fraction */}
      <Typography
        component="span"
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'text.primary',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {completedTaskCount}
        <Typography
          component="span"
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 400,
            color: 'text.disabled',
            mx: '1px',
          }}
        >
          /
        </Typography>
        {taskCount}
      </Typography>

      {/* Label */}
      <Typography
        sx={{
          fontSize: '0.5625rem',
          fontWeight: 600,
          color: 'text.disabled',
          lineHeight: 1,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
        }}
      >
        tasks
      </Typography>
    </Box>
  );
}
