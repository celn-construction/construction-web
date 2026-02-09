'use client';

import { cn } from '@/lib/utils';
import { memo } from 'react';
import type { FC, KeyboardEventHandler, MouseEventHandler } from 'react';
import type { GanttFeature } from '../../types';

export type GanttSidebarItemProps = {
  feature: GanttFeature;
  onSelectItem?: (id: string) => void;
  className?: string;
  isFullscreen?: boolean;
};

export const GanttSidebarItem: FC<GanttSidebarItemProps> = memo(({
  feature,
  onSelectItem,
  className,
  isFullscreen = false,
}) => {
  const handleClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target === event.currentTarget) {
      onSelectItem?.(feature.id);
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Enter') {
      onSelectItem?.(feature.id);
    }
  };

  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: <explanation>
      role="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={cn(
        'relative flex items-center gap-2.5 p-2.5 text-xs cursor-pointer',
        'transition-all duration-150 ease-out',
        'hover:bg-[var(--gantt-hover-bg,rgba(243,244,246,0.8))] dark:hover:bg-gray-700/50',
        'active:scale-[0.98]',
        isFullscreen && 'flex-1',
        className
      )}
      style={isFullscreen ? undefined : {
        height: 'var(--gantt-row-height)',
      }}
    >
      <div
        className="pointer-events-none h-2 w-2 shrink-0 rounded-full transition-transform duration-150 hover:scale-[1.3]"
        style={{
          backgroundColor: feature.status.color,
        }}
      />
      <p className="pointer-events-none flex-1 truncate text-left font-medium text-gray-800 dark:text-[var(--text-primary)]">
        {feature.name}
      </p>
    </div>
  );
});
GanttSidebarItem.displayName = 'GanttSidebarItem';
