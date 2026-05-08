# Gantt Draft Persistence

Thin local-storage safety net for unsaved Gantt edits. Survives page refresh while the in-flight `autoSync` request completes.

## Why It Exists

With Bryntum's `autoSync: true`, every edit syncs to Postgres immediately — the database is the source of truth. But there's a small window between "user makes a change" and "server acknowledges": if the user refreshes during that window, the change is lost. The draft persists Bryntum's `project.json` to localStorage so the next page load can restore it before the autosync's next round-trip catches up.

Drafts are **per-device, per-project**. They are NOT a substitute for server persistence — losing localStorage just means losing the last 1–2 seconds of edits, not days of work.

## Key Files

| File | Purpose |
|------|---------|
| `src/components/bryntum/hooks/useGanttDraft.ts` | Save/restore/clear lifecycle and the `hasGanttDraft` helper |
| `src/components/bryntum/BryntumGanttWrapper.tsx` | Wires the hook in and uses `hasGanttDraft(projectId)` to auto-unlock edit mode |

## Storage

Key: `gantt-draft-v4-{projectId}` (bump the `v4` suffix whenever the payload shape changes — older keys are ignored on next restore)

Value: JSON-stringified `DraftBundle`:

```ts
interface DraftBundle {
  projectJson: string;  // Bryntum's `project.json` serialization
  savedAt: number;      // ms epoch
}
```

## Save Flow

1. User edits task → Bryntum fires `taskStore.change` or `dependencyStore.change`
2. Hook's save handler runs (no debounce)
3. If `taskStore.count === 0` → skip (Bryntum momentarily empties the store during reconciliation; persisting that would wipe a valid draft)
4. Otherwise: serialize `{ projectJson, savedAt: now }` to localStorage

## Restore Flow

Runs once per component mount, after `isLoading` flips false:

1. Parse stored bundle; if missing or has no tasks → delete and skip
2. `setTimeout(500ms)` — wait for the wrapper's `commitAsync` chain to settle. Applying the draft synchronously while that chain is in flight caused records to be silently dropped
3. After the delay: assign `project.json = bundle.projectJson` (Bryntum rebuilds stores) and call `commitAsync()` to repaint

## Clear Flow

Subscribes to `project.on('sync', ...)`. Whenever Bryntum completes a successful sync (which happens continuously now with autoSync), the draft is removed. With `autoSync: true` this means drafts get cleared within seconds of any edit — they only persist long enough to cover the in-flight gap.

## Design Decisions

| Decision | Reason |
|---|---|
| `count === 0` save guard | Bryntum fires `change` events during internal reconciliation when the store is momentarily empty. Writing that state would wipe the draft. Side-effect: legitimately deleting all tasks then refreshing brings them back |
| 500 ms restore delay | Heuristic. Wrapper's post-load `commitAsync → enableStm` chain runs async; applying `project.json` mid-chain caused Bryntum to drop records. Slow devices could race past this; an explicit completion signal would be more robust |
| No debounce on save | Removed the snapshot system → drafts only protect the in-flight gap. With autoSync flushing every change, save thrashing is bounded by autoSync's own cadence |
| Bump key prefix on shape change | Old keys fail to parse and get removed on the next restore. No migration code needed |

## What Drafts Do NOT Do

- **Multi-device sync** — drafts are local; cross-device "continue editing" comes from autoSync hitting the database
- **Conflict resolution** — that lives in `BryntumGanttWrapper.tsx` via the `version` field on `GanttTask` and `ConflictDialog`
- **Time travel / history** — there is no longer a snapshot or revision system; undo/redo is in-session only via Bryntum STM (`useGanttControls`)

## Rollback

To disable drafts entirely: remove the `useGanttDraft(...)` call from `BryntumGanttWrapper.tsx` and the `hasGanttDraft(projectId)` call from the `isEditMode` initializer. The autoSync flow continues to work — drafts just stop persisting locally.
