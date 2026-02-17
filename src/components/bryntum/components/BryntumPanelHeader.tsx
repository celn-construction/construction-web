import { useState, type CSSProperties } from 'react';

const HEADER_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderBottom: '1px solid var(--border-color)',
};

const TITLE_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 16px',
};

const TOOLBAR_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '0 16px 10px',
};

const ICON_STYLE: CSSProperties = {
  width: '16px',
  height: '16px',
  color: 'var(--text-secondary)',
};

const TITLE_STYLE: CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  flex: 1,
};

const ADD_BUTTON_STYLE: CSSProperties = {
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
  title: string;
  onAddTask?: () => void;
  onPresetChange?: (preset: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomToFit?: () => void;
  onShiftPrevious?: () => void;
  onShiftNext?: () => void;
};

export function BryntumPanelHeader({
  title,
  onAddTask,
  onPresetChange,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onShiftPrevious,
  onShiftNext,
}: BryntumPanelHeaderProps) {
  const [activePreset, setActivePreset] = useState('weekAndDayLetter');

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset);
    onPresetChange?.(preset);
  };

  return (
    <div style={HEADER_STYLE}>
      <div style={TITLE_ROW_STYLE}>
        <svg style={ICON_STYLE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
        <h2 style={TITLE_STYLE}>{title}</h2>
        {onAddTask && (
          <button style={ADD_BUTTON_STYLE} onClick={onAddTask}>
            + Add Task
          </button>
        )}
      </div>

      <div style={TOOLBAR_ROW_STYLE}>
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
      </div>
    </div>
  );
}
