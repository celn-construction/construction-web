import { X } from 'lucide-react';
import { Box, Popover } from '@mui/material';
import { POPOVER_WIDTH } from '../constants';
import type { PopoverPlacement } from '../types';

type TaskDetailsPopoverProps = {
  open: boolean;
  taskName: string;
  popoverPlacement: PopoverPlacement | null;
  onClose: () => void;
};

export function TaskDetailsPopover({
  open,
  taskName,
  popoverPlacement,
  onClose,
}: TaskDetailsPopoverProps) {
  return (
    <Popover
      open={open}
      anchorReference="anchorPosition"
      anchorPosition={popoverPlacement?.anchorPosition}
      onClose={onClose}
      transformOrigin={popoverPlacement?.transformOrigin ?? { vertical: 'center', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: { m: popoverPlacement?.paperMargin ?? '0 0 0 8px' },
        },
      }}
    >
      <Box sx={{ width: POPOVER_WIDTH, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box>
            <Box component="h3" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
              {taskName}
            </Box>
          </Box>
          <Box
            component="button"
            onClick={onClose}
            sx={{
              p: 0.5,
              borderRadius: 1,
              border: 'none',
              bgcolor: 'transparent',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
              transition: 'background-color 0.2s',
            }}
            aria-label="Close"
          >
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </Box>
        </Box>
        <Box
          sx={{
            fontSize: '0.75rem',
            borderRadius: 1,
            p: 1.5,
            border: '1px dashed var(--border-color)',
            color: 'text.secondary',
          }}
        >
          Task details panel (folder tree removed during migration)
        </Box>
      </Box>
    </Popover>
  );
}
