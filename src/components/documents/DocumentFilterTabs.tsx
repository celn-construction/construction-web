'use client';

import { Box, Typography } from '@mui/material';

const FOLDER_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'rfi', label: 'RFI' },
  { value: 'submittals', label: 'Submittals' },
  { value: 'change-orders', label: 'Change Orders' },
  { value: 'photos', label: 'Photos' },
  { value: 'inspections', label: 'Inspections' },
];

const LINK_FILTERS = [
  { value: 'linked', label: 'Linked to Task' },
  { value: 'unlinked', label: 'Unlinked' },
];

interface DocumentFilterTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '999px',
        px: 1.75,
        py: '7px',
        border: active ? 'none' : '1px solid',
        borderColor: 'divider',
        bgcolor: active ? 'primary.main' : 'background.paper',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
        '&:hover': {
          bgcolor: active ? 'primary.dark' : 'action.hover',
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 500,
          color: active ? 'primary.contrastText' : 'text.secondary',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default function DocumentFilterTabs({ activeTab, onTabChange }: DocumentFilterTabsProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
      {FOLDER_FILTERS.map((filter) => (
        <FilterChip
          key={filter.value}
          label={filter.label}
          active={activeTab === filter.value}
          onClick={() => onTabChange(filter.value)}
        />
      ))}

      {/* Divider */}
      <Box sx={{ width: 1, height: 24, bgcolor: 'divider', mx: 0.5 }} />

      {LINK_FILTERS.map((filter) => (
        <FilterChip
          key={filter.value}
          label={filter.label}
          active={activeTab === filter.value}
          onClick={() => onTabChange(filter.value)}
        />
      ))}
    </Box>
  );
}
