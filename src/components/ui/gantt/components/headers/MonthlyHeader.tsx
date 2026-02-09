'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import { useContext, useState } from 'react';
import type { FC } from 'react';
import { GanttContext } from '../../context';
import { GanttContentHeader } from './GanttContentHeader';
import { GanttColumns } from '../columns';

export type GanttMonthlyHeaderProps = {
  onAddToMonth?: (startAt: Date, endAt: Date) => void;
};

export const MonthlyHeader: FC<GanttMonthlyHeaderProps> = ({ onAddToMonth }) => {
  const gantt = useContext(GanttContext);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  return gantt.timelineData.map((year) => (
    <div className="relative flex flex-col" key={year.year}>
      <GanttContentHeader
        title={`${year.year}`}
        columns={year.quarters.flatMap((quarter) => quarter.months).length}
        renderHeaderItem={(item: number) => {
          const monthDate = new Date(year.year, item, 1);
          const monthEnd = new Date(year.year, item + 1, 0); // Last day of month
          const isHovered = hoveredMonth === item;

          return (
            <div
              className="relative flex items-center justify-center gap-1 group"
              onMouseEnter={() => setHoveredMonth(item)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              <p>{format(monthDate, 'MMM')}</p>
              {onAddToMonth && (
                <motion.button
                  type="button"
                  className="absolute right-1 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToMonth(monthDate, monthEnd);
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    scale: isHovered ? 1 : 0.8,
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  title={`Add task to ${format(monthDate, 'MMMM yyyy')}`}
                >
                  <PlusIcon size={12} className="text-blue-600 dark:text-blue-400" />
                </motion.button>
              )}
            </div>
          );
        }}
      />
      <GanttColumns
        columns={year.quarters.flatMap((quarter) => quarter.months).length}
      />
    </div>
  ));
};
