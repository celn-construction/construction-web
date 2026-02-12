'use client';

import dynamic from 'next/dynamic';

const BryntumGanttWrapper = dynamic(
  () => import('@/components/bryntum/BryntumGanttWrapper'),
  { ssr: false }
);

export default function BryntumPage() {
  return (
    <div style={{ height: '100%', width: '100%', padding: '24px' }}>
      <div style={{ height: '100%', width: '100%' }}>
        <BryntumGanttWrapper />
      </div>
    </div>
  );
}
