---
name: gantt
description: "Bryntum Gantt chart development with automatic documentation lookup and project-aware context"
category: workflow
complexity: standard
mcp-servers: [context7]
---

# /gantt - Bryntum Gantt Chart Development

> **Context Framework Note**: This behavioral instruction activates when users type `/gantt` patterns. It ensures Bryntum Gantt documentation is always consulted before making changes and provides full project context for the Gantt integration.

## Triggers
- Any modification to Gantt chart components, config, hooks, or utilities
- Bryntum API usage questions or troubleshooting
- Gantt feature additions (columns, features, listeners, toolbar controls)
- Task scheduling logic, sync/load transport, or conflict resolution changes
- Gantt-related tRPC router or API route changes

## Context Trigger Pattern
```
/gantt [task-description] [--feature columns|scheduling|sync|toolbar|popover|conflict] [--docs-only]
```
**Usage**: Type this in Claude Code conversation to activate Gantt development mode with automatic Bryntum documentation lookup.

## Behavioral Flow

### Step 1: Fetch Bryntum Documentation (MANDATORY)
Before making ANY Gantt-related changes, you MUST:

1. **Resolve the Bryntum Gantt library** via Context7:
   ```
   mcp__Context7__resolve-library-id("bryntum gantt")
   ```
2. **Query relevant documentation** for the specific task:
   ```
   mcp__Context7__query-docs(libraryId, "topic relevant to the task")
   ```
3. Review the docs for non-obvious behaviors before proceeding.

**Why**: Bryntum has many internal behaviors not apparent from config alone — parent task duration auto-calculation, event firing order, scheduling engine quirks, and blocked cell editors. Skipping docs leads to subtle bugs.

### Step 2: Review Project Gantt Structure
Before editing, understand the existing file layout:

```
src/components/bryntum/
├── BryntumGanttWrapper.tsx    ← Main wrapper: state, sync, conflict handling, auto-save debounce
├── types.ts                   ← Shared types: PopoverPlacement, SelectedTask, GanttConfig, etc.
├── constants.ts               ← UI constants: POPOVER_WIDTH, POPOVER_GAP, etc.
├── config/
│   └── ganttConfig.ts         ← Config factory: transport, columns, features, listeners
├── components/
│   ├── GanttToolbar.tsx       ← Toolbar: add task, zoom, shift, preset controls
│   ├── TaskDetailsPopover.tsx ← Task detail popover (leaf tasks only)
│   └── ConflictDialog.tsx     ← Version conflict resolution dialog
├── hooks/
│   ├── useGanttControls.ts    ← Gantt control methods (add, zoom, shift, preset)
│   ├── useTaskPopover.ts      ← Task selection and popover placement state
│   └── useBryntumThemeAssets.ts ← Dynamic theme CSS and Font Awesome loading
└── utils/
    ├── ganttValidation.ts     ← Parent task duration validation
    └── calculatePopoverPlacement.ts ← Popover positioning logic
```

**Related files outside bryntum/:**
- `src/server/api/routers/gantt.ts` — tRPC router for load/sync
- `src/app/api/gantt/load/route.ts` — Load transport endpoint
- `src/app/api/gantt/sync/route.ts` — Sync transport endpoint + Ably broadcast
- `src/lib/utils/gantt.ts` — Shared Gantt data helpers

**Ably real-time collaboration files:**
- `src/lib/ably.ts` — Server-side REST client singleton (lazy, returns null when key missing)
- `src/server/api/helpers/ganttBroadcast.ts` — `broadcastGanttChanges()` publishes sync events to Ably
- `src/app/api/ably/auth/route.ts` — Token auth endpoint (validates session + project membership)
- `src/components/providers/AblyProvider.tsx` — Client Ably provider (wraps `ably/react`, scoped per project)
- `src/components/bryntum/hooks/useGanttRealtime.ts` — Subscribe to sync events + apply remote changes + presence
- `src/components/bryntum/components/GanttPresence.tsx` — Avatar group showing who's viewing

### Step 3: Apply Changes Following Existing Patterns
- New types → `types.ts`
- New constants → `constants.ts`
- Config changes → `config/ganttConfig.ts` (modify `createGanttConfig`)
- New UI components → `components/`
- New hooks → `hooks/`
- New utility functions → `utils/`
- Do NOT add Gantt logic to other `components/` folders

### Step 4: Validate Against Bryntum Docs
After implementing, cross-check with docs for:
- Event firing order (e.g., `cellDblClick` fires before `beforeCellEditStart`)
- Scheduling engine implications (auto-scheduled vs manually-scheduled tasks)
- Parent task behaviors (duration derived from children unless `manuallyScheduled: true`)
- CrudManager sync protocol expectations

## Project Architecture Context

### Optimistic Locking with Version Injection
- Every task has a `version` field (integer, via `VersionedTaskModel`)
- On sync, `BryntumGanttWrapper` injects current version into the update pack
- Server detects version mismatch → returns conflict response
- `ConflictDialog` lets user accept server changes, keep local, or cancel

