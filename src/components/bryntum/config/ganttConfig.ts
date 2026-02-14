import type { GanttConfig, TaskClickHandler } from '../types';

function formatTooltipText(record: Record<string, unknown>, field?: string): string {
  if (!field) {
    return '';
  }

  const value = record[field];
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export function createGanttConfig(
  onTaskClick: TaskClickHandler,
  projectId?: string
): GanttConfig {
  return {
    height: '100%',
    detectCSSCompatibilityIssues: false,
    project: {
      autoLoad: true,
      autoSync: !!projectId,
      transport: projectId
        ? {
            load: {
              url: `/api/gantt/load?projectId=${projectId}`,
            },
            sync: {
              url: `/api/gantt/sync?projectId=${projectId}`,
            },
          }
        : {
            load: {
              url: '/data/bryntum-sample.json',
            },
          },
    },
    columns: [
      {
        type: 'name',
        field: 'name',
        flex: 1,
        minWidth: 300,
        resizable: true,
      },
      {
        type: 'startdate',
        field: 'startDate',
        text: 'Start',
        width: 120,
        resizable: true,
      },
      {
        type: 'duration',
        text: 'Duration',
        width: 100,
        resizable: true,
      },
    ],
    features: {
      cellTooltip: {
        tooltipRenderer: ({ record, column }) => formatTooltipText(record, column.field),
      },
    },
    viewPreset: 'weekAndDayLetter',
    barMargin: 10,
    listeners: {
      taskClick: onTaskClick,
    },
  };
}
