'use client';

import { useState } from 'react';
import { Tag, CaretDown, Plus, MagnifyingGlass } from '@phosphor-icons/react';
import { Box, Typography, Menu, MenuItem, TextField, InputAdornment, CircularProgress } from '@mui/material';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { formatCsiCode, CSI_DIVISIONS } from '@/lib/constants/csiCodes';

interface CsiCodeSelectorProps {
  csiCode: string | null | undefined;
  organizationId: string;
  projectId: string;
  taskId: string;
}

export default function CsiCodeSelector({
  csiCode,
  organizationId,
  projectId,
  taskId,
}: CsiCodeSelectorProps) {
  const { showSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');

  const utils = api.useUtils();

  const updateCsiCode = api.gantt.updateCsiCode.useMutation({
    onSuccess: () => {
      void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to update CSI code', 'error');
    },
  });

  const filteredDivisions = CSI_DIVISIONS.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.code.includes(q) || d.name.toLowerCase().includes(q);
  });

  const hasCode = !!csiCode;
  const isPending = updateCsiCode.isPending;

  return (
    <>
      <Box
        component="button"
        onClick={(e) => {
          if (isPending) return;
          setAnchorEl(e.currentTarget as HTMLElement);
          setSearch('');
        }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: '5px',
          borderWidth: '1px',
          borderStyle: hasCode ? 'solid' : 'dashed',
          borderColor: hasCode ? 'divider' : 'text.disabled',
          borderRadius: '6px',
          bgcolor: 'transparent',
          cursor: isPending ? 'default' : 'pointer',
          px: 1,
          py: '3px',
          maxWidth: '100%',
          opacity: isPending ? 0.7 : 1,
          pointerEvents: isPending ? 'none' : 'auto',
          transition: 'background-color 0.15s, border-color 0.15s, opacity 0.15s',
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: hasCode ? 'text.disabled' : 'text.secondary',
            borderStyle: 'solid',
          },
        }}
      >
        <Tag
          size={12}
          color={hasCode ? 'var(--mui-palette-text-secondary)' : 'var(--mui-palette-text-disabled)'}
          style={{ flexShrink: 0 }}
        />
        {hasCode ? (
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formatCsiCode(csiCode!)}
          </Typography>
        ) : (
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 500,
              color: 'text.disabled',
              lineHeight: 1,
            }}
          >
            CSI Code
          </Typography>
        )}
        {isPending ? (
          <CircularProgress size={10} sx={{ color: 'text.disabled', flexShrink: 0 }} />
        ) : hasCode ? (
          <CaretDown
            size={10}
            color="var(--mui-palette-text-disabled)"
            style={{ flexShrink: 0 }}
          />
        ) : (
          <Plus
            size={10}
            color="var(--mui-palette-text-disabled)"
            style={{ flexShrink: 0 }}
          />
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              maxHeight: 320,
              width: 340,
              borderRadius: '12px',
              mt: 0.5,
            },
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
          <TextField
            size="small"
            placeholder="Search divisions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MagnifyingGlass size={14} />
                  </InputAdornment>
                ),
                sx: { fontSize: 13 },
              },
            }}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </Box>
        {hasCode && (
          <MenuItem
            onClick={() => {
              updateCsiCode.mutate({
                organizationId,
                projectId,
                taskId,
                csiCode: null,
              });
              setAnchorEl(null);
            }}
            sx={{
              fontSize: 12,
              color: 'error.main',
              fontStyle: 'italic',
            }}
          >
            Remove CSI Code
          </MenuItem>
        )}
        {filteredDivisions.map((d) => (
          <MenuItem
            key={d.code}
            selected={csiCode === d.code}
            onClick={() => {
              updateCsiCode.mutate({
                organizationId,
                projectId,
                taskId,
                csiCode: d.code,
              });
              setAnchorEl(null);
            }}
            sx={{
              fontSize: 12,
              gap: 1,
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: 'text.secondary',
                minWidth: 24,
              }}
            >
              {d.code}
            </Typography>
            {d.name}
          </MenuItem>
        ))}
        {filteredDivisions.length === 0 && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
              No divisions match &ldquo;{search}&rdquo;
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
}
