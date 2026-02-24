/**
 * Minimal shape we need from a Bryntum task record for validation.
 */
export interface BryntumTaskRecord {
  isParent: boolean;
  manuallyScheduled: boolean;
  endDate: Date | null | undefined;
  startDate: Date | null | undefined;
  name?: string | unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any; // Bryntum stores children as an internal collection
}

/**
 * Checks whether a manually-scheduled parent task's date range
 * still encompasses all of its direct children after a change.
 *
 * Returns null when valid, or a user-facing error string when invalid.
 *
 * Only checks direct children — sufficient because each nested parent
 * validates independently when its own dates change via the taskStore
 * update event.
 */
export function validateParentDuration(record: BryntumTaskRecord): string | null {
  if (!record.isParent || !record.manuallyScheduled) {
    return null;
  }

  const parentEnd = record.endDate;
  if (!parentEnd) {
    return null;
  }

  // Bryntum's children collection exposes .toArray() to get a plain array
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const children: BryntumTaskRecord[] = (record.children?.toArray?.() ?? []) as BryntumTaskRecord[];

  if (children.length === 0) {
    return null;
  }

  let latestChildEnd: Date | null = null;
  for (const child of children) {
    const childEnd = child.endDate;
    if (!childEnd) continue;
    if (!latestChildEnd || childEnd > latestChildEnd) {
      latestChildEnd = childEnd;
    }
  }

  if (!latestChildEnd) {
    return null;
  }

  if (parentEnd < latestChildEnd) {
    const taskName = typeof record.name === 'string' ? record.name : 'Task';
    return `"${taskName}" cannot be shorter than its subtasks. Change reverted.`;
  }

  return null;
}
