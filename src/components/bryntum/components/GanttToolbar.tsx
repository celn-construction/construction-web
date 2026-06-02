'use client';

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Box, MenuItem, Select, Stack, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Button } from '@/components/ui/button';
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  ArrowsOutSimple,
  CaretDoubleLeft,
  CaretDoubleRight,
  DownloadSimple,
  Columns,
  DotsThreeVertical,
  LinkSimple,
  Lock,
  LockOpen,
  Minus,
  Plus,
} from '@phosphor-icons/react';

// ─── Pulse variants — semantic motion per action ──────────────────────────────
type PulseVariant = 'scale-out' | 'scale-in' | 'wobble' | 'slide-left' | 'slide-right';

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
  flexShrink: 0,
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
  transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.12s ease',
  outline: 'none',
  '&:hover': {
    bgcolor: 'action.hover',
    color: 'var(--text-primary)',
  },
  '&:active': {
    transform: 'scale(0.9)',
  },
  '&:focus-visible': {
    boxShadow: 'inset 0 0 0 2px var(--focus-ring, rgba(43, 45, 66, 0.45))',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'background-color 0.01s, color 0.01s',
    '&:active': { transform: 'none' },
  },
} as const;

/**
 * Toolbar button that re-runs a pulse animation on every click via a key-bump.
 * `:active` alone is too brief (~80ms held) for noticeable motion — remounting
 * the inner span on each click cleanly restarts the CSS animation.
 */
