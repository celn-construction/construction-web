'use client';

import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import {
  Tag,
  CaretDown,
  CaretRight,
  MagnifyingGlass,
  Check,
  X,
  Prohibit,
} from '@phosphor-icons/react';
import { Box, Typography, IconButton, InputBase, Divider } from '@mui/material';
import { useSnackbar } from '@/hooks/useSnackbar';
import {
  CSI_MASTERFORMAT,
  CSI_SUBDIVISION_MAP,
  type CsiSubdivision,
} from '@/lib/constants/csiCodes';
import type { BryntumGanttInstance } from '../../types';

// ─── Subdivision row ────────────────────────────────────────────────
interface SubdivisionItemProps {
  sub: CsiSubdivision;
  isSelected: boolean;
  onSelect: (code: string) => void;
}

const SubdivisionItem = memo(function SubdivisionItem({
  sub,
  isSelected,
  onSelect,
}: SubdivisionItemProps) {
  return (
    <Box
      component="div"
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => onSelect(sub.code)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(sub.code);
        }
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        pl: 4.5,
        pr: 2,
        py: '6px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background-color 0.1s',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: isSelected ? 'action.selected' : 'action.hover',
        },
        '&::before': isSelected
          ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '2.5px',
              height: 16,
              borderRadius: '0 2px 2px 0',
              bgcolor: 'sidebar.indicator',
            }
          : undefined,
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 500,
          color: isSelected ? 'text.primary' : 'text.secondary',
          minWidth: 52,
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.02em',
        }}
      >
        {sub.code}
      </Typography>
      <Typography
        component="span"
        sx={{
          fontSize: '0.75rem',
          fontWeight: isSelected ? 550 : 400,
          color: isSelected ? 'text.primary' : 'text.secondary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
        }}
      >
        {sub.name}
      </Typography>
      {isSelected && (
        <Check
          size={12}
          weight="bold"
          color="var(--sidebar-indicator)"
          style={{ flexShrink: 0 }}
        />
      )}
    </Box>
  );
});

// ─── Main panel ─────────────────────────────────────────────────────
interface CsiCodePanelProps {
  csiCode: string | null | undefined;
  taskId: string;
  ganttInstance: BryntumGanttInstance | null;
  onClose: () => void;
}

