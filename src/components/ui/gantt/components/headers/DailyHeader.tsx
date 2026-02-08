'use client';

import { format, addDays } from 'date-fns';
import { useContext } from 'react';
import type { FC } from 'react';
import { GanttContext } from '../../context';
import { GanttContentHeader } from './GanttContentHeader';
import { GanttColumns } from '../columns';

export const DailyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) =>
    year.quarters
      .flatMap((quarter) => quarter.months)
      .map((month, index) => (
        <div className="relative flex flex-col" key={`${year.year}-${index}`}>
          <GanttContentHeader
            title={format(new Date(year.year, index, 1), 'MMMM yyyy')}
            columns={month.days}
            renderHeaderItem={(item: number) => (
              <div className="flex items-center justify-center gap-1">
                <p>
                  {format(addDays(new Date(year.year, index, 1), item), 'd')}
                </p>
                <p className="text-gray-500 dark:text-[var(--text-tertiary)]">
                  {format(
                    addDays(new Date(year.year, index, 1), item),
                    'EEEEE'
                  )}
                </p>
              </div>
            )}
          />
          <GanttColumns
            columns={month.days}
            isColumnSecondary={(item: number) =>
              [0, 6].includes(
                addDays(new Date(year.year, index, 1), item).getDay()
              )
            }
          />
        </div>
      ))
  );
};
