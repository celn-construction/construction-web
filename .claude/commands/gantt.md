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

### Documentation-First Rule (MANDATORY)
Before making ANY change to Gantt code, you MUST:
1. Query the Bryntum docs via Context7 for the specific API/feature you're touching
2. Compare the official pattern with our implementation
3. Check the upgrade guide if changing package versions

**Why this exists**: We spent an entire debugging session on a rendering issue that turned out to be a `@bryntum/gantt` (7.2.2) / `@bryntum/gantt-react` (7.1.2) version mismatch. The React wrapper calls internal APIs that change between minor versions — mismatched versions cause the timeline SubGrid to silently fail to render (grid rows show, but the entire right side is blank). The fix was simply installing matching versions. Always check docs first.

### Package Version Rule
`@bryntum/gantt` and `@bryntum/gantt-react` MUST always be the same version. After any `npm install` that touches Bryntum packages, verify both versions match:
```bash
grep '"version"' node_modules/@bryntum/gantt/package.json node_modules/@bryntum/gantt-react/package.json
```
A version mismatch causes the timeline to silently not render — no errors, no warnings, just a blank right panel.

### CSS Loading Rule
CSS is loaded dynamically via `useBryntumThemeAssets` from `/bryntum/stockholm-light.css` in `public/`. Do NOT add static `import '@bryntum/gantt/gantt.css'` or similar in component files — it creates duplicates that can cause style conflicts. The theme CSS files in `public/bryntum/` are copied from `node_modules/@bryntum/gantt/` and include both structural and theme styles.

### Common Bryntum Pitfalls
| Pitfall | Details |
|---------|---------|
| **Version mismatch between gantt and gantt-react** | `@bryntum/gantt` and `@bryntum/gantt-react` MUST be the exact same version. A mismatch causes the timeline SubGrid to silently fail — grid rows render but the entire right side (time axis headers + task bars) is blank. No errors in console. Fix: `npm install @bryntum/gantt@X.Y.Z @bryntum/gantt-react@X.Y.Z`. |
| **`delayCalculation: true`** | **NEVER use `delayCalculation: true`** in the project config. It prevents the scheduling engine from running properly — task bars never render (grid rows show but timeline is empty). The engine only kicks in after a sync (Save). Removing `delayCalculation` makes the engine calculate immediately on data load/task add, so task bars render instantly. |
| **`scrollTaskIntoView` and `scrollToDate` corrupt headers** | Both methods corrupt the time axis header virtual renderer — all date labels disappear after the scroll and never regenerate. Use `visibleDate` in the config to center the viewport on a date instead. If you must scroll programmatically, call `gantt.renderContents()` afterward, but be aware it can wipe grid cell content. |
| **`height: '100%'` required on WRAPPER_STYLE** | The Gantt wrapper container MUST use `height: '100%'`, not `flex: 1` with `minHeight: 0`. Bryntum's internal layout engine needs an explicit height constraint from its container to calculate how many rows to render. |
| **`overflow: 'clip'` on Gantt containers** | The Gantt content container and ProjectShell wrapper MUST use `overflow: 'clip'`, not `overflow: 'hidden'`. Bryntum's internal scroll synchronization works correctly with `clip` in this project. |
| **Always use ref-based `getGanttInstance`** | Use `ganttRef.current.instance` to get the Bryntum widget — NOT DOM queries like `document.querySelector('.b-gantt')`. DOM queries can return ghost/destroyed widgets. |
| **`reactStrictMode: false` is required** | Bryntum's React wrapper is a class component that cannot survive React 18's mount→unmount→remount cycle. Keep `reactStrictMode: false` in `next.config.js`. |
| **`toggleParentTasksOnClick` is deprecated in v7** | Use `features: { tree: { toggleTreeNode: false } }` instead. The old config triggers a deprecation warning. |
| **`detectCSSCompatibilityIssues: false`** | Set this in ganttConfig to suppress the "No Font Awesome fonts detected" warning. We use Phosphor icons, not Font Awesome. |
| Parent duration is read-only | Bryntum auto-calculates parent duration from children. Must set `manuallyScheduled: true` before editing. |
| Custom fields silently dropped | Must extend `TaskModel` with custom fields (see `VersionedTaskModel`). |
| `cellDblClick` fires before `beforeCellEditStart` | Use `cellDblClick` to modify record state before editor opens. |
| Duration column blocks parent editing internally | Bryntum checks `isParent` before `beforeCellEditStart` fires. |
| Stale data after tab-away | Project uses 60-second staleness threshold for reload. |
| Unscheduled tasks crash `scrollTaskIntoView` | Guard against `!record.startDate` before scrolling. |

### Critical Config Rules (Do NOT Change)
These settings were discovered through extensive debugging. Changing any of them will break task rendering:

```
Package versions:
  - @bryntum/gantt and @bryntum/gantt-react MUST match exactly

ganttConfig:
  - delayCalculation: MUST be absent (not false, just omitted)
  - detectCSSCompatibilityIssues: false (suppress Font Awesome warning)
  - features.tree.toggleTreeNode: false (replaces deprecated toggleParentTasksOnClick)
  - WRAPPER_STYLE.height: MUST be '100%' (not flex: 1)
  - GANTT_CONTENT_STYLE.overflow: MUST be 'clip' (not 'hidden')
  - ProjectShell outer Box overflow: MUST be 'clip' (not 'hidden')
  - No scrollTaskIntoView or scrollToDate calls (use visibleDate config instead)

CSS:
  - Load via useBryntumThemeAssets only (no static imports in components)
  - Theme files live in public/bryntum/ (copied from node_modules)

next.config.js:
  - reactStrictMode: MUST be false

useGanttControls:
  - getGanttInstance: MUST use ganttRef.current.instance (not DOM query)
```

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
