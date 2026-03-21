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
- `src/app/api/gantt/sync/route.ts` — Sync transport endpoint
- `src/lib/utils/gantt.ts` — Shared Gantt data helpers

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
| **`delayCalculation: true` + React double-mount** | **NEVER use `delayCalculation: true`** in the project config. React (Strict Mode, HMR, Suspense) can double-mount the `BryntumGantt` component — creating two widget instances. The first gets `commitAsync()` (triggering the deferred engine calculation) but is then destroyed. The second (visible) instance never gets its calculation, so: no task bars render, time axis headers break on scroll, and scroll sync between header and body fails. Removing `delayCalculation` makes the engine calculate immediately on data load, so both instances work regardless of which one React keeps. |
| `scrollTaskIntoView` breaks header rendering | After programmatic scrolling, call `gantt.renderContents()` to force the time axis header virtual renderer to regenerate cells for the new scroll position. Without this, the header cells stay at the old position while the body scrolls away. |
| Ghost Bryntum widgets from double-mount | React double-mount can leave a zero-sized ghost `.b-gantt` element in the DOM. The wrapper includes cleanup code that removes ghost widgets (0×0 elements) 200ms after mount. If you see rendering issues, check `document.querySelectorAll('.b-gantt').length` — it should be 1. |
| `overflow: clip` on Bryntum containers | Never use `overflow: clip` on elements containing Bryntum widgets. Unlike `overflow: hidden`, `clip` does not create a scroll container, which can break Bryntum's internal scroll synchronization. Use `overflow: hidden` instead. |
| Parent duration is read-only | Bryntum auto-calculates parent duration from children. Must set `manuallyScheduled: true` before editing. |
| Custom fields silently dropped | Must extend `TaskModel` with custom fields (see `VersionedTaskModel`). |
| `cellDblClick` fires before `beforeCellEditStart` | Use `cellDblClick` to modify record state before editor opens. |
| Duration column blocks parent editing internally | Bryntum checks `isParent` before `beforeCellEditStart` fires. |
| Stale data after tab-away | Project uses 60-second staleness threshold for reload. |
| Unscheduled tasks crash `scrollTaskIntoView` | Guard against `!record.startDate` before scrolling. |

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
