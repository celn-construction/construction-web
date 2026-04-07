import { TaskModel } from '@bryntum/gantt';
import type { DomClassList } from '@bryntum/gantt';
import type { GanttConfig, ColumnRendererData } from '../types';

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
    // Performance optimizations
    autoHeight: false,
    loadMask: null,
    syncMask: null,
    rowHeight: 45, // Consistent row height for better performance
    animateTreeNodeToggle: false, // Disable animations for faster rendering
    detectCSSCompatibilityIssues: false,

    project: {
      autoLoad: true,
      autoSync: false,
      writeAllFields: true,
      taskModelClass: VersionedTaskModel,

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
    columns: [
      {
        type: 'name',
        field: 'name',
        flex: 1,
        minWidth: 300,
        resizable: true,
        // Inject a three-dot actions button alongside the task name.
        // TreeColumn renderer return value replaces the cell content —
        // return a DomConfig object that includes both the name and the button.
        renderer({ value, record }: ColumnRendererData) {
          return {
            class: 'gantt-name-cell-inner',
            children: [
              { tag: 'span', class: 'gantt-name-text', text: String(value ?? '') },
              {
                tag: 'button',
                class: 'gantt-row-scroll-btn',
                type: 'button',
                dataset: { taskId: String(record.id) },
                html: '<i class="fa-solid fa-arrow-right-to-bracket"></i>',
              },
              {
                tag: 'button',
                class: 'gantt-row-actions-btn',
                type: 'button',
                dataset: { taskId: String(record.id) },
                html: '<i class="fa-solid fa-ellipsis-vertical"></i>',
              },
            ],
          };
        },
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
        type: 'enddate',
        field: 'endDate',
        text: 'End',
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
      taskEdit: false,
      columnLines: true,
      stripe: true,
      tree: { toggleTreeNode: false },
      cellTooltip: {
        tooltipRenderer: ({ record, column }) => formatTooltipText(record, column.field),
      },
    },
    emptyText: 'No tasks yet — click "+ Add Task" above or double-click here to get started',
    viewPreset: 'weekAndDayLetter',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 24, 1),
    barMargin: 10,

    // Differentiate parent bars from child bars.
    // Adds 'gantt-parent-bar' class to parent tasks for CSS targeting.
    // Parent bars show no text (name is in the tree column).
    taskRenderer({ taskRecord, renderData }: {
      taskRecord: TaskModel;
      renderData: { cls: DomClassList | string; style: string | Record<string, string>; wrapperCls: DomClassList | string; iconCls: DomClassList | string };
    }) {
      if (taskRecord.isParent) {
        if (typeof renderData.cls !== 'string') {
          renderData.cls.add('gantt-parent-bar');
        }
        return '';
      }
      return taskRecord.name;
    },

    listeners: {
      // Bryntum blocks the duration cell editor for parent tasks before
      // beforeCellEditStart ever fires (checked internally in DurationColumn).
      // cellDblClick fires first, so we can set manuallyScheduled: true here —
      // telling the scheduling engine to stop auto-deriving duration from children
      // — before Bryntum decides whether to open the editor.
      cellDblClick({ record, column }) {
        if (column.type === 'duration' && record.isParent && !record.get('manuallyScheduled')) {
          record.set('manuallyScheduled', true);
        }
      },
      // scrollTaskIntoView removed — it corrupts the time axis header
      // virtual renderer, causing all date labels to disappear after scroll.
    },
  };
}
