# Gantt Draft Persistence

Per-device local-storage persistence for unsaved Gantt edits. Drafts survive page refresh and SPA navigation (ticket #97). Server sync stays manual ("Create Snapshot" button).

## User-Visible Behavior

- User adds/edits/deletes tasks → changes accumulate in localStorage as they happen
- User navigates away (other route, tab close, refresh) → changes persist
- User returns → draft restores automatically; the "N changes since last snapshot" counter comes back at the same value they left it
- User clicks **Create Snapshot** → explicit server sync + draft is cleared on success
- Edit mode auto-unlocks when there's a draft to restore (user clearly wants to keep editing)
- Drafts are per-device, per-project — switching projects clears the counter and loads a different draft if one exists

## Key Files

| File | Purpose |
|------|---------|
| `src/components/bryntum/hooks/useGanttDraft.ts` | Orchestrator: save/restore/clear lifecycle, the `hasGanttDraft` helper for edit-mode autounlock |
| `src/store/ganttChangesStore.ts` | Zustand store for the "N changes" counter; exposes `serialize()` and `hydrate()` so the hook can round-trip counter state |
| `src/components/bryntum/BryntumGanttWrapper.tsx` | Calls `useGanttDraft({ getGanttInstance, projectId, isLoading })`; initializes `isEditMode` to `true` when `hasGanttDraft(projectId)` |

## Storage Shape

Key: `gantt-draft-v4-{projectId}` (bump the `v4` suffix whenever the payload shape changes — older keys are ignored and cleaned up on next restore)

Value: JSON-stringified `DraftBundle`:

```ts
interface DraftBundle {
  projectJson: string;             // Bryntum's own `project.json` serialization
  counter: GanttChangesSnapshot;   // { added, modified, removed } entries as [id,name] pairs
  savedAt: number;                 // ms epoch — for debugging/sorting
}
```

## Save Flow

1. User edits task → Bryntum fires `taskStore.change` or `dependencyStore.change`
2. Hook's save handler runs (no debounce)
3. If `taskStore.count === 0` → skip (Bryntum's internal bulk operations fire `change` events during transient empty states; ignoring these prevents wiping a valid draft with nothing)
4. Otherwise: serialize `{ projectJson: project.json, counter: store.serialize(), savedAt: now }` to localStorage

## Restore Flow

Runs exactly once per component mount, after `isLoading` flips to `false`:

1. `useGanttChangesStore.reset()` — clear counter from any prior project
2. Parse stored bundle; if malformed or has no tasks → delete and skip
3. `setTimeout(500ms)` — wait for the wrapper's post-load effects (commitAsync, `enableStm`) to settle; applying the draft synchronously while that async chain is in flight caused records to be silently dropped
4. After the delay:
   - `project.json = bundle.projectJson` — Bryntum rebuilds stores from the snapshot
   - `useGanttChangesStore.hydrate(bundle.counter)` — counter shows exactly what the user saw before refresh
   - `project.commitAsync()` — trigger the scheduling engine so the chart paints the restored records

## Clear Flow

The hook subscribes to `project.on('sync', ...)`. When the user explicitly creates a Snapshot (which internally triggers a server sync), the draft is deleted from localStorage. No other code path clears it — transient empty states from Bryntum don't cause deletion, only explicit save does.

## Design Decisions (Non-Obvious)

| Decision | Reason |
|---|---|
| Use `project.json` (Bryntum-native) instead of manually tracking adds/updates/removes | Bryntum wrote both the serializer and deserializer. Trying to reimplement it led to hundreds of lines of phantom-id reconciliation, parentId rewiring, and replay logic that kept producing corner-case bugs. `project.json` handles all of it correctly. |
| 500ms delay before restore | The wrapper has its own `commitAsync → enableStm` chain that fires on `isLoading: false`. Applying `project.json` synchronously mid-chain caused Bryntum to silently drop records during reconciliation. 500ms lets the wrapper settle on server state first; then we apply the draft on top. Heuristic, not proven — a slow device could exceed it. If we see regressions, replace with an explicit completion signal from the wrapper. |
| Snapshot counter alongside project state | After `project.json = saved`, Bryntum considers the loaded state as the new baseline — nothing is "modified". So we can't infer the counter from the store after restore. Persisting the in-memory counter snapshot (which is accurate *during* editing) and rehydrating is the only way to get an accurate count across refresh. |
| `taskCount === 0` guard on save | Bryntum fires `change` events during internal reconciliation when the store is momentarily empty. Writing that state would wipe the user's draft. "Don't persist empty" is a safer default than a debounce timer. |
| Edit mode auto-unlocks when draft exists | If there's unsaved work waiting to restore, the user clearly intends to keep editing. Making them click a lock toggle after refresh creates an extra step and hides the restored tasks (read-only mode hides triple-dot menus and disables right-click actions). |
| No debounce on save | Debouncing caused data loss when the user deleted a task and immediately refreshed — the debounced save hadn't fired yet. The `count === 0` guard is enough to filter transient Bryntum states without needing a timer. |
| Reset counter on project switch | `ganttChangesStore` is a Zustand singleton, so switching projects would otherwise carry over counts from the previous project. The restore effect calls `reset()` before deciding what to hydrate. |
| Return HTTP 200 with `success:false` on sync errors (unrelated but related) | Bryntum's `onCrudRequestFailure` path has a bug (`Cannot set properties of undefined (setting 'isBeingMaterialized')`). Routing errors through `onCrudFailure` via 200 + success:false avoids the crash. See `src/app/api/gantt/sync/route.ts`. |

## Known Tradeoffs

- **Draft wins over server state on restore.** If user A has a draft on device X and user B edits the same project server-side, A's draft restore overwrites B's changes locally. This is single-device draft scope. Multi-user conflict resolution is handled at Save time via the `version` field + `ScheduleVersion` snapshot system.
- **500ms delay is a heuristic, not a guarantee.** On an extremely slow device the wrapper's post-load effects might not finish in 500ms and the race could reappear. We haven't observed this in practice.
- **No explicit "Discard Draft" UI yet.** A draft is cleared only when the user syncs. Manually clearing localStorage (or calling `Create Snapshot` with no changes) is the only way to drop a draft without syncing. Acceptable for MVP.
- **If user legitimately deletes all tasks**, the `count === 0` guard means we *don't* persist that empty state — on next refresh they'd see their last non-empty draft. Intentional tradeoff: protect against Bryntum's transient empties at the cost of a rare undo flow.

## Rules for Future Changes

- **Never call `project.json = saved` without waiting** for the wrapper's post-load effects (the 500ms setTimeout). Doing so synchronously at `isLoading: false` time will race with `commitAsync`/`enableStm` and Bryntum will silently drop your records.
- **Never dispatch `gantt-reload` from the draft restore path.** The wrapper listens for that event and calls `project.load()`, which fetches from the server and overwrites the draft you just applied.
- **Bump the storage key prefix** (`gantt-draft-vN-`) whenever the bundle shape changes. Old keys will fail to parse, get deleted on next restore, and the user starts clean in the new format — no migration code needed.
- **Keep the `count === 0` guard.** Removing it re-introduces the "empty draft wipes the project" bug that took hours to diagnose.
- **Don't add features like multi-device sync or draft merging to this file.** Drafts are explicitly per-device, per-session. Cross-device work belongs in the existing Version + sync system.

## Rollback

To disable drafts temporarily: remove the `useGanttDraft(...)` call from `BryntumGanttWrapper.tsx` and the `hasGanttDraft(projectId)` call from the `isEditMode` initializer. Everything else (ganttChangesStore, the wrapper's own sync logic) continues to work — drafts just stop persisting. The next real sync clears any lingering localStorage entries.

## Debugging

The hook only logs via `console.warn` on genuine errors (parse failures, `commitAsync` rejections, `localStorage.setItem` throws). There are no diagnostic `console.log` calls in production code — they were stripped after the system stabilized.

### Reproducing or diagnosing regressions

If a regression appears and you need verbose tracing, add targeted logs at these decision points (they were originally numbered roughly in this order and the list is worth preserving):

1. **Restore gate**: `isLoading`, `projectId`, `restoredRef.current`, whether a draft was found in localStorage, whether `bundleHasTasks` passed.
2. **Restore timing**: before and after the 500ms `setTimeout`, so you can see if something intervened during the wait.
3. **Pre/post-assignment counts**: `project.taskStore?.count` before and after `project.json = bundle.projectJson` to see whether the assignment actually loaded records.
4. **Counter hydrate**: the `{added, modified, removed}` arrays pulled from the bundle, to confirm they match the badge number shown in the UI.
5. **commitAsync timing**: a poll of `taskStore.count` every ~200ms for a few seconds after commit. If the count drops from N to 0 within that window, the 500ms delay isn't long enough or a new effect is interfering (this was the original race we hit).
6. **Save guard**: whether the save was skipped due to `!projectJson` or `taskCount === 0`, and the source event (`taskStore.change` vs `dependencyStore.change`).

### Common scenarios

**"Counter shows wrong number after refresh."**
The badge reads directly from `ganttChangesStore`, which `hydrate()` sets from the bundle. Either the snapshot at save time was already wrong, or something is calling `handleTaskChange` post-hydrate. Put a `console.log` right before the `hydrate()` call to confirm what went in, and compare to the actual badge after restore.

**"Tasks don't show up after refresh."**
Check `project.taskStore.count` immediately after `project.json = bundle.projectJson` — if it's non-zero, the data loaded. If the count later drops to zero, the 500ms delay lost its race with the wrapper's `commitAsync → enableStm` chain. Increase the delay temporarily (1000ms+) to confirm; the proper fix would be an explicit completion signal instead of a timer.

**"Counter shows N but should be 0 after switching projects."**
The restore effect calls `useGanttChangesStore.getState().reset()` before deciding what to hydrate. If the reset isn't running, the component didn't remount on project change (investigate route-group keying).

**"Draft keeps getting wiped."**
The `taskCount === 0` guard blocks Bryntum's transient empty states. If a draft is being overwritten anyway, Bryntum is reporting non-zero `project.json` but zero `taskStore.count` — a Bryntum inconsistency that would need separate investigation.

### Inspecting / clearing localStorage manually

```js
// View current draft for a project (paste in console, replace projectId):
JSON.parse(localStorage.getItem('gantt-draft-v4-{projectId}'))

// Clear all Gantt drafts:
Object.keys(localStorage)
  .filter(k => k.startsWith('gantt-draft-'))
  .forEach(k => localStorage.removeItem(k));

// Clear just the current project's draft (paste projectId):
localStorage.removeItem('gantt-draft-v4-{projectId}');
```
