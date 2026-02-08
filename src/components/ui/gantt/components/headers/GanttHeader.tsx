'use client';

import { cn } from '@/lib/utils';
import { useContext } from 'react';
import type { FC } from 'react';
import { GanttContext } from '../../context';
import type { Range } from '../../types';
import { DailyHeader } from './DailyHeader';
import { MonthlyHeader, type GanttMonthlyHeaderProps } from './MonthlyHeader';
import { QuarterlyHeader } from './QuarterlyHeader';

const headers: Record<Range, FC<GanttMonthlyHeaderProps>> = {
  daily: DailyHeader as FC<GanttMonthlyHeaderProps>,
  monthly: MonthlyHeader,
  quarterly: QuarterlyHeader as FC<GanttMonthlyHeaderProps>,
};

export type GanttHeaderProps = {
  className?: string;
  onAddToMonth?: (startAt: Date, endAt: Date) => void;
};

export const GanttHeader: FC<GanttHeaderProps> = ({ className, onAddToMonth }) => {
  const gantt = useContext(GanttContext);
  const Header = headers[gantt.range];

  return (
    <div
      className={cn(
        '-space-x-px flex h-full w-max divide-x divide-border/50',
        className
      )}
    >
      <Header onAddToMonth={onAddToMonth} />
    </div>
  );
};
