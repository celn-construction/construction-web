# CSI MasterFormat Codes

## Overview

The Gantt chart task popover includes a CSI (Construction Specifications Institute) code selector that allows assigning MasterFormat classification codes to tasks. This enables standardized categorization using the industry-standard MasterFormat 2018 numbering system.

## Data Source

The CSI code list is stored as a static JSON file at `src/lib/constants/csiCodes.json` as a **flat** list (`[{ code, name, subdivisions: [{ code, name }] }]`). The flat list is the source of truth; the three-tier hierarchy shown in the picker is **derived in code** at module init (see "Three-tier hierarchy" below).

**Statistics**: 35 active divisions, 1,482 section codes (all `XX XX 00` format). Those 1,482 codes split into two outline tiers: **373 Level-2 broad headings** (e.g. `03 30 00 Cast-in-Place Concrete`) and **1,074 Level-3 details** (e.g. `03 31 00 Structural Concrete`), plus the 35 `XX 00 00` division-title rows.

### Three-tier hierarchy (derived)

MasterFormat is an outline: Division → Level-2 broad heading → Level-3 detail. The flat JSON encodes only codes, so the parent/child tree is reconstructed deterministically from the second digit-pair `YY` of each `XX YY 00` code (`csiCodes.ts` → `buildTree()`):

| `YY` pattern | Tier | Placement |
|---|---|---|
| `00` (`03 00 00`) | Division title | selectable Level-2 leaf under its division |
| `01`–`09` or ends in `0` (`03 30 00`) | Level-2 broad heading | directly under the division |
| anything else (`03 31 00`) | Level-3 detail | nests under heading `XX <Y>0 00` |

Codes are sorted before grouping, so a heading always precedes its children. A Level-3 code whose computed parent heading is absent (9 such codes — 8 in Division 00, 1 in Division 33, e.g. `00 31 00`, `33 92 00`) is **promoted to a Level-2 leaf under its division** so nothing is dropped. The invariant "the tree contains exactly the flat code set, none lost or invented" is locked by `src/__tests__/constants/csiCodes.test.ts`.

### Where the data came from

The code list was compiled from multiple authoritative sources and cross-validated against the official MasterFormat 2018 Edition:

| Source | What it provided | URL |
|--------|-----------------|-----|
| AGC Austin MasterFormat 2018 PDF | Primary source: 1,433 Level 3 codes with titles. Used for final validation — our JSON is a superset of this document with zero gaps. | `agcaustin.org/uploads/.../masterformat_2018_web.pdf` |
| pdfcoffee.com CSI 2018 Edition | Detailed Level 3 codes for Divisions 00-14 with full subdivision breakdowns | `pdfcoffee.com/csi-master-format-divisions-amp-titles-2018-edition-pdf-free.html` |
| DesignGuide CSI MasterFormat Index | Level 2 codes for all 35 divisions | `designguide.com/csi-masterformat-index` |
| Original project data | 799 codes from initial implementation, preserved as baseline | Internal |

### Validation

The final JSON was validated against the AGC Austin PDF (official MasterFormat 2018):
- **0 codes missing** from the official PDF source
- **49 extra codes** in our file that the PDF didn't include (valid codes from other MasterFormat references, e.g., `02 85 00 Mold Remediation`, `33 20 00 Wells`)
- All codes match `XX XX 00` format
- All subdivision codes fall within their parent division
- No duplicate codes

### What's NOT included

- **Reserved divisions**: 15-20, 24, 29-30, 36-39, 47, 49 (unassigned in MasterFormat 2018)
- **Level-4 detail codes**: the deeper tier below Level-3 (`XX XX XX` where the **last** pair != 00, e.g. `03 31 13 Heavyweight Structural Concrete`) is not included. These are rarely used in construction PM tools and would add ~10,000+ entries. The three tiers we render (Division → Level-2 → Level-3) all live in the `XX XX 00` codes already present.

## Architecture

### Key files

