'use client';

import { useState } from 'react';
import { DotsThreeVertical, PencilSimple, Trash } from '@phosphor-icons/react';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface MemberRowMenuProps {
  canEdit: boolean;
  canRemove: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

export default function MemberRowMenu({
  canEdit,
  canRemove,
  onEdit,
  onRemove,
}: MemberRowMenuProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (!canEdit && !canRemove) return null;

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
        aria-label="Member actions"
        sx={{
          width: 30,
          height: 30,
          borderRadius: '8px',
          color: 'text.primary',
          bgcolor: open ? 'action.selected' : 'transparent',
          transition: 'background-color 0.15s, color 0.15s',
          '&:hover': {
            bgcolor: 'action.hover',
            color: 'text.primary',
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <DotsThreeVertical size={18} weight="bold" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 200,
              borderRadius: '10px',
              border: 1,
              borderColor: 'divider',
            },
          },
        }}
      >
        {canEdit && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onEdit();
            }}
            sx={{ fontSize: '0.8125rem', py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: '28px !important', color: 'text.primary' }}>
              <PencilSimple size={15} weight="bold" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ fontSize: '0.8125rem' }}
              primary="Edit user…"
            />
          </MenuItem>
        )}
        {canRemove && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onRemove();
            }}
            sx={{
              fontSize: '0.8125rem',
              py: 1,
              color: theme.palette.error.main,
              '&:hover': { color: theme.palette.error.main },
            }}
          >
            <ListItemIcon sx={{ minWidth: '28px !important', color: 'inherit' }}>
              <Trash size={15} weight="bold" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ fontSize: '0.8125rem' }}
              primary="Remove from organization…"
            />
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
