import { TaskModel } from '@bryntum/gantt';
import type { GanttConfig } from '../types';

// Extend TaskModel to include the `version` field used for optimistic locking.
// Without this, Bryntum silently drops the version from loaded data and
// record.get('version') returns undefined.
class VersionedTaskModel extends TaskModel {
  static override get fields() {
    return [
      { name: 'version', type: 'int', defaultValue: 1 },
    ];
  }
}

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

// Debounce timer so a double-click (edit) cancels the single-click scroll
let pendingScrollTimer: ReturnType<typeof setTimeout> | undefined;

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

    // Infinite scroll extends the time axis automatically as the user
    // scrolls near the edges.  bufferCoef controls the invisible buffer
    // size (5 = 5× viewport width on each side).
    infiniteScroll: true,
    bufferCoef: 5,

    // Performance optimizations
    autoHeight: false,
    rowHeight: 45, // Consistent row height for better performance
    animateTreeNodeToggle: false, // Disable animations for faster rendering
    toggleParentTasksOnClick: false, // Prevent clicking a parent task bar from collapsing its children

    project: {
      autoLoad: true,
      autoSync: false,
      taskModelClass: VersionedTaskModel,

      // delayCalculation removed — it prevents the scheduling engine from
      // initializing properly when React double-mounts the widget (the first
      // commitAsync runs on a destroyed instance, leaving the visible instance
      // with an uncalculated engine and no task bar rendering).

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
      // Single-clicking the name cell scrolls the timeline to the task's bar (see cellClick listener).
      // Double-clicking starts inline name editing (Bryntum native behavior).
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
      {
        type: 'widget',
        width: 40,
        resizable: false,
        sortable: false,
        filterable: false,
        text: '',
        widgets: [
          {
            type: 'button',
            menuIcon: false,
            icon: 'b-icon b-icon-menu-vertical',
            cls: 'gantt-row-actions-btn',
            menu: {
              items: {
                addSubtask: {
                  text: 'Add Subtask',
                  icon: 'b-icon b-icon-add',
                  weight: 100,
                  onItem: 'up.onRowActionClick',
                },
                indent: {
                  text: 'Indent',
                  icon: 'b-icon b-icon-indent',
                  weight: 200,
                  onItem: 'up.onRowActionClick',
                },
                outdent: {
                  text: 'Outdent',
                  icon: 'b-icon b-icon-outdent',
                  weight: 300,
                  onItem: 'up.onRowActionClick',
                },
                unlinkTask: {
                  text: 'Unlink',
                  icon: 'b-icon b-icon-unlink',
                  weight: 500,
                  onItem: 'up.onRowActionClick',
                },
                deleteTask: {
                  text: 'Delete',
                  icon: 'b-icon b-icon-trash',
                  cls: 'gantt-action-danger',
                  weight: 600,
                  onItem: 'up.onRowActionClick',
                },
              },
            },
          },
        ],
      },
    ],
    features: {
      columnLines: true,
      stripe: true,
      cellTooltip: {
        tooltipRenderer: ({ record, column }) => formatTooltipText(record, column.field),
      },
    },
    emptyText: 'No tasks yet — click "+ Add Task" above or double-click here to get started',
    viewPreset: 'weekAndDayLetter',
    // Initial window just needs to fill the viewport on load.
    // infiniteScroll extends the range automatically as the user scrolls.
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 6, 1),
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
        // Cancel any pending single-click scroll so editing starts cleanly
        clearTimeout(pendingScrollTimer);
        if (column.type === 'duration' && record.isParent && !record.manuallyScheduled) {
          record.set('manuallyScheduled', true);
        }
      },
      // Single-click on the task name cell → scroll the timeline bar into view.
      // Guards against unscheduled tasks (no startDate) to avoid a Bryntum crash.
      cellClick({ record, column, grid }: {
        record: { id: string | number; startDate?: Date | null };
        column: { type?: string } | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        grid: any;
      }) {
        if (column?.type !== 'name') return;
        if (!record.startDate) return;
        // Debounce: wait 200ms so a double-click (edit) can cancel the scroll
        clearTimeout(pendingScrollTimer);
        pendingScrollTimer = setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          grid.scrollTaskIntoView(record, {
            block: 'center',
            animate: { duration: 300 },
            highlight: true,
          });
        }, 200);
      },
    },
  };
}