| File | Purpose |
|------|---------|
| `src/lib/constants/csiCodes.json` | Raw **flat** data: `[{ code, name, subdivisions: [{ code, name }] }]` |
| `src/lib/constants/csiCodes.ts` | TypeScript layer: exports `CSI_TREE` (derived 3-tier hierarchy, types `CsiDivisionTree`/`CsiGroup`/`CsiSection`), `CSI_DIVISIONS`, `CSI_DIVISION_MAP`, `CSI_SUBDIVISION_MAP`, `formatCsiCode()`. Lookup maps are built straight from the flat JSON so validation/display never depend on the grouping logic. |
| `src/components/bryntum/components/task-popover/TaskHeader.tsx` | Inline CSI chip in the popover meta row (code + truncated name when set, dashed "+ CSI code" when empty); calls `onOpenCsiPanel` to open the panel |
| `src/components/bryntum/components/task-popover/CsiCodePanel.tsx` | Slide-in panel: 3-tier accordion (Division → Level-2 heading → Level-3 detail) with search, optimistic updates, code selection. Level-2 headings are both selectable and expandable; Level-3 details are selectable leaves. The current-selection **banner** also hosts the per-(project, code) spec document (upload/open/remove). |
| `src/lib/validations/gantt.ts` | Zod `.refine()` validation for `csiCode` on the shared `gantt.sync` task schema |
| `src/server/api/routers/csiSpec.ts` + `src/lib/validations/csiSpec.ts` | tRPC router (`getForCode` / `attach` / `detach`) and Zod schemas for the per-(project, code) spec document. See "Spec document attachment" below. |

### Data flow

1. **Static JSON** loaded at module init; TypeScript builds the O(1) lookup Maps (from the flat list) and the `CSI_TREE` 3-tier hierarchy (via `buildTree()`), all once at module load
2. **Trigger**: `TaskHeader` renders an inline CSI chip; clicking it calls `onOpenCsiPanel` to open the `CsiCodePanel` slide-in panel
3. **Selection**: `CsiCodePanel` reads from `CSI_TREE`, filters client-side across all three tiers, and shows a 3-tier accordion (division → Level-2 heading → Level-3 detail). Selecting either a heading or a detail saves; the division/group containing the current code auto-expands on open
4. **Save**: User selects code -> optimistic update -> panel writes `record.csiCode = next` on the Bryntum task record -> Bryntum's `autoSync` flushes the change to `gantt.sync`, where the shared task Zod schema validates the code against `CSI_SUBDIVISION_MAP` / `CSI_DIVISION_MAP` and persists to `GanttTask.csiCode` (last-write-wins)
5. **Display**: `formatCsiCode(code)` resolves `"03 30 00"` -> `"03 30 00 - Cast-in-Place Concrete"`

### Spec document attachment (per project + CSI code)

The CSI panel's current-selection banner lets a user attach **one spec document per
`(projectId, csiCode)`**, shared by every task in the project carrying that code. Clicking the
attached document opens it in the popover's in-app `DocumentPreviewDialog`.

- **Model**: `CsiSpecDocument` (mapping table) — `@@unique([projectId, csiCode])` and a unique
  `documentId`. The linked row is a **real `Document`** (shows in the Document Explorer + AI
  search); deleting it from the Explorer cascades the link away.
- **Upload**: reuses `POST /api/upload` (file + `projectId` → unassigned `Document` with blob +
  AI tags + embedding) via `trackUpload` (global upload chip). The returned `documentId` is
  then linked with `csiSpec.attach`. Gated on `canManageProjects` (client `canManage` prop +
  server check).
- **Tree indicators**: `csiSpec.listForProject` returns every code in the project that has a
  doc; the picker shows a paperclip on each such code (group/section) and a roll-up paperclip
  on **collapsed** division/group rows whose branch contains one (so docs are discoverable
  without expanding all 35 divisions). Roll-ups are computed from the **tree structure**
  (`docRollup`: a division rolls up if any of its codes has a doc; a group only if one of its
  own `sections` does) — **never from code prefixes**, since orphan Level-2 leaves (e.g.
  `00 51/52/54/55 00`) share a `slice(0,4)` prefix and a prefix check would falsely flag the
  siblings. While a code is attaching, its indicator flickers and shows a spinner. `attach`/
  `detach` invalidate this list too.
- **Loading state**: while adding or removing, the banner shows a spinner row ("Attaching
  document…" / "Removing document…"). Busy state is tracked **per CSI code** (`pendingByCode`
  map) and operations capture their target code, so switching codes mid-upload never bleeds the
  spinner onto the wrong code and `attach`/`detach` always invalidate the code they targeted.
  The viewed code's spinner clears only once its refetched `getForCode` settles (no pre-change
  flash); codes switched away from clear in the mutation callbacks.
