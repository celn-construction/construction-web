'use client';

import { useState } from 'react';
import { Box, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Button } from '@/components/ui/button';
import {
  CaretDoubleLeft,
  CaretDoubleRight,
  DownloadSimple,
  Columns,
  DotsThreeVertical,
  Plus,
} from '@phosphor-icons/react';

// ─── Constants ────────────────────────────────────────────────────────────────
const VIEW_PRESETS = [
  { label: 'Day',   value: 'hourAndDay' },
  { label: 'Week',  value: 'weekAndDayLetter' },
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
}: GanttToolbarProps) {
  const [activePreset, setActivePreset] = useState('weekAndDayLetter');
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

      {/* ── Add Task ───────────────────────────────────────────────────── */}
      {onAddTask && (
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
            '&:hover': {
              backgroundColor: 'var(--accent-primary, #2563eb)',
              filter: 'brightness(0.9)',
            },
          }}
        >
          Add Task
        </Button>
      )}
    </Stack>
  );
}
