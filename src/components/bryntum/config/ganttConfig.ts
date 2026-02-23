import type { GanttConfig } from '../types';
import { SCROLL_TO_COLUMN_ID } from '../constants';

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

interface LoadingCallbacks {
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onLoadError?: (error: string) => void;
}

export function createGanttConfig(
  projectId?: string,
  loadingCallbacks?: LoadingCallbacks
): GanttConfig {
  return {
    detectCSSCompatibilityIssues: false,

    // Performance optimizations
    autoHeight: false,
    rowHeight: 45, // Consistent row height for better performance
    animateTreeNodeToggle: false, // Disable animations for faster rendering
    toggleParentTasksOnClick: false, // Prevent clicking a parent task bar from collapsing its children

    project: {
      autoLoad: true,
      autoSync: false,

      // Enable delay calculation for better initial load performance
      delayCalculation: true,

      transport: projectId
        ? {
            load: {
              url: `/api/gantt/load?projectId=${projectId}`,
              fetchOptions: { credentials: 'include' },
            },
            sync: {
              url: `/api/gantt/sync?projectId=${projectId}`,
              fetchOptions: { credentials: 'include' },
            },
          }
        : {
            load: {
              url: '/data/bryntum-sample.json',
              fetchOptions: { credentials: 'include' },
            },
          },

      listeners: {
        beforeLoad: () => {
          loadingCallbacks?.onLoadStart?.();
        },
        load: () => {
          loadingCallbacks?.onLoadComplete?.();
        },
        loadFail: ({ response }: { response: { message?: string } }) => {
          loadingCallbacks?.onLoadError?.(
            response?.message ?? 'Failed to load Gantt data'
          );
        },
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // Action column: chevron icon to scroll timeline to the task's bar
      {
        type: 'column',
        id: SCROLL_TO_COLUMN_ID,
        text: '',
        width: 40,
        resizable: false,
        sortable: false,
        filterable: false,
        htmlEncode: false,
        editor: false,
        cellCls: 'b-scroll-to-cell',
        renderer({ record }: { record: { startDate?: Date | null } }) {
          const isScheduled = record.startDate != null;
          if (!isScheduled) return '';
          // Phosphor NavigationArrow (fill weight, viewBox 0 0 256 256)
          return `<div class="scroll-to-timeline-btn" title="Scroll to timeline" style="display:flex;align-items:center;justify-content:center;height:100%;cursor:pointer;opacity:0.4;transition:opacity 0.15s" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.4'"><svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M248,121.58a15.76,15.76,0,0,1-11.29,15l-.2.06-78,21.84-21.84,78-.06.2a15.77,15.77,0,0,1-15,11.29h-.3a15.77,15.77,0,0,1-15.07-10.67L41,61.41a1,1,0,0,1-.05-.16A16,16,0,0,1,61.25,40.9l.16.05,175.92,65.26A15.78,15.78,0,0,1,248,121.58Z"/></svg></div>`;
        },
      } as any,
    ],
    features: {
      cellTooltip: {
        tooltipRenderer: ({ record, column }) => formatTooltipText(record, column.field),
      },
    },
    emptyText: 'No tasks yet — click "+ Add Task" above or double-click here to get started',
    viewPreset: 'weekAndDayLetter',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 24, 1),
    barMargin: 10,
    listeners: {
      // Bryntum blocks the duration cell editor for parent tasks before
      // beforeCellEditStart ever fires (checked internally in DurationColumn).
      // cellDblClick fires first, so we can set manuallyScheduled: true here —
      // telling the scheduling engine to stop auto-deriving duration from children
      // — before Bryntum decides whether to open the editor.
      cellDblClick({ record, column }: {
        record: { isParent: boolean; manuallyScheduled: boolean; set: (field: string, value: unknown) => void };
        column: { type: string };
      }) {
        if (column.type === 'duration' && record.isParent && !record.manuallyScheduled) {
          record.set('manuallyScheduled', true);
        }
      },
      cellClick({ record, column, grid }: {
        record: { id: string | number; startDate?: Date | null };
        column: { id?: string } | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        grid: any;
      }) {
        if (!column || column.id !== SCROLL_TO_COLUMN_ID) return;
        if (!record.startDate) return;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        grid.scrollTaskIntoView(record, {
          block: 'center',
          animate: { duration: 300 },
          highlight: true,
        });
      },
    },
  };
}