function ToolbarPulseButton({
  onClick,
  ariaLabel,
  tooltip,
  shortcut,
  pulseVariant,
  children,
}: {
  onClick?: () => void;
  ariaLabel: string;
  tooltip: string;
  shortcut?: string;
  pulseVariant: PulseVariant;
  children: ReactNode;
}) {
  const [pulseKey, setPulseKey] = useState(0);
  const handleClick = () => {
    setPulseKey((k) => k + 1);
    onClick?.();
  };
  const tooltipTitle = shortcut ? `${tooltip} (${shortcut})` : tooltip;
  return (
    <Tooltip title={tooltipTitle} placement="bottom" enterDelay={400} enterNextDelay={200} arrow>
      <Box
        component="button"
        type="button"
        aria-label={ariaLabel}
        onClick={handleClick}
        sx={cardItemSx}
      >
        <Box
          key={pulseKey}
          aria-hidden
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            willChange: pulseKey > 0 ? 'transform' : 'auto',
            animation:
              pulseKey > 0
                ? `gantt-pulse-${pulseVariant} 0.34s cubic-bezier(0.2, 0.9, 0.3, 1.2) both`
                : 'none',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          {children}
        </Box>
      </Box>
    </Tooltip>
  );
}

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
  onColumnsClick?: (event: MouseEvent<HTMLElement>) => void;
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
  /** Whether dependency-link mode is active (plain click selects tasks to link). */
  linkMode?: boolean;
  onToggleLinkMode?: () => void;
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
  linkMode = false,
  onToggleLinkMode,
}: GanttToolbarProps) {
  const editingActive = canEditChart && isEditMode;
  const [activePreset, setActivePreset] = useState('weekAndDayLetterCompact');
  const theme = useTheme();

  // Segmented control: measure active segment so a single shared indicator can
  // slide between presets (instead of each segment owning its own background).
  const segmentTrackRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<Record<string, HTMLLabelElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const measureIndicator = () => {
    const track = segmentTrackRef.current;
    const target = segmentRefs.current[activePreset];
    if (!track || !target) return;
    const trackRect = track.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const next = {
      left: targetRect.left - trackRect.left,
      width: targetRect.width,
    };
    setIndicator((prev) => {
      if (prev && prev.left === next.left && prev.width === next.width) return prev;
      return next;
    });
  };

  useLayoutEffect(() => {
    measureIndicator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePreset]);

  useEffect(() => {
    const track = segmentTrackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureIndicator());
    ro.observe(track);
    Object.values(segmentRefs.current).forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePreset]);

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
    color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
    borderRadius: '6px',
    transition:
      'color 0.28s cubic-bezier(0.16, 1, 0.3, 1), font-weight 0.28s ease, letter-spacing 0.28s ease, transform 0.12s ease',
    zIndex: 1,
    lineHeight: 1,
    letterSpacing: isActive ? '-0.01em' : '0',
    ...(!isActive && {
      '&:hover': {
        color: theme.palette.text.primary,
      },
    }),
    '&:active': {
      transform: 'scale(0.94)',
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'color 0.01s, font-weight 0.01s',
      '&:active': { transform: 'none' },
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
        containerType: 'inline-size',
        containerName: 'gantt-toolbar',
      }}
    >
      {/* ── View Preset Picker — segmented (hidden ≤560px) ──────────────── */}
      <Box
        ref={segmentTrackRef}
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          height: 32,
          bgcolor: 'action.selected',
          borderRadius: '8px',
          p: '3px',
          gap: '2px',
          flexShrink: 0,
          '@container gantt-toolbar (max-width: 560px)': {
            display: 'none',
          },
        }}
      >
        {/* Shared sliding indicator — translateX is GPU-composited (skips layout/paint) */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 3,
            bottom: 3,
            left: 0,
            width: indicator?.width ?? 0,
            transform: `translate3d(${indicator?.left ?? 0}px, 0, 0)`,
            bgcolor: 'background.paper',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0.5px 1px rgba(0,0,0,0.04)',
            willChange: 'transform, width',
            transition:
              'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), width 0.32s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease',
            opacity: indicator ? 1 : 0,
            zIndex: 0,
            pointerEvents: 'none',
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'opacity 0.2s ease',
            },
          }}
        >
          {/* Activation pulse — animates opacity + scale (GPU), not box-shadow (paint) */}
          <Box
            key={activePreset}
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              border: '1.5px solid rgba(43, 45, 66, 0.45)',
              pointerEvents: 'none',
              willChange: 'transform, opacity',
              animation: 'gantt-segment-pulse 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          />
        </Box>

        {VIEW_PRESETS.map((preset) => {
          const isActive = activePreset === preset.value;
          return (
            <Box
              key={preset.value}
              component="label"
              ref={(el: HTMLLabelElement | null) => {
                segmentRefs.current[preset.value] = el;
              }}
              sx={getSegmentSx(isActive)}
            >
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

      {/* ── View Preset Picker — select fallback (shown ≤560px) ─────────── */}
      <Select
        value={activePreset}
        onChange={(e) => handlePresetClick(e.target.value as string)}
        size="small"
        aria-label="Time scale"
        sx={{
          display: 'none',
          flexShrink: 0,
          height: 32,
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
          letterSpacing: '-0.01em',
          bgcolor: 'background.paper',
          '& .MuiSelect-select': {
            py: 0,
            display: 'flex',
            alignItems: 'center',
          },
          '@container gantt-toolbar (max-width: 560px)': {
            display: 'inline-flex',
          },
        }}
      >
        {VIEW_PRESETS.map((preset) => (
          <MenuItem key={preset.value} value={preset.value} sx={{ fontSize: '12px' }}>
            {preset.label}
          </MenuItem>
        ))}
      </Select>

      {/* ── Zoom + Nav Controls ──────────────────────────────────────────── */}
      <Box
        sx={{
          ...cardContainerSx,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            borderColor: 'var(--border-color)',
            boxShadow:
              '0 2px 6px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
          },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        <ToolbarPulseButton
          ariaLabel="Zoom out"
          tooltip="Zoom out"
          pulseVariant="scale-in"
          onClick={onZoomOut}
        >
          <Minus size={12} weight="bold" />
        </ToolbarPulseButton>
        <Box sx={cardDividerSx} />
        <ToolbarPulseButton
          ariaLabel="Zoom in"
          tooltip="Zoom in"
          pulseVariant="scale-out"
          onClick={onZoomIn}
        >
          <Plus size={12} weight="bold" />
        </ToolbarPulseButton>
        <Box sx={cardDividerSx} />
        <ToolbarPulseButton
          ariaLabel="Fit all tasks"
          tooltip="Fit all tasks"
          pulseVariant="wobble"
          onClick={onZoomToFit}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <ArrowsOutSimple size={11} weight="bold" />
            <Box component="span">Fit</Box>
          </Box>
        </ToolbarPulseButton>
        <Box sx={cardDividerSx} />
        <ToolbarPulseButton
          ariaLabel="Previous time span"
          tooltip="Previous time span"
          pulseVariant="slide-left"
          onClick={onShiftPrevious}
        >
          <CaretDoubleLeft size={12} weight="bold" />
        </ToolbarPulseButton>
        <Box sx={cardDividerSx} />
        <ToolbarPulseButton
          ariaLabel="Next time span"
          tooltip="Next time span"
          pulseVariant="slide-right"
          onClick={onShiftNext}
        >
          <CaretDoubleRight size={12} weight="bold" />
        </ToolbarPulseButton>
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
          aria-label={editingActive ? 'Lock chart' : 'Edit chart'}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            height: 34,
            px: '14px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
            letterSpacing: '-0.01em',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            transition:
              'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.12s ease',
            '&:active': { transform: 'scale(0.96)' },
            '@container gantt-toolbar (max-width: 720px)': {
              px: 0,
              gap: 0,
              width: 34,
            },
            ...(editingActive
              ? {
                  bgcolor: 'var(--accent-primary, #2563eb)',
                  color: 'var(--accent-contrast, #fff)',
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
          <Box
            component="span"
            sx={{
              '@container gantt-toolbar (max-width: 720px)': {
                display: 'none',
              },
            }}
          >
            {editingActive ? 'Editing' : 'Edit'}
          </Box>
        </Box>
      )}

      {/* ── Link tasks toggle (only active in edit mode) ───────────────── */}
      {onToggleLinkMode && editingActive && (
        <Tooltip
          title={
            linkMode
              ? 'Linking on — click tasks in order to chain them. Tip: Shift-click works any time, even with this off.'
              : 'Link tasks — click two tasks in order to connect them. Tip: Shift-click any task to link without this button.'
          }
          placement="bottom"
          enterDelay={400}
          arrow
        >
          <Box
            component="button"
            type="button"
            onClick={onToggleLinkMode}
            aria-label={linkMode ? 'Exit link mode' : 'Link tasks'}
            aria-pressed={linkMode}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              height: 34,
              px: '14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
              letterSpacing: '-0.01em',
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              animation: 'gantt-tool-pop-in 0.24s cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
              transition:
                'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.12s ease',
              '&:active': { transform: 'scale(0.96)' },
              '@container gantt-toolbar (max-width: 720px)': { px: 0, gap: 0, width: 34 },
              ...(linkMode
                ? {
                    bgcolor: 'var(--accent-primary, #2563eb)',
                    color: 'var(--accent-contrast, #fff)',
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
            <LinkSimple size={13} weight="bold" />
            <Box
              component="span"
              sx={{ '@container gantt-toolbar (max-width: 720px)': { display: 'none' } }}
            >
              {linkMode ? 'Linking' : 'Link'}
            </Box>
          </Box>
        </Tooltip>
      )}

      {/* ── Add Task (only active in edit mode) ────────────────────────── */}
      {onAddTask && editingActive && (
        <Button
          variant="contained"
          size="small"
          disableElevation
          startIcon={<Plus size={12} />}
          onClick={onAddTask}
          aria-label="Add task"
          sx={{
            px: '14px',
            py: '6px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
            textTransform: 'none',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-primary, #2563eb)',
            color: 'var(--accent-contrast, #fff)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            animation: 'gantt-tool-pop-in 0.26s cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
            '&:hover': {
              backgroundColor: 'var(--accent-primary, #2563eb)',
              filter: 'brightness(0.9)',
            },
            '@container gantt-toolbar (max-width: 720px)': {
              minWidth: 0,
              width: 34,
              height: 34,
              px: 0,
              '& .MuiButton-startIcon': { mr: 0, ml: 0 },
            },
          }}
        >
          <Box
            component="span"
            sx={{
              '@container gantt-toolbar (max-width: 720px)': {
                display: 'none',
              },
            }}
          >
            Add Task
          </Box>
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
            @keyframes gantt-segment-pulse {
              0%   { opacity: 0.55; transform: scale(1); }
              100% { opacity: 0;    transform: scale(1.22); }
            }
            @keyframes gantt-pulse-scale-out {
              0%   { transform: scale(1); }
              40%  { transform: scale(1.35); }
              100% { transform: scale(1); }
            }
            @keyframes gantt-pulse-scale-in {
              0%   { transform: scale(1); }
              40%  { transform: scale(0.65); }
              100% { transform: scale(1); }
            }
            @keyframes gantt-pulse-wobble {
              0%   { transform: scale(1, 1); }
              30%  { transform: scale(1.12, 0.92); }
              60%  { transform: scale(0.96, 1.06); }
              100% { transform: scale(1, 1); }
            }
            @keyframes gantt-pulse-slide-left {
              0%   { transform: translateX(0); }
              40%  { transform: translateX(-4px); }
              100% { transform: translateX(0); }
            }
            @keyframes gantt-pulse-slide-right {
              0%   { transform: translateX(0); }
              40%  { transform: translateX(4px); }
              100% { transform: translateX(0); }
            }
            @media (prefers-reduced-motion: reduce) {
              @keyframes gantt-tool-pop-in       { from, to { opacity: 1; transform: none; } }
              @keyframes gantt-icon-swap         { from, to { opacity: 1; transform: none; } }
              @keyframes gantt-segment-pulse     { from, to { opacity: 0; transform: none; } }
              @keyframes gantt-pulse-scale-out   { from, to { transform: none; } }
              @keyframes gantt-pulse-scale-in    { from, to { transform: none; } }
              @keyframes gantt-pulse-wobble      { from, to { transform: none; } }
              @keyframes gantt-pulse-slide-left  { from, to { transform: none; } }
              @keyframes gantt-pulse-slide-right { from, to { transform: none; } }
            }
          `,
        }}
      />
    </Stack>
  );
}
