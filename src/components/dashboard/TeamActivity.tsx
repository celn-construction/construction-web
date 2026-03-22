'use client';

import { Maximize2, Shuffle } from 'lucide-react';
import { Box, Typography, Paper, IconButton, Stack } from '@mui/material';

export default function TeamActivity() {
  const data = [
    { x: 0, y: 280 },
    { x: 1, y: 320 },
    { x: 2, y: 350 },
    { x: 3, y: 310 },
    { x: 4, y: 360 },
    { x: 5, y: 340 },
    { x: 6, y: 385 },
    { x: 7, y: 370 },
    { x: 8, y: 320 },
    { x: 9, y: 350 },
    { x: 10, y: 390 },
    { x: 11, y: 420 },
  ];

  const maxY = 450;
  const minY = 250;
  const width = 100;
  const height = 150;

  const points = data
    .map((point, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((point.y - minY) / (maxY - minY)) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'card.background',
        borderRadius: '12px',
        p: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>
            Productivity Summary
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Track team performance
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'action.hover',
              borderRadius: '8px',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <Shuffle size={20} />
          </IconButton>
          <IconButton
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'action.hover',
              borderRadius: '8px',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <Maximize2 size={20} />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ position: 'relative', height: 160 }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1="0"
              y1={i * (height / 3)}
              x2={width}
              y2={i * (height / 3)}
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.1"
            />
          ))}

          {/* Line chart */}
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points */}
          {data.map((point, idx) => {
            const x = (idx / (data.length - 1)) * width;
            const y = height - ((point.y - minY) / (maxY - minY)) * height;

            // Highlight the peak
            if (idx === 11) {
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="3" fill="currentColor" />
                  <rect x={x - 12} y={y - 25} width="24" height="16" rx="4" fill="currentColor" />
                  <text x={x} y={y - 14} textAnchor="middle" fill="white" fontSize="8">
                    420
                  </text>
                </g>
              );
            }
            return null;
          })}
        </svg>

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'text.disabled',
            mt: 1,
          }}
        >
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
        </Box>
      </Box>
    </Paper>
  );
}
