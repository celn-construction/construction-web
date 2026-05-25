'use client';

import { Box, Popover, Switch, Typography } from '@mui/material';

export type ColumnId = 'name' | 'startDate' | 'endDate' | 'duration';
export type ColumnDef = { id: ColumnId; label: string; lockable?: boolean };

export const TOGGLEABLE_COLUMNS: ColumnDef[] = [
  { id: 'name', label: 'Name', lockable: true },
  { id: 'startDate', label: 'Start' },
  { id: 'endDate', label: 'End' },
  { id: 'duration', label: 'Duration' },
];

type Props = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  visibility: Record<ColumnId, boolean>;
  onToggle: (columnId: ColumnId, visible: boolean) => void;
};

export default function ColumnPickerPopover({
  anchorEl,
  open,
  onClose,
  visibility,
  onToggle,
}: Props) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            mt: 0.5,
            width: 220,
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 3,
          },
        },
      }}
    >
      <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
        <Typography
          sx={{
            fontSize: '0.5625rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'text.secondary',
            userSelect: 'none',
          }}
        >
          Columns
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px', px: 0.5, pb: 0.5 }}>
        {TOGGLEABLE_COLUMNS.map((col) => {
          const checked = visibility[col.id] ?? true;
          const locked = !!col.lockable;
          return (
            <Box
              key={col.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.25,
                py: 0.5,
                borderRadius: '8px',
                cursor: locked ? 'not-allowed' : 'pointer',
                '&:hover': locked ? {} : { bgcolor: 'action.hover' },
              }}
              onClick={() => {
                if (!locked) onToggle(col.id, !checked);
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  lineHeight: 1,
                  color: locked ? 'text.disabled' : 'text.primary',
                }}
              >
                {col.label}
              </Typography>
              <Switch
                size="small"
                checked={checked}
                disabled={locked}
                onChange={(e) => onToggle(col.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
            </Box>
          );
        })}
      </Box>
    </Popover>
  );
}
