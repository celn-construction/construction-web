'use client';

import { format } from 'date-fns';
import { useContext } from 'react';
import type { FC } from 'react';
import { GanttContext } from '../../context';
import { GanttContentHeader } from './GanttContentHeader';
import { GanttColumns } from '../columns';

export const QuarterlyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) =>
    year.quarters.map((quarter, quarterIndex) => (
      <div
        className="relative flex flex-col"
        key={`${year.year}-${quarterIndex}`}
      >
        <GanttContentHeader
          title={`Q${quarterIndex + 1} ${year.year}`}
          columns={quarter.months.length}
          renderHeaderItem={(item: number) => (
            <p>
              {format(new Date(year.year, quarterIndex * 3 + item, 1), 'MMM')}
            </p>
          )}
        />
        <GanttColumns columns={quarter.months.length} />
      </div>
    ))
  );
};
