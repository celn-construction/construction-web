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

    // Virtualize the time axis so the user can switch to fine-grained presets
    // (e.g. hourAndDay) over a multi-year startDate/endDate span without
    // Bryntum throwing "Configured date range will result in a too long time axis".
    // Only `bufferCoef × viewport` worth of ticks are rendered at once; the
    // range slides as the user scrolls.
    infiniteScroll: true,

    project: {
      autoLoad: true,
      autoSync: false,
      writeAllFields: true,
      taskModelClass: VersionedTaskModel,
      resetUndoRedoQueuesAfterLoad: true,

      stm: {
        autoRecord: true,
      },

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
      nonWorkingTime: true,
      tree: { toggleTreeNode: false },
      cellTooltip: {
        tooltipRenderer: ({ record, column }) => formatTooltipText(record, column.field),
      },
      // Show the proposed end date in a tooltip while the user drags the
      // end-side resize handle. Bryntum's TaskResize is end-only by design;
      // this gives live feedback during the drag.
      taskResize: {
        showTooltip: true,
        tooltipTemplate: ({ endDate }) => {
          if (!endDate) return '';
          return endDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
        },
      },
    },
    emptyText: 'No tasks yet — click "+ Add Task" above or double-click here to get started',
    presets: [
      {
        id: 'weekAndDayLetterCompact',
        base: 'weekAndDayLetter',
        headers: [
          { unit: 'month', dateFormat: 'MMMM YYYY' },
          { unit: 'day', dateFormat: 'd1' },
          { unit: 'day', dateFormat: 'DD' },
        ],
      },
    ],
    viewPreset: 'weekAndDayLetterCompact',
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
      // scrollTaskIntoView removed — it corrupts the time axis header
      // virtual renderer, causing all date labels to disappear after scroll.
    },
  };
}
