'use client';

import dynamic from 'next/dynamic';

const BryntumGanttWrapper = dynamic(
  () => import('@/components/bryntum/BryntumGanttWrapper'),
  { ssr: false }
);

export default function BryntumPage() {
  return (
    <div className="h-full w-full">
      <BryntumGanttWrapper />
    </div>
  );
}
