'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSnackbar } from '@/hooks/useSnackbar';
import type {
  BryntumGanttInstance,
  BryntumTaskRecord,
  TaskClickEventPayload,
} from '../types';

/** One entry in the ordered link selection. `record` is the live Bryntum task. */
export interface LinkSelectionItem {
  id: string;
  name: string;
  record: BryntumTaskRecord;
}

// Finish-to-Start (EndToStart) — the default construction dependency. Matches
// the `type: 2` used by TaskInfoDialog's predecessor/successor picker.
const FINISH_TO_START = 2;

// Position → color class. The CSS sets `--gantt-link-c` per class so the bar
// outline and the numbered badge share one color source.
const COLOR_CLASSES = ['gantt-link-c1', 'gantt-link-c2', 'gantt-link-c3'] as const;
const LINK_CLASSES = ['gantt-link-selected', ...COLOR_CLASSES];

function colorClassFor(index: number): string {
  return COLOR_CLASSES[Math.min(index, COLOR_CLASSES.length - 1)]!;
}

/** Resolve the `.b-gantt-task` bar element for a record, normalizing whatever
 *  `getElementFromTaskRecord` hands back to the bar itself. */
function findBarElement(
  gantt: BryntumGanttInstance,
  record: BryntumTaskRecord,
): HTMLElement | null {
  const raw = gantt.getElementFromTaskRecord?.(record) ?? null;
  if (raw) {
    if (raw.classList.contains('b-gantt-task')) return raw;
    const inner = raw.querySelector?.('.b-gantt-task') as HTMLElement | null;
    if (inner) return inner;
    const outer = raw.closest?.('.b-gantt-task') as HTMLElement | null;
    if (outer) return outer;
  }
  // Fallback: scope a DOM query to the Gantt root by task id.
  const id = String(record?.id ?? '');
  if (!id) return null;
  const container = gantt.element ?? document.querySelector('.bryntum-gantt-container');
  return (container?.querySelector(
    `.b-gantt-task-wrap[data-task-id="${CSS.escape(id)}"] .b-gantt-task`,
  ) as HTMLElement | null) ?? null;
}

function clearBar(bar: HTMLElement): void {
  bar.classList.remove(...LINK_CLASSES);
  bar.querySelector(':scope > .gantt-link-badge')?.remove();
}

/**
 * Shift-click (or Link-mode click) dependency creation.
 *
 * Builds an ordered selection of task bars — first pick is the predecessor (①),
 * each subsequent pick chains a Finish-to-Start dependency (①→②→③). The bars
 * get a colored outline + numbered badge applied via direct DOM (mirrors the
 * popover highlight in useTaskPopover — both accept that Bryntum's virtual
 * re-render on scroll can clear an off-screen bar's badge; the floating toast
 * remains the source of truth). `commitLinks` writes them via dependencyStore,
 * which autoSyncs to the DB.
 */
