'use client';

import { useState, useEffect } from 'react';
import { Tag, CaretDown, CaretRight, Plus, MagnifyingGlass } from '@phosphor-icons/react';
import { Box, Typography, Menu, MenuItem, TextField, InputAdornment } from '@mui/material';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { formatCsiCode, CSI_MASTERFORMAT, CSI_SUBDIVISION_MAP } from '@/lib/constants/csiCodes';

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
  const [expandedDivision, setExpandedDivision] = useState<string | null>(null);
  const [optimisticCode, setOptimisticCode] = useState<string | null | undefined>(undefined);

  const utils = api.useUtils();

  const updateCsiCode = api.gantt.updateCsiCode.useMutation({
    onSuccess: () => {
      void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
    },
    onError: (error) => {
      setOptimisticCode(undefined);
      showSnackbar(error.message || 'Failed to update CSI code', 'error');
    },
  });

  // Clear optimistic value once the server prop catches up
  useEffect(() => {
    if (optimisticCode !== undefined && csiCode === optimisticCode) {
      setOptimisticCode(undefined);
    }
  }, [csiCode, optimisticCode]);

  // Use optimistic value while mutation is in flight, otherwise use server value
  const displayCode = optimisticCode !== undefined ? optimisticCode : csiCode;

  // Auto-expand parent division when menu opens with an existing code
  useEffect(() => {
    if (anchorEl && displayCode) {
      const subEntry = CSI_SUBDIVISION_MAP.get(displayCode);
      if (subEntry) {
        setExpandedDivision(subEntry.division.code);
      }
    }
  }, [anchorEl, displayCode]);

  const query = search.toLowerCase();

  // Filter: show divisions that match name OR have matching subdivisions
  const filteredDivisions = CSI_MASTERFORMAT.map((div) => {
    const divMatches = !query || div.code.includes(query) || div.name.toLowerCase().includes(query);
    const matchingSubs = div.subdivisions.filter(
      (sub) =>
        !query || sub.code.toLowerCase().includes(query) || sub.name.toLowerCase().includes(query),
    );

    if (!query) return { div, matchingSubs: div.subdivisions, show: true };
    if (divMatches) return { div, matchingSubs: div.subdivisions, show: true };
    if (matchingSubs.length > 0) return { div, matchingSubs, show: true };
    return { div, matchingSubs: [], show: false };
  }).filter((entry) => entry.show);

  const isSearching = query.length > 0;
  const hasCode = !!displayCode;

  return (
    <>
      <Box
        component="button"
        onClick={(e) => {
          setAnchorEl(e.currentTarget as HTMLElement);
          setSearch('');
          if (!displayCode) setExpandedDivision(null);
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
          cursor: 'pointer',
          px: 1,
          py: '3px',
          maxWidth: '100%',
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
            {formatCsiCode(displayCode!)}
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
        {hasCode ? (
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
              maxHeight: 380,
              width: 380,
              borderRadius: '12px',
              mt: 0.5,
            },
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
          <TextField
            size="small"
            placeholder="Search CSI codes…"
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
              setOptimisticCode(null);
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

        {filteredDivisions.map(({ div, matchingSubs }) => {
          const isExpanded = isSearching || expandedDivision === div.code;

          return (
            <Box key={div.code}>
              {/* Division header — non-selectable, toggles expand */}
              <MenuItem
                onClick={() => {
                  if (isSearching) return;
                  setExpandedDivision(expandedDivision === div.code ? null : div.code);
                }}
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'text.secondary',
                  gap: 0.75,
                  py: 0.75,
                  cursor: isSearching ? 'default' : 'pointer',
                  '&:hover': {
                    bgcolor: isSearching ? 'transparent' : 'action.hover',
                  },
                }}
              >
                {isSearching ? (
                  <CaretDown
                    size={12}
                    color="var(--mui-palette-text-disabled)"
                    style={{ flexShrink: 0 }}
                  />
                ) : isExpanded ? (
                  <CaretDown
                    size={12}
                    color="var(--mui-palette-text-disabled)"
                    style={{ flexShrink: 0 }}
                  />
                ) : (
                  <CaretRight
                    size={12}
                    color="var(--mui-palette-text-disabled)"
                    style={{ flexShrink: 0 }}
                  />
                )}
                <Typography
                  component="span"
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'text.secondary',
                    minWidth: 20,
                  }}
                >
                  {div.code}
                </Typography>
                {div.name}
              </MenuItem>

              {/* Subdivision items — only when expanded or searching */}
              {isExpanded &&
                matchingSubs.map((sub) => (
                  <MenuItem
                    key={sub.code}
                    selected={displayCode === sub.code}
                    onClick={() => {
                      setOptimisticCode(sub.code);
                      updateCsiCode.mutate({
                        organizationId,
                        projectId,
                        taskId,
                        csiCode: sub.code,
                      });
                      setAnchorEl(null);
                    }}
                    sx={{
                      fontSize: 12,
                      gap: 0.75,
                      pl: 4.5,
                      py: 0.5,
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'text.secondary',
                        minWidth: 56,
                        flexShrink: 0,
                      }}
                    >
                      {sub.code}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sub.name}
                    </Typography>
                  </MenuItem>
                ))}
            </Box>
          );
        })}

        {filteredDivisions.length === 0 && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
              No CSI codes match &ldquo;{search}&rdquo;
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
}
