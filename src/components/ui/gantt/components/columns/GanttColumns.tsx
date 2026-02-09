'use client';

import { useId } from 'react';
import type { FC } from 'react';
import { GanttColumn } from './GanttColumn';

export type GanttColumnsProps = {
  columns: number;
  isColumnSecondary?: (item: number) => boolean;
};

export const GanttColumns: FC<GanttColumnsProps> = ({
  columns,
  isColumnSecondary,
}) => {
  const id = useId();

  return (
    <div
      className="divide grid h-full w-full divide-x divide-gray-200 dark:divide-[var(--border-color)]"
      style={{
        gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
      }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <GanttColumn
          key={`${id}-${index}`}
          index={index}
          isColumnSecondary={isColumnSecondary}
        />
      ))}
    </div>
  );
};