export function useTaskLinking(getGanttInstance: () => BryntumGanttInstance | null) {
  const { showSnackbar } = useSnackbar();
  const [linkMode, setLinkMode] = useState(false);
  const [selection, setSelection] = useState<LinkSelectionItem[]>([]);
  const selectionRef = useRef<LinkSelectionItem[]>([]);
  const appliedRef = useRef<HTMLElement[]>([]);

  // Re-paint the bar outlines + badges for the given ordered selection.
  const applyStyling = useCallback(
    (items: LinkSelectionItem[]) => {
      appliedRef.current.forEach(clearBar);
      appliedRef.current = [];
      const gantt = getGanttInstance();
      if (!gantt) return;
      items.forEach((item, index) => {
        const bar = findBarElement(gantt, item.record);
        if (!bar) return;
        bar.classList.add('gantt-link-selected', colorClassFor(index));
        const badge = document.createElement('span');
        badge.className = 'gantt-link-badge';
        badge.textContent = index < 9 ? String(index + 1) : '+';
        bar.appendChild(badge);
        appliedRef.current.push(bar);
      });
    },
    [getGanttInstance],
  );

  const setSelectionAll = useCallback(
    (items: LinkSelectionItem[]) => {
      selectionRef.current = items;
      setSelection(items);
      applyStyling(items);
    },
    [applyStyling],
  );

  const clearSelection = useCallback(() => {
    setSelectionAll([]);
  }, [setSelectionAll]);

  // Leaving link mode always drops any in-progress selection.
  useEffect(() => {
    if (!linkMode) setSelectionAll([]);
  }, [linkMode, setSelectionAll]);

  const toggleLinkMode = useCallback(() => {
    setLinkMode((prev) => !prev);
  }, []);

  // Add / toggle a task in the ordered selection.
  const handleLinkClick = useCallback(
    (payload: TaskClickEventPayload) => {
      const { taskRecord, event } = payload;
      // Suppress the browser's Shift text-selection during the gesture.
      event?.preventDefault?.();
      if (taskRecord.isParent) return; // parent bars can't be dependency endpoints
      if (taskRecord.isPhantom) {
        showSnackbar('Saving task — try again in a moment', 'info');
        return;
      }
      const id = String(taskRecord.id);
      const prev = selectionRef.current;
      const existing = prev.findIndex((s) => s.id === id);
      const next =
        existing >= 0
          ? prev.filter((s) => s.id !== id)
          : [
              ...prev,
              {
                id,
                name: taskRecord.name ?? '',
                record: taskRecord as unknown as BryntumTaskRecord,
              },
            ];
      setSelectionAll(next);
    },
    [setSelectionAll, showSnackbar],
  );

  // Entry point for the right-click "Add dependency" menu item: turn on link
  // mode and seed the clicked task as the predecessor ①, so the next click
  // picks the successor. Reuses the same selection + confirm flow as Shift-click.
  const startLinkingFrom = useCallback(
    (taskRecord: BryntumTaskRecord) => {
      if (taskRecord.isParent) return;
      if ((taskRecord as { isPhantom?: boolean }).isPhantom) {
        showSnackbar('Saving task — try again in a moment', 'info');
        return;
      }
      setLinkMode(true);
      setSelectionAll([{ id: String(taskRecord.id), name: taskRecord.name ?? '', record: taskRecord }]);
    },
    [setSelectionAll, showSnackbar],
  );

  // Write the Finish-to-Start dependencies along the chain, skipping pairs that
  // are already linked, then offer an Undo.
  const commitLinks = useCallback(() => {
    const items = selectionRef.current;
    if (items.length < 2) return;
    const gantt = getGanttInstance();
    const store = gantt?.project.dependencyStore;
    if (!store) return;

    const created: unknown[] = [];
    for (let i = 0; i < items.length - 1; i++) {
      const from = items[i]!.id;
      const to = items[i + 1]!.id;
      if (from === to) continue;
      if (store.getDependencyForSourceAndTargetEvents?.(from, to)) continue;
      const added = store.add({ from, to, type: FINISH_TO_START });
      const record = Array.isArray(added) ? added[0] : added;
      if (record) created.push(record);
    }

    clearSelection();

    if (created.length === 0) {
      showSnackbar('Those tasks are already linked', 'info');
      return;
    }

    const message =
      items.length === 2
        ? `Linked “${items[0]!.name}” → “${items[1]!.name}”`
        : `Linked ${items.length} tasks in sequence`;
    showSnackbar(message, {
      severity: 'success',
      action: {
        label: 'Undo',
        onClick: () => {
          // Removing from the store autoSyncs the deletion to the DB.
          getGanttInstance()?.project.dependencyStore.remove(created);
        },
      },
    });
  }, [getGanttInstance, clearSelection, showSnackbar]);

  return {
    linkMode,
    setLinkMode,
    toggleLinkMode,
    selection,
    handleLinkClick,
    startLinkingFrom,
    clearSelection,
    commitLinks,
  };
}
