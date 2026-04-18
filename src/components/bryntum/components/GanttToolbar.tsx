'use client';

import { useState } from 'react';
import { Box, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Button } from '@/components/ui/button';
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  DownloadSimple,
  Columns,
  DotsThreeVertical,
  Lock,
  LockOpen,
  Plus,
} from '@phosphor-icons/react';

// ─── Constants ────────────────────────────────────────────────────────────────
const VIEW_PRESETS = [
  { label: 'Day',   value: 'hourAndDay' },
  { label: 'Week',  value: 'weekAndDayLetterCompact' },
  { label: 'Month', value: 'weekAndMonth' },
  { label: 'Year',  value: 'monthAndYear' },
] as const;

// ─── Shared card styles (matches VersionControlBar / TaskProgressCard) ────────

/** Card container — groups related controls into a single rounded pill */
const cardContainerSx = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 34,
  bgcolor: 'var(--bg-card)',
  borderRadius: '10px',
  border: '1px solid var(--border-color)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  overflow: 'hidden',
} as const;

/** Borderless button inside a card container */
const cardItemSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  px: 1.25,
  border: 'none',
  bgcolor: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '0.6875rem',
  fontWeight: 500,
  fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  letterSpacing: '-0.01em',
  lineHeight: 1,
  transition: 'background-color 0.15s, color 0.15s',
  '&:hover': {
    bgcolor: 'action.hover',
  },
} as const;

