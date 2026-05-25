import { TaskModel } from '@bryntum/gantt';
import type { DomClassList } from '@bryntum/gantt';
import type { GanttConfig, ColumnRendererData } from '../types';

// Extend TaskModel to include custom fields. Without explicit `fields`, Bryntum
// drops them from loaded data. `needsReviewCount` drives the review-queue badge
// in the name column. `requirementsTotal` / `requirementsFilled` drive the
// submittal+inspection completion % shown on each task bar.
class AppTaskModel extends TaskModel {
  static override get fields() {
    return [
      { name: 'needsReviewCount', type: 'int', defaultValue: 0 },
      { name: 'requirementsTotal', type: 'int', defaultValue: 0 },
      { name: 'requirementsFilled', type: 'int', defaultValue: 0 },
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
    infiniteScroll: true,

    project: {
      autoLoad: true,
      autoSync: true,
      // Coalesce rapid changes (e.g. mid-drag) into one HTTP request per
      // window. Default is 100ms; 500ms cuts in-flight requests during a
      // drag from ~10/sec to ~2/sec while still feeling instant on release.
      autoSyncTimeout: 500,
      taskModelClass: AppTaskModel,
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
        id: 'name',
        type: 'name',
        field: 'name',
        text: 'Name',
        flex: 1,
        minWidth: 300,
        resizable: true,
        renderer({ value, record }: ColumnRendererData) {
          const needsReviewCount = Number(record.get('needsReviewCount') ?? 0);
          const children: Array<Record<string, unknown>> = [
            { tag: 'span', class: 'gantt-name-text', text: String(value ?? '') },
          ];

          if (needsReviewCount > 0) {
            children.push({
              tag: 'span',
              class: 'gantt-needs-review-badge',
              dataset: { taskId: String(record.id) },
              title: `${needsReviewCount} item${needsReviewCount === 1 ? '' : 's'} awaiting review`,
              text: String(needsReviewCount),
            });
          }

          return {
            class: 'gantt-name-cell-inner',
            children,
          };
        },
      },
      // Double-clicking the name cell starts inline name editing (Bryntum native behavior).
      // Right-click opens the task context menu (includes "Scroll to item").
      {
        id: 'startDate',
        type: 'startdate',
        field: 'startDate',
        text: 'Start',
        width: 120,
        resizable: true,
      },
      {
        id: 'endDate',
        type: 'enddate',
        field: 'endDate',
        text: 'End',
        width: 120,
        resizable: true,
      },
      {
        id: 'duration',
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
      percentBar: false,
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
      // Theme all Bryntum context menus to match the app's light palette.
      // The marker class is applied to the floating `.b-menu` element so our
      // CSS overrides in globals.css stay scoped to Gantt menus.
      //
      // taskMenu intentionally NOT here — passed as the top-level
      // `taskMenuFeature` prop on <BryntumGantt> in BryntumGanttWrapper so its
      // `items` / `processItems` config is honored by the React wrapper. When
      // nested under `features` here, the wrapper translates it via its
      // `features → ${key}Feature` rewriter and the `processItems` callback
      // never fires.
      cellMenu: { cls: 'gantt-themed-menu' },
      scheduleMenu: { cls: 'gantt-themed-menu' },
      dependencyMenu: { cls: 'gantt-themed-menu' },
      // Dependencies — drag-to-create dep arrows (hover any task bar's
      // edge for handles) and auto-rescheduling on predecessor moves.
      // Does NOT light up the `linkTasks` / `unlinkTasks` items in the
      // right-click menu — those need 2+ tasks Cmd-selected; the tooltip
      // wired in processItems (BryntumGanttWrapper.tsx) explains this.
      //
      // dependencyStore already loads from /api/gantt/load and syncs via
      // /api/gantt/sync, so creates/deletes round-trip with no API work.
      //
      // To revert: set false. Existing rows stay in the DB, just stop
      // rendering. History: built+removed during the kibo-ui era
      // (commits 856d7a6 → 22a382f → 0a2cbf7 → b0a1630 → ac717e2).
      dependencies: true,
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
    // Leaf bars show the task name plus a donut-in-chip indicator carrying
    // both the visual progress (mini SVG donut) and the count (e.g. 1/2) when
    // the task has any requirements set (requirementsTotal > 0).
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

      const total = Number(taskRecord.get('requirementsTotal') ?? 0);
      if (total <= 0) {
        return taskRecord.name;
      }

      const filled = Math.min(
        Number(taskRecord.get('requirementsFilled') ?? 0),
        total,
      );
      const isDone = filled >= total;
      const isEmpty = filled === 0;

      // Donut math — viewBox 14x14, r=5.5, circumference = 2πr ≈ 34.56.
      // The fill arc uses stroke-dasharray/offset to draw a partial circle.
      const CIRCUMFERENCE = 34.56;
      const offset = CIRCUMFERENCE * (1 - filled / total);

      const donutSvg = isDone
        ? '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">'
          + '<circle cx="7" cy="7" r="5.5" fill="#fff"/>'
          + '<path d="M4 7L6.2 9L10 5" stroke="#16a34a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
          + '</svg>'
        : isEmpty
        ? '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">'
          + '<circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="2"/>'
          + '</svg>'
        : '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">'
          + '<circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>'
          + `<circle cx="7" cy="7" r="5.5" fill="none" stroke="#1e40af" stroke-width="2" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${offset.toFixed(2)}" transform="rotate(-90 7 7)" stroke-linecap="round"/>`
          + '</svg>';

      const chipClass = `gantt-task-bar-chip${isDone ? ' is-done' : ''}${isEmpty ? ' is-empty' : ''}`;

      return {
        class: 'gantt-task-bar-inner',
        children: [
          { tag: 'span', class: 'gantt-task-bar-name', text: String(taskRecord.name ?? '') },
          {
            tag: 'span',
            class: chipClass,
            title: `${filled} of ${total} submittals and inspections complete`,
            children: [
              { tag: 'span', class: 'gantt-task-bar-chip-donut', html: donutSvg },
              { tag: 'span', class: 'gantt-task-bar-chip-text', text: `${filled}/${total}` },
            ],
          },
        ],
      };
    },
  };
}
