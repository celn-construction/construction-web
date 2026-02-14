import type { CSSProperties } from 'react';

const HEADER_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 16px',
  borderBottom: '1px solid var(--border-color)',
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
};

type BryntumPanelHeaderProps = {
  title: string;
};

export function BryntumPanelHeader({ title }: BryntumPanelHeaderProps) {
  return (
    <div style={HEADER_STYLE}>
      <svg style={ICON_STYLE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
      <h2 style={TITLE_STYLE}>{title}</h2>
    </div>
  );
}
