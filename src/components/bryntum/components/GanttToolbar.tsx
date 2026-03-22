'use client';

import { useState } from 'react';
import {
  Box,
  Stack,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import {
  ChevronsLeft,
  ChevronsRight,
  Download,
  Columns3,
  MoreVertical,
  Plus,
  CheckCircle,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const VIEW_PRESETS = [
  { label: 'Day',   value: 'hourAndDay' },
  { label: 'Week',  value: 'weekAndDayLetter' },
  { label: 'Month', value: 'weekAndMonth' },
  { label: 'Year',  value: 'monthAndYear' },
] as const;

const ICON_SIZE = 14;

// ─── MUI sx overrides ─────────────────────────────────────────────────────────
const toggleGroupSx = {
  '& .MuiToggleButtonGroup-grouped': {
    border: 0,
    borderRadius: '8px !important',
    px: '14px',
    py: '5px',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
    textTransform: 'none',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    '&:hover': {
      backgroundColor: 'action.hover',
    },
    '&.Mui-selected': {
      backgroundColor: 'var(--accent-primary, #2563eb)',
      color: '#ffffff',
      fontWeight: 600,
      '&:hover': {
        backgroundColor: 'var(--accent-primary, #2563eb)',
        filter: 'brightness(0.92)',
      },
    },
  },
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  overflow: 'hidden',
  height: '32px',
} as const;

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
}: GanttToolbarProps) {
  const [activePreset, setActivePreset] = useState('weekAndDayLetter');

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset);
    onPresetChange?.(preset);
  };

  const showSavedCheck = autoSaveEnabled && !isSaving && !hasPendingChanges && justSaved;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ px: 2, py: 1, borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}
    >
      {/* ── View Preset Picker ──────────────────────────────────────────── */}
      <ToggleButtonGroup
        value={activePreset}
        exclusive
        onChange={(_e, value: string | null) => {
          if (value) handlePresetClick(value);
        }}
        size="small"
        sx={toggleGroupSx}
      >
        {VIEW_PRESETS.map((preset) => (
          <ToggleButton key={preset.value} value={preset.value} disableRipple>
            {preset.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

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
          <ChevronsLeft style={{ width: ICON_SIZE, height: ICON_SIZE }} />
        </IconButton>
        <IconButton size="small" sx={iconBtnSx} onClick={onShiftNext} title="Next time span">
          <ChevronsRight style={{ width: ICON_SIZE, height: ICON_SIZE }} />
        </IconButton>

      </Stack>

      {/* ── Spacer ─────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1 }} />

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
              style={{ width: ICON_SIZE, height: ICON_SIZE, color: 'var(--success, #16a34a)' }}
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
            <Download style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </IconButton>
        )}
        {onColumnsClick && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Columns3 style={{ width: ICON_SIZE, height: ICON_SIZE }} />}
            onClick={onColumnsClick}
            title="Configure columns"
            sx={{ ...toolBtnSx, borderRadius: '8px', gap: '6px' }}
          >
            Columns
          </Button>
        )}
        {onMoreClick && (
          <IconButton size="small" sx={iconBtnSx} onClick={onMoreClick} title="More options">
            <MoreVertical style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </IconButton>
        )}
      </Stack>

      {/* ── Add Task ───────────────────────────────────────────────────── */}
      {onAddTask && (
        <Button
          variant="contained"
          size="small"
          disableElevation
          startIcon={<Plus style={{ width: 12, height: 12 }} />}
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
