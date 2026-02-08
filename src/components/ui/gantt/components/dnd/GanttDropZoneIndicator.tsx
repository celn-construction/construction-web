'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useContext } from 'react';
import type { FC } from 'react';
import { GanttContext, useGanttDropTarget } from '../../context';

export type GanttDropZoneIndicatorProps = {
  className?: string;
};

export const GanttDropZoneIndicator: FC<GanttDropZoneIndicatorProps> = ({
  className,
}) => {
  const [dropTarget] = useGanttDropTarget();
  const gantt = useContext(GanttContext);

  const isValid = dropTarget?.isValid !== false; // default to valid if not specified

  return (
    <AnimatePresence>
      {dropTarget && (
        <motion.div
          data-drop-indicator
          data-target-row={dropTarget.rowIndex}
          data-valid={isValid}
          className={cn(
            'pointer-events-none absolute z-40 border-2 border-dashed rounded-md',
            isValid
              ? 'bg-blue-100/80 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500'
              : 'bg-red-100/80 dark:bg-red-900/40 border-red-400 dark:border-red-500',
            className
          )}
          style={{
            height: gantt.rowHeight - 4,
            top: dropTarget.rowIndex * gantt.rowHeight + gantt.headerHeight + 2,
            left: Math.round(dropTarget.offset),
            width: Math.round(dropTarget.width),
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: isValid
              ? [
                  '0 0 0 0 rgba(59, 130, 246, 0)',
                  '0 0 0 3px rgba(59, 130, 246, 0.2)',
                  '0 0 0 0 rgba(59, 130, 246, 0)'
                ]
              : [
                  '0 0 0 0 rgba(239, 68, 68, 0)',
                  '0 0 0 3px rgba(239, 68, 68, 0.2)',
                  '0 0 0 0 rgba(239, 68, 68, 0)'
                ]
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.15,
            boxShadow: { duration: 1, repeat: Infinity }
          }}
        />
      )}
    </AnimatePresence>
  );
};