export default function CsiCodePanel({
  csiCode,
  taskId,
  ganttInstance,
  onClose,
}: CsiCodePanelProps) {
  const { showSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [expandedDivision, setExpandedDivision] = useState<string | null>(null);
  const [optimisticCode, setOptimisticCode] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (optimisticCode !== undefined && csiCode === optimisticCode) {
      setOptimisticCode(undefined);
    }
  }, [csiCode, optimisticCode]);

  const displayCode = optimisticCode !== undefined ? optimisticCode : csiCode;

  // Auto-expand the division containing the current code
  useEffect(() => {
    if (displayCode) {
      const subEntry = CSI_SUBDIVISION_MAP.get(displayCode);
      if (subEntry) {
        setExpandedDivision(subEntry.division.code);
      }
    }
  }, [displayCode]);

  const query = search.toLowerCase();
  const isSearching = query.length > 0;

  const displayDivisions = useMemo(() => {
    const filtered = CSI_MASTERFORMAT.map((div) => {
      const divMatches =
        !query || div.code.includes(query) || div.nameLower.includes(query);
      const matchingSubs = div.subdivisions.filter(
        (sub) =>
          !query || sub.code.includes(query) || sub.nameLower.includes(query),
      );

      if (!query) return { div, matchingSubs: div.subdivisions, show: true };
      if (divMatches) return { div, matchingSubs: div.subdivisions, show: true };
      if (matchingSubs.length > 0) return { div, matchingSubs, show: true };
      return { div, matchingSubs: [], show: false };
    }).filter((entry) => entry.show);

    return isSearching
      ? filtered.map((entry) => ({
          ...entry,
          matchingSubs: entry.matchingSubs.slice(0, 15),
        }))
      : filtered;
  }, [query, isSearching]);

  // Mutate the Bryntum task record directly. autoSync flushes the change to
  // `gantt.sync` on its next tick (last-write-wins, no version check).
  const writeCsiCode = useCallback(
    (next: string | null) => {
      const taskStore = ganttInstance?.project?.taskStore as
        | { getById?: (id: string) => { csiCode?: string | null } | null | undefined }
        | undefined;
      const record = taskStore?.getById?.(taskId);
      if (!record) {
        showSnackbar('Could not find task in chart — try reloading', 'error');
        setOptimisticCode(undefined);
        return;
      }
      record.csiCode = next;
    },
    [ganttInstance, taskId, showSnackbar],
  );

  const handleSelectSubdivision = useCallback(
    (code: string) => {
      setOptimisticCode(code);
      writeCsiCode(code);
    },
    [writeCsiCode],
  );

  const handleRemoveCode = useCallback(() => {
    setOptimisticCode(null);
    writeCsiCode(null);
  }, [writeCsiCode]);

  const hasCode = !!displayCode;
  const subEntry = hasCode ? CSI_SUBDIVISION_MAP.get(displayCode!) : null;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        minWidth: 0,
        maxHeight: '85vh',
        animation: 'slideInRight 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '@keyframes slideInRight': {
          from: { opacity: 0, transform: 'translateX(12px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
      }}
    >
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: '16px', py: '12px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Tag size={14} weight="bold" color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>
            CSI Classification
          </Typography>
        </Box>
        <Box
          component="button"
          onClick={onClose}
          sx={{
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            border: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            color: 'text.secondary',
            flexShrink: 0,
            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
            transition: 'background-color 0.15s, color 0.15s',
          }}
          aria-label="Close CSI panel"
        >
          <X size={13} />
        </Box>
      </Box>

      {/* ── Current selection ── */}
      {hasCode && subEntry && (
        <Box
          sx={{
            mx: '16px',
            mb: 1.5,
            px: 1.5,
            py: 1.25,
            borderRadius: '8px',
            bgcolor: 'action.selected',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <Check size={13} weight="bold" color="var(--sidebar-indicator)" style={{ flexShrink: 0, marginTop: 1 }} />
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
              }}
            >
              {displayCode}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'text.secondary',
                lineHeight: 1.3,
              }}
            >
              {subEntry.subdivision.name}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.5625rem',
                fontWeight: 500,
                color: 'text.secondary',
                lineHeight: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                mt: '1px',
              }}
            >
              {subEntry.division.name}
            </Typography>
          </Box>
          <Box
            component="button"
            onClick={handleRemoveCode}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: '5px',
              border: 'none',
              bgcolor: 'transparent',
              cursor: 'pointer',
              color: 'text.secondary',
              flexShrink: 0,
              '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
              transition: 'background-color 0.15s, color 0.15s',
            }}
            aria-label="Remove classification"
          >
            <Prohibit size={12} weight="bold" />
          </Box>
        </Box>
      )}

      <Divider />

      {/* ── Search bar ── */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
        }}
      >
        <MagnifyingGlass
          size={14}
          color="var(--text-secondary)"
          style={{ flexShrink: 0 }}
        />
        <InputBase
          placeholder="Search divisions or codes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          fullWidth
          sx={{
            fontSize: '0.8125rem',
            '& .MuiInputBase-input': {
              p: 0,
              '&::placeholder': {
                color: 'text.disabled',
                opacity: 1,
              },
            },
          }}
        />
        {isSearching && (
          <IconButton
            size="small"
            onClick={() => setSearch('')}
            sx={{ p: 0.25, flexShrink: 0 }}
            aria-label="Clear search"
          >
            <X size={12} weight="bold" />
          </IconButton>
        )}
      </Box>

      {/* ── Division list ── */}
      <Box
        component="ul"
        role="listbox"
        sx={{ listStyle: 'none', m: 0, p: 0, overflowY: 'auto', flex: 1 }}
      >
        {displayDivisions.map(({ div, matchingSubs }, idx) => {
          const isExpanded = isSearching || expandedDivision === div.code;

          return (
            <Box component="li" key={div.code} sx={{ listStyle: 'none' }}>
              {/* Division header */}
              <Box
                role="button"
                tabIndex={isSearching ? -1 : 0}
                onClick={() => {
                  if (isSearching) return;
                  setExpandedDivision(expandedDivision === div.code ? null : div.code);
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (isSearching) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedDivision(expandedDivision === div.code ? null : div.code);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: '8px',
                  cursor: isSearching ? 'default' : 'pointer',
                  borderTop: idx > 0 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  transition: 'background-color 0.1s',
                  userSelect: 'none',
                  '&:hover': {
                    bgcolor: isSearching ? 'transparent' : 'action.hover',
                  },
                }}
              >
                {isSearching || isExpanded ? (
                  <CaretDown size={11} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                ) : (
                  <CaretRight size={11} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                )}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.selected',
                    borderRadius: '4px',
                    px: 0.625,
                    py: '1px',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: 'text.secondary',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.4,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {div.code}
                  </Typography>
                </Box>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  {div.name}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.5625rem',
                    fontWeight: 500,
                    color: 'text.secondary',
                    ml: 'auto',
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {matchingSubs.length}
                </Typography>
              </Box>

              {/* Subdivision items */}
              {isExpanded &&
                matchingSubs.map((sub) => (
                  <SubdivisionItem
                    key={sub.code}
                    sub={sub}
                    isSelected={displayCode === sub.code}
                    onSelect={handleSelectSubdivision}
                  />
                ))}
            </Box>
          );
        })}
      </Box>

      {/* ── Empty state ── */}
      {displayDivisions.length === 0 && (
        <Box
          sx={{
            px: 3,
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <MagnifyingGlass
            size={20}
            color="var(--text-secondary)"
          />
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'text.secondary',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            No codes match &ldquo;{search}&rdquo;
          </Typography>
        </Box>
      )}
    </Box>
  );
}
