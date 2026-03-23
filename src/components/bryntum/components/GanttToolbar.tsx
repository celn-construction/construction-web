'use client';

import { useState } from 'react';
import {
  Box,
  Stack,
  IconButton,
  Switch,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Button } from '@/components/ui/button';
import {
  CaretDoubleLeft,
  CaretDoubleRight,
  DownloadSimple,
  Columns,
  DotsThreeVertical,
  Plus,
  CheckCircle,
} from '@phosphor-icons/react';

// ─── Constants ────────────────────────────────────────────────────────────────
const VIEW_PRESETS = [
  { label: 'Day',   value: 'hourAndDay' },
  { label: 'Week',  value: 'weekAndDayLetter' },
  { label: 'Month', value: 'weekAndMonth' },
  { label: 'Year',  value: 'monthAndYear' },
] as const;

const ICON_SIZE = 14;

// ─── MUI sx overrides ─────────────────────────────────────────────────────────

/** Small outlined toolbar button (zoom –/+/Fit, nav) */
const toolBtnSx = {
  minWidth: 0,
  px: '10px',
  py: '4px',
  fontSize: '12px',
  fontWeight: 500,
  fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  textTransform: 'none',
  color: 'var(--text-secondary)',
  borderColor: 'var(--border-color)',
  borderRadius: '6px',
  lineHeight: 1.5,
  '&:hover': {
    borderColor: 'var(--border-color)',
    backgroundColor: 'action.hover',
  },
} as const;

/** Small icon-only toolbar button (nav arrows, export, more) */
const iconBtnSx = {
  width: 32,
  height: 32,
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-secondary)',
  '&:hover': {
    backgroundColor: 'action.hover',
  },
} as const;

/** Auto-save switch track/thumb overrides */
const switchSx = {
  width: 36,
  height: 20,
  p: 0,
  '& .MuiSwitch-switchBase': {
    p: '2px',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: 'var(--accent-primary, #2563eb)',
        opacity: 1,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: 16,
    height: 16,
    boxShadow: 'none',
  },
  '& .MuiSwitch-track': {
    borderRadius: '999px',
    backgroundColor: 'var(--border-color)',
    opacity: 1,
  },
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
  onSave?: () => void;
  isSaving?: boolean;
  hasPendingChanges?: boolean;
  justSaved?: boolean;
  autoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
  onExport?: () => void;
  onColumnsClick?: () => void;
  onMoreClick?: () => void;
  presenceSlot?: React.ReactNode;
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
  onSave,
  isSaving,
  hasPendingChanges,
  justSaved,
  autoSaveEnabled = false,
  onToggleAutoSave,
  onExport,
  onColumnsClick,
  onMoreClick,
  presenceSlot,
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

  const showSavedCheck = autoSaveEnabled && !isSaving && !hasPendingChanges && justSaved;

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

      {/* ── Zoom Controls ──────────────────────────────────────────────── */}
      <Stack direction="row" spacing={0.25} alignItems="center">
        <Button variant="outlined" size="small" sx={toolBtnSx} onClick={onZoomOut} title="Zoom out">
          –
        </Button>
        <Button variant="outlined" size="small" sx={toolBtnSx} onClick={onZoomIn} title="Zoom in">
          +
        </Button>
        <Button variant="outlined" size="small" sx={toolBtnSx} onClick={onZoomToFit} title="Fit all tasks">
          Fit
        </Button>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 'auto', height: 18, alignSelf: 'center' }} />

        <IconButton size="small" sx={iconBtnSx} onClick={onShiftPrevious} title="Previous time span">
          <CaretDoubleLeft size={ICON_SIZE} />
        </IconButton>
        <IconButton size="small" sx={iconBtnSx} onClick={onShiftNext} title="Next time span">
          <CaretDoubleRight size={ICON_SIZE} />
        </IconButton>

      </Stack>

      {/* ── Spacer ─────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1 }} />

      {/* ── Presence Indicators ──────────────────────────────────────── */}
      {presenceSlot}

      {/* ── Auto-save ──────────────────────────────────────────────────── */}
      {onToggleAutoSave && (
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Switch
            checked={autoSaveEnabled}
            onChange={() => onToggleAutoSave()}
            size="small"
            sx={switchSx}
            title={autoSaveEnabled ? 'Auto-save on — click to disable' : 'Auto-save off — click to enable'}
          />
          <Typography
            sx={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Auto-save
          </Typography>
          {showSavedCheck && (
            <CheckCircle
              size={ICON_SIZE}
              color="var(--success, #16a34a)"
            />
          )}
          {isSaving && <CircularProgress size={14} sx={{ color: 'var(--text-secondary)' }} />}
        </Stack>
      )}

      {/* ── Manual Save (only when auto-save is off) ───────────────────── */}
      {onSave && !autoSaveEnabled && (
        <Button
          variant="outlined"
          size="small"
          disabled={!hasPendingChanges || justSaved}
          onClick={hasPendingChanges && !isSaving && !justSaved ? onSave : undefined}
          title={
            isSaving ? 'Saving…' :
            justSaved ? 'Changes saved' :
            hasPendingChanges ? 'Save changes' :
            'No unsaved changes'
          }
          loading={isSaving}
          loadingPosition="start"
          sx={{
            ...toolBtnSx,
            borderRadius: '8px',
            ...(hasPendingChanges && !isSaving && !justSaved
              ? { color: 'var(--accent-primary, #2563eb)', borderColor: 'var(--accent-primary, #2563eb)' }
              : {}),
          }}
        >
          {isSaving ? 'Saving…' : hasPendingChanges ? 'Save' : 'Saved'}
        </Button>
      )}

      <Divider orientation="vertical" flexItem sx={{ my: 'auto', height: 18, alignSelf: 'center' }} />

      {/* ── Right Controls ─────────────────────────────────────────────── */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        {onExport && (
          <IconButton size="small" sx={iconBtnSx} onClick={onExport} title="Export">
            <DownloadSimple size={ICON_SIZE} />
          </IconButton>
        )}
        {onColumnsClick && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Columns size={ICON_SIZE} />}
            onClick={onColumnsClick}
            title="Configure columns"
            sx={{ ...toolBtnSx, borderRadius: '8px', gap: '6px' }}
          >
            Columns
          </Button>
        )}
        {onMoreClick && (
          <IconButton size="small" sx={iconBtnSx} onClick={onMoreClick} title="More options">
            <DotsThreeVertical size={ICON_SIZE} />
          </IconButton>
        )}
      </Stack>

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