### Auto-Save Flow
1. Bryntum fires `beforeSync` → version injection
2. Changes sync via tRPC `/api/gantt/sync`
3. 1-second debounce after scheduling engine completes
4. Monitors: taskStore, dependencyStore, resourceStore, assignmentStore, timeRangeStore

### Common Bryntum Pitfalls
| Pitfall | Details |
|---------|---------|
| **`delayCalculation: true` + Ably wrapper** | **NEVER use `delayCalculation: true`** in the project config. With our Ably wrapper structure (`BryntumGanttWrapper` → `BryntumGanttCore`), `delayCalculation: true` prevents the scheduling engine from running properly — task bars never render (grid rows show but timeline is empty). The engine only kicks in after a sync (Save). Removing `delayCalculation` makes the engine calculate immediately on data load/task add, so task bars render instantly. This also breaks with React Strict Mode double-mount. |
| **`height: '100%'` required on WRAPPER_STYLE** | The Gantt wrapper container MUST use `height: '100%'`, not `flex: 1` with `minHeight: 0`. Bryntum's internal layout engine needs an explicit height constraint from its container to calculate how many rows to render. With `flex: 1`, the grid's virtual renderer can fail to create rows even though the container visually has space (task bars render on the timeline but grid rows are empty). |
| **`overflow: 'clip'` on Gantt containers** | The Gantt content container and ProjectShell wrapper MUST use `overflow: 'clip'`, not `overflow: 'hidden'`. Despite `overflow: hidden` being the general CSS recommendation, Bryntum's internal scroll synchronization works correctly with `clip` in this project. Switching to `hidden` can corrupt the grid's virtual renderer, causing grid rows to not render while task bars still show on the timeline. |
| **Always use ref-based `getGanttInstance`** | Use `ganttRef.current.instance` to get the Bryntum widget — NOT DOM queries like `document.querySelector('.b-gantt')`. DOM queries can return ghost/destroyed widgets or the wrong instance. The React ref is the authoritative source. With `reactStrictMode: false`, there are no ghost widgets to worry about. |
| **`reactStrictMode: false` is required** | Bryntum's React wrapper is a class component that cannot survive React 18's mount→unmount→remount cycle in Strict Mode. The second mount creates a widget on a corrupted DOM element, breaking the rendering pipeline. This is a known Bryntum incompatibility (forum thread #21713). Keep `reactStrictMode: false` in `next.config.js`. |
| `scrollTaskIntoView` breaks header rendering | After programmatic scrolling, call `gantt.renderContents()` to force the time axis header virtual renderer to regenerate cells for the new scroll position. Without this, the header cells stay at the old position while the body scrolls away. |
| Parent duration is read-only | Bryntum auto-calculates parent duration from children. Must set `manuallyScheduled: true` before editing. |
| Custom fields silently dropped | Must extend `TaskModel` with custom fields (see `VersionedTaskModel`). |
| `cellDblClick` fires before `beforeCellEditStart` | Use `cellDblClick` to modify record state before editor opens. |
| Duration column blocks parent editing internally | Bryntum checks `isParent` before `beforeCellEditStart` fires. |
| Stale data after tab-away | Project uses 60-second staleness threshold for reload. |
| Unscheduled tasks crash `scrollTaskIntoView` | Guard against `!record.startDate` before scrolling. |

### Critical Config Rules (Do NOT Change)
These settings were discovered through extensive debugging. Changing any of them will break task rendering:

```
ganttConfig:
  - delayCalculation: MUST be absent (not false, just omitted)
  - WRAPPER_STYLE.height: MUST be '100%' (not flex: 1)
  - GANTT_CONTENT_STYLE.overflow: MUST be 'clip' (not 'hidden')
  - ProjectShell outer Box overflow: MUST be 'clip' (not 'hidden')

next.config.js:
  - reactStrictMode: MUST be false

useGanttControls:
  - getGanttInstance: MUST use ganttRef.current.instance (not DOM query)
```

## Ably Real-Time Collaboration

### Architecture
```
User A edits → auto-save → POST /api/gantt/sync → DB write → response to User A
                                                            → Ably REST publish (fire-and-forget)

Ably cloud → WebSocket → User B's useGanttRealtime → applyRemoteChanges to Bryntum stores
```

The Ably layer is an *addition* to the existing sync flow, not a replacement. If `ABLY_API_KEY` is not set, everything works exactly as before — no real-time, no errors.

### Data Flow
1. User A saves (auto-save debounce fires CrudManager sync)
2. `/api/gantt/sync` writes to DB, returns response with new versions + phantom→real ID mappings
3. After response, fire-and-forget `broadcastGanttChanges()` publishes a single `"sync"` event to `project:${projectId}:gantt` channel
4. User B's `useGanttRealtime` hook receives the event:
   - Skips if `data.userId === currentUserId` (echo suppression)
   - Sets `isApplyingRemoteRef.current = true` (suppresses auto-save in BryntumGanttWrapper)
   - Calls `project.suspendAutoSync()` so Bryntum won't trigger a save cycle
   - Applies changes in order: **removals → additions → updates**
   - Resolves phantom→real IDs from the server result
   - Calls `project.resumeAutoSync()` + `commitAsync()` to let the scheduling engine recalculate
   - Clears `isApplyingRemoteRef` after microtask queue drains

### Channel Naming
- Pattern: `project:${projectId}:gantt`
- Token auth scoped to specific project via `/api/ably/auth?projectId=xxx`
- Token validates Better Auth session + `ProjectMember` record before issuing

### Presence
- `usePresence` enters the channel with `{ name, avatar, joinedAt }`
- `usePresenceListener` provides the list of connected users
- `GanttPresence` component renders avatar group, filtered to exclude current user
- Renders in toolbar between spacer and auto-save controls

### Key Implementation Details

| Detail | Implementation |
|--------|---------------|
| Server client | Lazy singleton `Ably.Rest` in `src/lib/ably.ts` — reused across requests |
| Client client | `Ably.Realtime` with `authUrl` pointing to token endpoint, one per project |
| Broadcast | Single batched event per sync (not per-record) — atomic application |
| Echo suppression | `userId` in message payload, filtered in `handleSyncMessage` |
| Auto-save guard | `isApplyingRemoteRef` checked by BryntumGanttWrapper store change listener |
| Phantom IDs | Server result contains `$PhantomId` → `id` mappings, resolved before store operations |
| Idempotency | `store.getById(realId)` check before additions to prevent duplicates |
| Reconnection | Ably auto-reconnects; for long disconnects (>2min), full `project.load()` on state change |

### Graceful Degradation
- No `ABLY_API_KEY` → `getAblyRest()` returns null → broadcast is no-op
- Client `AblyProvider` only rendered when key exists
- Auth endpoint returns 503 when key missing
- All existing functionality (sync, conflicts, auto-save) works without Ably

### Ably Pitfalls
| Pitfall | Details |
|---------|---------|
| **Don't block sync on broadcast** | Always `void broadcastGanttChanges(...).catch(...)` — never await in the sync response path |
| **Remote changes trigger store listeners** | Must set `isApplyingRemoteRef.current = true` BEFORE applying, clear AFTER microtask drain (setTimeout 0) |
| **`suspendAutoSync` is critical** | Without it, remote changes trigger the CrudManager to sync back, creating an infinite loop |
| **Phantom IDs in additions** | New records arrive with `$PhantomId` in input but `id` in result — must resolve before `store.add()` |
| **Parent ID resolution** | Tasks with `parentId` referencing phantom IDs must resolve to real IDs or tree structure breaks |
| **Hook rules with conditional channels** | `useChannel`/`usePresence` called unconditionally with `skip` param — never wrap in conditionals |

## MCP Integration
- **Context7 MCP**: Primary tool — always resolve Bryntum Gantt library and query docs before changes
- Query examples:
  - `"TaskModel fields and configuration"` — for task model changes
  - `"CrudManager sync protocol"` — for sync/load changes
  - `"Gantt columns configuration"` — for column changes
  - `"Gantt features"` — for enabling/configuring features
  - `"scheduling engine manually scheduled"` — for scheduling behavior

## External Documentation References
- API docs: https://bryntum.com/products/gantt/docs/api/
- Forum: https://forum.bryntum.com/
- Support issues: https://github.com/bryntum/support/issues

## Examples

### Add a New Gantt Column
```
/gantt add a CSI code column to the Gantt chart
# 1. Context7: query "Gantt columns configuration"
# 2. Review ganttConfig.ts columns array
# 3. Add column following existing pattern
# 4. Validate column type/renderer against Bryntum docs
```

### Fix Scheduling Bug
```
/gantt parent tasks aren't updating duration correctly --feature scheduling
# 1. Context7: query "scheduling engine parent task duration"
# 2. Review ganttValidation.ts and BryntumGanttWrapper.tsx
# 3. Check manuallyScheduled flag handling
# 4. Fix with awareness of Bryntum's auto-calculation behavior
```

### Add Toolbar Control
```
/gantt add an undo/redo button to the toolbar
# 1. Context7: query "Gantt undo redo STM"
# 2. Review GanttToolbar.tsx and useGanttControls.ts
# 3. Implement following existing toolbar pattern
```

### Debug Ably Real-Time Sync
```
/gantt remote changes aren't showing up for other users --feature sync
# 1. Check broadcastGanttChanges is called in sync/route.ts
# 2. Check useGanttRealtime hook is enabled (projectId + userId present)
# 3. Verify isApplyingRemoteRef flag isn't stuck true
# 4. Check Ably auth token has correct channel capability
```

### Add Real-Time Feature
```
/gantt show which task another user is currently editing
# 1. Review useGanttRealtime.ts presence data structure
# 2. Update presence data with selected task on click
# 3. Add editing indicator to task rows via GanttPresence
```

## Boundaries

**Will:**
- Always fetch Bryntum docs via Context7 before making changes
- Follow the existing bryntum/ directory structure
- Maintain optimistic locking and version injection patterns
- Validate against known Bryntum pitfalls

**Will Not:**
- Make Gantt changes without consulting Bryntum documentation
- Add Gantt logic outside the `src/components/bryntum/` directory
- Bypass the version/conflict resolution system
- Assume Bryntum behavior without doc verification
