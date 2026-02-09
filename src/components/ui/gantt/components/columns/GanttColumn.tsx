'use client';

import { cn } from '@/lib/utils';
import { useMouse, useWindowScroll } from '@uidotdev/usehooks';
import { useContext, useState } from 'react';
import type { FC } from 'react';
import { GanttContext, useGanttDragging, useGanttDropTarget } from '../../context';
import { GanttAddFeatureHelper } from './GanttAddFeatureHelper';

export type GanttColumnProps = {
  index: number;
  isColumnSecondary?: (item: number) => boolean;
};

export const GanttColumn: FC<GanttColumnProps> = ({
  index,
  isColumnSecondary,
}) => {
  const gantt = useContext(GanttContext);
  const [dragging] = useGanttDragging();
  const [dropTarget] = useGanttDropTarget();
  const [mousePosition, mouseRef] = useMouse<HTMLDivElement>();
  const [hovering, setHovering] = useState(false);
  const [windowScroll] = useWindowScroll();

  const handleMouseEnter = () => setHovering(true);
  const handleMouseLeave = () => setHovering(false);

  // Calculate raw position
  const rawTop = mousePosition.y -
    (mouseRef.current?.getBoundingClientRect().y ?? 0) -
    (windowScroll.y ?? 0);

  // Snap to row grid - calculate which row the mouse is in and snap to that row's top
  const rowIndex = Math.floor(rawTop / gantt.rowHeight);
  const snappedTop = rowIndex * gantt.rowHeight;

  // Check both dragging state AND dropTarget - dropTarget indicates active drag
  const isAnyDragging = dragging || dropTarget !== null;

  return (
    // biome-ignore lint/nursery/noStaticElementInteractions: <explanation>
    <div
      className={cn(
        'group relative h-full overflow-hidden',
        isColumnSecondary?.(index) ? 'bg-secondary' : ''
      )}
      ref={mouseRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!isAnyDragging && hovering && gantt.onAddItem ? (
        <GanttAddFeatureHelper top={snappedTop} rowIndex={rowIndex} />
      ) : null}
    </div>
  );
};
