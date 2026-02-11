'use client';

import { BryntumGantt } from '@bryntum/gantt-react';
import '@bryntum/gantt/gantt.css';
import '@bryntum/gantt/stockholm-light.css';

export default function BryntumGanttWrapper() {
  const ganttConfig = {
    project: {
      autoLoad: true,
      transport: {
        load: {
          url: '/data/bryntum-sample.json'
        }
      }
    },
    columns: [
      { type: 'name', field: 'name', text: 'Task', width: 250 },
      { type: 'startdate', field: 'startDate', text: 'Start' },
      { type: 'duration', field: 'duration', text: 'Duration' }
    ],
    viewPreset: 'weekAndDayLetter',
    barMargin: 10
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <BryntumGantt {...ganttConfig} />
    </div>
  );
}
