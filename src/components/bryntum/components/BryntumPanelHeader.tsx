import { useState, type CSSProperties } from 'react';

const HEADER_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 16px',
  borderBottom: '1px solid var(--border-color)',
};

const ADD_TASK_BUTTON_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 14px',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--accent-primary, #2563eb)',
  backgroundColor: 'transparent',
  border: '1px solid var(--accent-primary, #2563eb)',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
};

const SAVE_BUTTON_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 12px',
  fontSize: '0.8rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  backgroundColor: 'transparent',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  cursor: 'pointer',
};

const BUTTON_GROUP_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  overflow: 'hidden',
};

const TOOLBAR_BUTTON_STYLE: CSSProperties = {
  padding: '4px 10px',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  backgroundColor: 'transparent',
  border: 'none',
  borderRight: '1px solid var(--border-color)',
  cursor: 'pointer',
  lineHeight: 1.4,
};

const TOOLBAR_BUTTON_LAST_STYLE: CSSProperties = {
  ...TOOLBAR_BUTTON_STYLE,
  borderRight: 'none',
};

const ACTIVE_BUTTON_STYLE: CSSProperties = {
  ...TOOLBAR_BUTTON_STYLE,
  backgroundColor: 'var(--border-color)',
  color: 'var(--text-primary)',
};

const SEPARATOR_STYLE: CSSProperties = {
  width: '1px',
  height: '20px',
  backgroundColor: 'var(--border-color)',
};

const VIEW_PRESETS = [
  { label: 'Day', value: 'hourAndDay' },
  { label: 'Week', value: 'weekAndDayLetter' },
  { label: 'Month', value: 'weekAndMonth' },
  { label: 'Year', value: 'monthAndYear' },
] as const;

type BryntumPanelHeaderProps = {
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
};

export function BryntumPanelHeader({
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
}: BryntumPanelHeaderProps) {
  const [activePreset, setActivePreset] = useState('weekAndDayLetter');

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset);
    onPresetChange?.(preset);
  };

  return (
    <div style={HEADER_STYLE}>
      <style>{`
        @keyframes gantt-save-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gantt-check-draw {
          from { stroke-dashoffset: 20; opacity: 0; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
        .gantt-add-task-btn:hover {
          background-color: var(--accent-primary, #2563eb) !important;
          color: #fff !important;
          box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
        }
        .gantt-add-task-btn:active {
          transform: scale(0.97);
        }
        .gantt-autosave-toggle:hover {
          opacity: 1 !important;
        }
      `}</style>

      {/* View preset selector */}
      <div style={BUTTON_GROUP_STYLE}>
        {VIEW_PRESETS.map((preset, i) => {
          const isActive = activePreset === preset.value;
          const isLast = i === VIEW_PRESETS.length - 1;
          const style = isActive
            ? { ...ACTIVE_BUTTON_STYLE, ...(isLast ? { borderRight: 'none' } : {}) }
            : isLast
              ? TOOLBAR_BUTTON_LAST_STYLE
              : TOOLBAR_BUTTON_STYLE;
          return (
            <button
              key={preset.value}
              style={style}
              onClick={() => handlePresetClick(preset.value)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div style={SEPARATOR_STYLE} />

      {/* Zoom controls */}
      <div style={BUTTON_GROUP_STYLE}>
        <button style={TOOLBAR_BUTTON_STYLE} onClick={onZoomOut} title="Zoom out">
          −
        </button>
        <button style={TOOLBAR_BUTTON_STYLE} onClick={onZoomIn} title="Zoom in">
          +
        </button>
        <button style={TOOLBAR_BUTTON_LAST_STYLE} onClick={onZoomToFit} title="Zoom to fit">
          Fit
        </button>
      </div>

      <div style={SEPARATOR_STYLE} />

      {/* Time navigation */}
      <div style={BUTTON_GROUP_STYLE}>
        <button style={TOOLBAR_BUTTON_STYLE} onClick={onShiftPrevious} title="Previous time span">
          ←
        </button>
        <button style={TOOLBAR_BUTTON_LAST_STYLE} onClick={onShiftNext} title="Next time span">
          →
        </button>
      </div>

      {/* Spacer pushes action buttons to the right */}
      <div style={{ flex: 1 }} />

      {/* Auto-save toggle */}
      {onToggleAutoSave && (
        <button
          className="gantt-autosave-toggle"
          onClick={onToggleAutoSave}
          title={autoSaveEnabled ? 'Auto-save is on — click to disable' : 'Auto-save is off — click to enable'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: autoSaveEnabled ? 'var(--success, #16a34a)' : 'var(--text-secondary)',
            backgroundColor: 'transparent',
            border: `1px solid ${autoSaveEnabled ? 'var(--success, #16a34a)' : 'var(--border-color)'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            opacity: autoSaveEnabled ? 1 : 0.55,
            transition: 'color 0.15s, border-color 0.15s, opacity 0.15s',
            userSelect: 'none',
          }}
        >
          {/* Toggle pill */}
          <span style={{
            display: 'inline-flex',
            width: '26px',
            height: '15px',
            borderRadius: '8px',
            backgroundColor: autoSaveEnabled ? 'var(--success, #16a34a)' : 'var(--border-color)',
            padding: '2px',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'background-color 0.2s',
          }}>
            <span style={{
              width: '11px',
              height: '11px',
              borderRadius: '50%',
              backgroundColor: 'white',
              transform: autoSaveEnabled ? 'translateX(11px)' : 'translateX(0)',
              transition: 'transform 0.2s',
              flexShrink: 0,
            }} />
          </span>
          Auto-save
        </button>
      )}

      {onAddTask && (
        <button
          className="gantt-add-task-btn"
          style={ADD_TASK_BUTTON_STYLE}
          onClick={onAddTask}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Task
        </button>
      )}

      {/* Only show manual save button when auto-save is off */}
      {onSave && !autoSaveEnabled && (
        <button
          style={{
            ...SAVE_BUTTON_STYLE,
            ...(isSaving || justSaved
              ? {
                  color: justSaved ? 'var(--success, #16a34a)' : 'var(--text-secondary)',
                  border: justSaved ? '1px solid var(--success, #16a34a)' : '1px solid var(--border-color)',
                  opacity: isSaving ? 0.7 : 1,
                  cursor: 'default',
                }
              : hasPendingChanges
                ? {
                    color: 'var(--accent-primary, #2563eb)',
                    border: '1px solid var(--accent-primary, #2563eb)',
                  }
                : {
                    opacity: 0.5,
                    cursor: 'default',
                  }),
          }}
          onClick={hasPendingChanges && !isSaving && !justSaved ? onSave : undefined}
          disabled={!hasPendingChanges || isSaving || justSaved}
          title={isSaving ? 'Saving…' : justSaved ? 'Changes saved' : hasPendingChanges ? 'Save changes' : 'No unsaved changes'}
        >
          {isSaving && (
            <span style={{
              display: 'inline-block',
              width: 11,
              height: 11,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'gantt-save-spin 0.65s linear infinite',
              flexShrink: 0,
            }} />
          )}
          {justSaved && (
            <svg
              width={11}
              height={11}
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M1.5 6.5 L4.5 9.5 L10.5 2.5"
                strokeDasharray="20"
                style={{ animation: 'gantt-check-draw 0.35s ease-out forwards' }}
              />
            </svg>
          )}
          {isSaving ? 'Saving…' : hasPendingChanges ? 'Save' : 'Saved'}
        </button>
      )}
    </div>
  );
}
