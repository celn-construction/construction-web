'use client';

import { Box, Typography } from '@mui/material';
import usePagination from '@mui/material/usePagination';
import type { UsePaginationItem } from '@mui/material/usePagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  count: number;
  page: number;
  onChange: (page: number) => void;
}

export default function Pagination({ count, page, onChange }: PaginationProps) {
  const { items } = usePagination({
    count,
    page,
    onChange: (_: React.ChangeEvent<unknown>, value: number) => onChange(value),
  });

  const baseBtn = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: '8px',
    border: 'none',
    padding: 0,
    transition: 'all 0.15s',
  } as const;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {items.map((item: UsePaginationItem, index: number) => {
        const { page: itemPage, type, selected, disabled, onClick } = item;

        if (type === 'previous' || type === 'next') {
          const Icon = type === 'previous' ? ChevronLeft : ChevronRight;
          return (
            <Box
              key={index}
              component="button"
              disabled={disabled}
              onClick={onClick}
              sx={{
                ...baseBtn,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                color: 'text.secondary',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                '&:hover:not(:disabled)': { bgcolor: 'action.hover' },
              }}
            >
              <Icon style={{ width: 16, height: 16 }} />
            </Box>
          );
        }

        if (type === 'start-ellipsis' || type === 'end-ellipsis') {
          return (
            <Box key={index} sx={{ ...baseBtn, cursor: 'default' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>
                ...
              </Typography>
            </Box>
          );
        }

        // Page number button
        return (
          <Box
            key={index}
            component="button"
            onClick={onClick}
            sx={{
              ...baseBtn,
              cursor: 'pointer',
              bgcolor: selected ? 'text.primary' : 'background.paper',
              border: selected ? 'none' : '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: selected ? 'text.primary' : 'action.hover',
                opacity: selected ? 0.85 : 1,
              },
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: selected ? 600 : 500,
                color: selected ? 'background.paper' : 'text.primary',
              }}
            >
              {itemPage}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