/** Thin vertical separator inside a card */
const cardDividerSx = {
  width: '1px',
  height: 14,
  bgcolor: 'divider',
  flexShrink: 0,
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────
type GanttToolbarProps = {
  onAddTask?: () => void;
  onPresetChange?: (preset: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomToFit?: () => void;
  onShiftPrevious?: () => void;
  onShiftNext?: () => void;
  onExport?: () => void;
  onColumnsClick?: () => void;
  onMoreClick?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /** Whether the current user has permission to unlock the chart for editing. */
  canEditChart?: boolean;
  /** Whether the chart is currently unlocked for editing. */
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function GanttToolbar({
  onAddTask,
  onPresetChange,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onShiftPrevious,
  onShiftNext,
  onExport,
  onColumnsClick,
  onMoreClick,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  canEditChart = false,
  isEditMode = false,
  onToggleEditMode,
}: GanttToolbarProps) {
  const editingActive = canEditChart && isEditMode;
  const [activePreset, setActivePreset] = useState('weekAndDayLetterCompact');
  const theme = useTheme();

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset);
    onPresetChange?.(preset);
  };

  const getSegmentSx = (isActive: boolean) => ({
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    px: '14px',
    height: 26,
    fontSize: '12px',
    fontWeight: isActive ? 600 : 450,
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
    cursor: 'pointer',
    userSelect: 'none' as const,
    color: isActive
      ? theme.palette.text.primary
      : theme.palette.text.secondary,
    bgcolor: isActive ? theme.palette.background.paper : 'transparent',
    borderRadius: '6px',
    transition: 'color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, font-weight 0.2s ease, transform 0.1s ease',
    zIndex: 1,
    lineHeight: 1,
    letterSpacing: isActive ? '-0.01em' : '0',
    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08), 0 0.5px 1px rgba(0,0,0,0.04)' : 'none',
    ...(!isActive && {
      '&:hover': {
        color: theme.palette.text.primary,
        bgcolor: 'rgba(43, 45, 66, 0.05)',
      },
    }),
    '&:active': {
      transform: 'scale(0.96)',
    },
  });

  const hasRightControls = onExport || onColumnsClick || onMoreClick;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        px: 2,
        py: 1,
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0,
        bgcolor: 'var(--gantt-toolbar-bg)',
      }}
    >
      {/* ── View Preset Picker ──────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 32,
          bgcolor: 'rgba(43, 45, 66, 0.07)',
          borderRadius: '8px',
          p: '3px',
          gap: '2px',
        }}
      >
        {VIEW_PRESETS.map((preset) => {
          const isActive = activePreset === preset.value;
          return (
            <Box key={preset.value} component="label" sx={getSegmentSx(isActive)}>
              <input
                type="radio"
                name="gantt-view-preset"
                value={preset.value}
                checked={isActive}
                onChange={() => handlePresetClick(preset.value)}
                style={{ display: 'none' }}
              />
              {preset.label}
            </Box>
          );
        })}
      </Box>

      {/* ── Zoom + Nav Controls ──────────────────────────────────────────── */}
      <Box sx={cardContainerSx}>
        <Box component="button" sx={cardItemSx} onClick={onZoomOut} title="Zoom out">
          –
        </Box>
        <Box sx={cardDividerSx} />
        <Box component="button" sx={cardItemSx} onClick={onZoomIn} title="Zoom in">
          +
        </Box>
        <Box sx={cardDividerSx} />
        <Box component="button" sx={cardItemSx} onClick={onZoomToFit} title="Fit all tasks">
          Fit
        </Box>
        <Box sx={cardDividerSx} />
        <Box component="button" sx={cardItemSx} onClick={onShiftPrevious} title="Previous time span">
          <CaretDoubleLeft size={12} weight="bold" />
        </Box>
        <Box sx={cardDividerSx} />
        <Box component="button" sx={cardItemSx} onClick={onShiftNext} title="Next time span">
          <CaretDoubleRight size={12} weight="bold" />
        </Box>
      </Box>

      {/* ── Undo / Redo (only active in edit mode) ───────────────────── */}
      {editingActive && (
        <Box sx={{ ...cardContainerSx, animation: 'gantt-tool-pop-in 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2) both' }}>
          <Box
            component="button"
            sx={{ ...cardItemSx, opacity: canUndo ? 1 : 0.35, cursor: canUndo ? 'pointer' : 'default' }}
            onClick={canUndo ? onUndo : undefined}
            title="Undo (Ctrl+Z)"
          >
            <ArrowUUpLeft size={13} weight="bold" />
          </Box>
          <Box sx={cardDividerSx} />
          <Box
            component="button"
            sx={{ ...cardItemSx, opacity: canRedo ? 1 : 0.35, cursor: canRedo ? 'pointer' : 'default' }}
            onClick={canRedo ? onRedo : undefined}
            title="Redo (Ctrl+Y)"
          >
            <ArrowUUpRight size={13} weight="bold" />
          </Box>
        </Box>
      )}

      {/* ── Spacer ─────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1 }} />

      {/* ── Right Controls ─────────────────────────────────────────────── */}
      {hasRightControls && (
        <Box sx={cardContainerSx}>
          {onExport && (
            <Box component="button" sx={cardItemSx} onClick={onExport} title="Export">
              <DownloadSimple size={12} weight="bold" />
            </Box>
          )}
          {onExport && (onColumnsClick || onMoreClick) && <Box sx={cardDividerSx} />}
          {onColumnsClick && (
            <Box
              component="button"
              sx={{ ...cardItemSx, gap: 0.5, px: 1.5 }}
              onClick={onColumnsClick}
              title="Configure columns"
            >
              <Columns size={12} weight="bold" />
              Columns
            </Box>
          )}
          {onColumnsClick && onMoreClick && <Box sx={cardDividerSx} />}
          {onMoreClick && (
            <Box component="button" sx={cardItemSx} onClick={onMoreClick} title="More options">
              <DotsThreeVertical size={12} weight="bold" />
            </Box>
          )}
        </Box>
      )}

      {/* ── Edit / Lock toggle (admin-level users only) ────────────────── */}
      {canEditChart && (
        <Box
          component="button"
          onClick={onToggleEditMode}
          title={editingActive ? 'Lock chart (exit edit mode)' : 'Edit chart'}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            height: 34,
            px: '14px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
            letterSpacing: '-0.01em',
            cursor: 'pointer',
            transition:
              'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.12s ease',
            '&:active': { transform: 'scale(0.96)' },
            ...(editingActive
              ? {
                  bgcolor: 'var(--accent-primary, #2563eb)',
                  color: '#fff',
                  border: '1px solid var(--accent-primary, #2563eb)',
                  boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.14)',
                  '&:hover': { filter: 'brightness(0.9)' },
                }
              : {
                  bgcolor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                  '&:hover': { bgcolor: 'action.hover' },
                }),
          }}
        >
          <Box
            key={editingActive ? 'unlocked' : 'locked'}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'gantt-icon-swap 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
            }}
          >
            {editingActive ? (
              <LockOpen size={13} weight="bold" />
            ) : (
              <Lock size={13} weight="bold" />
            )}
          </Box>
          {editingActive ? 'Editing' : 'Edit'}
        </Box>
      )}

      {/* ── Add Task (only active in edit mode) ────────────────────────── */}
      {onAddTask && editingActive && (
        <Button
          variant="contained"
          size="small"
          disableElevation
          startIcon={<Plus size={12} />}
          onClick={onAddTask}
          sx={{
            px: '14px',
            py: '6px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
            textTransform: 'none',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-primary, #2563eb)',
            color: '#fff',
            animation: 'gantt-tool-pop-in 0.26s cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
            '&:hover': {
              backgroundColor: 'var(--accent-primary, #2563eb)',
              filter: 'brightness(0.9)',
            },
          }}
        >
          Add Task
        </Button>
      )}

      {/* Keyframes for the toolbar micro-animations — scoped via a global <style>. */}
      <Box
        component="style"
        sx={{ display: 'none' }}
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes gantt-tool-pop-in {
              0%   { opacity: 0; transform: scale(0.9) translateY(2px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes gantt-icon-swap {
              0%   { opacity: 0; transform: rotate(-35deg) scale(0.7); }
              60%  { opacity: 1; transform: rotate(6deg) scale(1.08); }
              100% { opacity: 1; transform: rotate(0) scale(1); }
            }
            @media (prefers-reduced-motion: reduce) {
              @keyframes gantt-tool-pop-in { from, to { opacity: 1; transform: none; } }
              @keyframes gantt-icon-swap   { from, to { opacity: 1; transform: none; } }
            }
          `,
        }}
      />
    </Stack>
  );
}
