'use client';

import { Box, Typography, Skeleton, useTheme } from '@mui/material';
import { SlidersHorizontal, X, SquareCheck, CircleDashed } from 'lucide-react';
import type { LinkFilter } from '@/components/documents/DocumentFilterPopup';

const FOLDER_LABELS: Record<string, string> = {
  rfi: 'RFI',
  submittals: 'Submittals',
  'change-orders': 'Change Orders',
  photos: 'Photos',
  inspections: 'Inspections',
};

interface DocumentFilterTabsProps {
  selectedTypes: string[];
  linkFilter: LinkFilter;
  onOpenPopup: (e: React.MouseEvent<HTMLElement>) => void;
  onRemoveType: (type: string) => void;
  onRemoveLinkFilter: () => void;
  isLoading?: boolean;
}

export default function DocumentFilterTabs({
  selectedTypes,
  linkFilter,
  onOpenPopup,
  onRemoveType,
  onRemoveLinkFilter,
  isLoading,
}: DocumentFilterTabsProps) {
  const theme = useTheme();
  const activeCount = selectedTypes.length + (linkFilter !== 'all' ? 1 : 0);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Skeleton
          variant="rectangular"
          width={94}
          height={32}
          sx={{ borderRadius: '999px', bgcolor: 'action.disabled' }}
        />
      </Box>
    );
  }

  const activeChipSx = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    pl: '12px',
    pr: '10px',
    py: '6px',
    gap: '6px',
    bgcolor: 'secondary.main',
  } as const;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
      {/* Filters trigger button */}
      <Box
        component="button"
        onClick={onOpenPopup}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          borderRadius: '999px',
          px: '14px',
          py: '7px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          color: 'text.primary',
          cursor: 'pointer',
          transition: 'all 0.15s',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <SlidersHorizontal style={{ width: 14, height: 14, color: 'currentColor' }} />
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.primary' }}>
          Filters
        </Typography>
        {activeCount > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 18,
              height: 18,
              borderRadius: '999px',
              bgcolor: 'primary.main',
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'primary.contrastText' }}>
              {activeCount}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Active document type chips */}
      {selectedTypes.map((type) => (
        <Box key={type} sx={activeChipSx}>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'text.primary' }}>
            {FOLDER_LABELS[type] ?? type}
          </Typography>
          <Box
            component="button"
            onClick={() => onRemoveType(type)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: 'none',
              bgcolor: 'transparent',
              cursor: 'pointer',
              p: 0,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <X style={{ width: 12, height: 12 }} />
          </Box>
        </Box>
      ))}

      {/* Active link filter chip */}
      {linkFilter !== 'all' && (
        <Box sx={activeChipSx}>
          {linkFilter === 'linked' ? (
            <SquareCheck style={{ width: 12, height: 12, color: theme.palette.docExplorer.linkedGreen, flexShrink: 0 }} />
          ) : (
            <CircleDashed style={{ width: 12, height: 12, color: theme.palette.text.secondary, flexShrink: 0 }} />
          )}
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'text.primary' }}>
            {linkFilter === 'linked' ? 'Linked to Task' : 'Unlinked'}
          </Typography>
          <Box
            component="button"
            onClick={onRemoveLinkFilter}
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: 'none',
              bgcolor: 'transparent',
              cursor: 'pointer',
              p: 0,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <X style={{ width: 12, height: 12 }} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
