'use client';

import { useId } from 'react';
import type { FC, ReactNode } from 'react';

export type GanttContentHeaderProps = {
  renderHeaderItem: (index: number) => ReactNode;
  title: string;
  columns: number;
};

export const GanttContentHeader: FC<GanttContentHeaderProps> = ({
  title,
  columns,
  renderHeaderItem,
}) => {
  const id = useId();

  return (
    <div
      className="sticky top-0 z-20 grid w-full shrink-0 bg-white dark:bg-[var(--bg-card)] transition-colors duration-300"
      style={{ height: 'var(--gantt-header-height)' }}
    >
      <div>
        <div
          className="sticky inline-flex whitespace-nowrap px-3 py-2 text-gray-600 dark:text-[var(--text-secondary)] text-xs"
          style={{
            left: 'var(--gantt-sidebar-width)',
          }}
        >
          <p>{title}</p>
        </div>
      </div>
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={`${id}-${index}`}
            className="shrink-0 border-gray-200 dark:border-[var(--border-color)] border-b py-1 text-center text-xs text-gray-800 dark:text-[var(--text-primary)]"
          >
            {renderHeaderItem(index)}
          </div>
        ))}
      </div>
    </div>
  );
};