- **Freshness**: both `getForCode` and `listForProject` use `staleTime: 0` +
  `refetchOnMount: 'always'`, overriding the global 30s `staleTime` (`src/trpc/query-client.ts`).
  Without this, the banner could show a stale "no document" for a code that actually has one
  (cache held a `null` fetched before the doc was attached).
- **Replace is non-destructive**: `attach` deletes the prior `(projectId, csiCode)` link (and
  any prior link for the new document) inside a transaction, then creates the new link; the
  previously linked `Document` remains in the Explorer as unassigned.
- **Read/open**: `csiSpec.getForCode` returns the linked doc shaped as a `PreviewDoc` (blobUrl
  rewritten via `documentProxyUrl`); the banner opens it through the popover's `openPreview`,
  which shows the file in `DocumentPreviewDialog` (a centered popup — images inline, PDFs in an
  iframe via the same-origin blob proxy). Viewing is open to any project member (the
  `/api/blob/[documentId]` proxy enforces tenancy); `detach` (manager-only) unlinks but keeps
  the document.

### Why static JSON (not database)

- MasterFormat updates every ~6 years (last: 2018). Near-zero change frequency.
- All tenants use the same standard codes. No per-org customization needed.
- Client-side search on ~1,500 items is sub-millisecond. No server query needed.
- Bundle impact: ~134KB raw, ~16KB gzipped, only loaded on Gantt page.
- Zero infrastructure: no table, no seeding, no caching layer, no admin UI.

Move to a database table only if: tenants need custom code lists, you need usage analytics, or the list changes frequently.

### Performance optimizations

| Optimization | Where | What it prevents |
|------|-------|-----------------|
| **Tree built once** | `csiCodes.ts` — `CSI_TREE` via `buildTree()` at module init | Re-deriving the 3-tier hierarchy on every render/keystroke |
| **Pre-lowercased names** | `csiCodes.ts` — `nameLower` on divisions, Level-2 groups, and Level-3 sections | 1,482 `.toLowerCase()` string allocations per keystroke during search |
| **`useMemo` filtering** | `CsiCodePanel.tsx` — `displayDivisions` keyed on `query` | Full tree walk + filter recomputation on unrelated state changes (expand toggle, optimistic code) |
| **`React.memo` SectionItem** | `CsiCodePanel.tsx` — extracted memoized Level-3 row | Re-rendering every visible row when only one item's `isSelected` changes |
| **Stable `useCallback`** | `CsiCodePanel.tsx` — `handleSelect`, `toggleGroup` | New closure per row per render (breaks `React.memo`) |
| **Collapsed-by-default accordion** | `CsiCodePanel.tsx` — only the expanded division's groups and expanded groups' sections render | Mounting all 1,482 rows at once when not searching |
| **Search result caps** | `CsiCodePanel.tsx` — `MAX_GROUPS_PER_DIV` (25), `MAX_SECTIONS_PER_GROUP` (12) | Rendering hundreds of rows during broad searches (search force-expands the tree) |
| **O(1) lookup Maps** | `csiCodes.ts` — `CSI_DIVISION_MAP`, `CSI_SUBDIVISION_MAP` | Linear scans for code display and validation |

**Not needed at this scale** (1,482 items): debouncing (filtering is sub-ms), virtualization (accordion caps visible items), Web Workers (serialization overhead exceeds compute), dynamic imports (15KB gzipped is noise).

## Updating the code list

If MasterFormat releases a new edition:

1. Source the new Level 3 list from CSI official sources or ARCAT
2. Replace `src/lib/constants/csiCodes.json` (same schema)
3. Validate: all existing stored codes should still be present (superset guarantee)
4. Run `npx tsc --noEmit` and `npx vitest run src/__tests__/constants/csiCodes.test.ts` to verify — no code changes needed. The test asserts the derived `CSI_TREE` still contains exactly the flat code set (no codes lost or invented) and that nesting/orphan handling hold.
5. The Zod `.refine()` validation in `src/lib/validations/gantt.ts` and the `CSI_TREE` hierarchy both auto-update since they derive from the same JSON

If existing codes are removed in the new edition, `formatCsiCode()` gracefully falls back to returning the raw code string (no crash).
