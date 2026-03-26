# CSI MasterFormat Codes

## Overview

The Gantt chart task popover includes a CSI (Construction Specifications Institute) code selector that allows assigning MasterFormat classification codes to tasks. This enables standardized categorization using the industry-standard MasterFormat 2018 numbering system.

## Data Source

The CSI code list is stored as a static JSON file at `src/lib/constants/csiCodes.json`.

**Statistics**: 35 active divisions, 1,482 Level 3 subdivisions (XX XX 00 format).

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
- **Level 4+ codes**: Sub-subdivisions (XX XX XX where last pair != 00) are not included. These are rarely used in construction PM tools and would add ~10,000+ entries.

## Architecture

### Key files

| File | Purpose |
|------|---------|
| `src/lib/constants/csiCodes.json` | Raw data: `[{ code, name, subdivisions: [{ code, name }] }]` |
| `src/lib/constants/csiCodes.ts` | TypeScript layer: exports `CSI_MASTERFORMAT`, `CSI_DIVISIONS`, `CSI_DIVISION_MAP`, `CSI_SUBDIVISION_MAP`, `formatCsiCode()` |
| `src/components/bryntum/components/CsiCodeSelector.tsx` | React UI: accordion menu with search, optimistic updates |
| `src/server/api/routers/gantt.ts` | tRPC mutation `updateCsiCode` with Zod `.refine()` validation |

### Data flow

1. **Static JSON** loaded at module init, TypeScript builds O(1) lookup Maps
2. **UI**: `CsiCodeSelector` reads from `CSI_MASTERFORMAT`, filters client-side, shows accordion by division
3. **Save**: User selects code -> optimistic update -> `gantt.updateCsiCode` mutation -> validates code exists in `CSI_SUBDIVISION_MAP` or `CSI_DIVISION_MAP` -> saves string to `GanttTask.csiCode`
4. **Display**: `formatCsiCode(code)` resolves `"03 30 00"` -> `"03 30 00 - Cast-in-Place Concrete"`

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
| **Pre-lowercased names** | `csiCodes.ts` — `nameLower` field on divisions and subdivisions | 1,482 `.toLowerCase()` string allocations per keystroke during search |
| **`useMemo` filtering** | `CsiCodeSelector.tsx` — `displayDivisions` keyed on `query` | Full `.map()` + `.filter()` recomputation on unrelated state changes (expand toggle, anchor, optimistic code) |
| **`React.memo` SubdivisionItem** | `CsiCodeSelector.tsx` — extracted memoized component | Re-rendering every visible MenuItem when only one item's `isSelected` changes |
| **Stable `useCallback`** | `CsiCodeSelector.tsx` — `handleSelectSubdivision` | New closure per subdivision per render (breaks `React.memo`) |
| **Search result cap (15/div)** | `CsiCodeSelector.tsx` — `displayDivisions` slice | Rendering 500+ MUI MenuItems during broad searches |
| **O(1) lookup Maps** | `csiCodes.ts` — `CSI_DIVISION_MAP`, `CSI_SUBDIVISION_MAP` | Linear scans for code display and validation |

**Not needed at this scale** (1,482 items): debouncing (filtering is sub-ms), virtualization (accordion caps visible items), Web Workers (serialization overhead exceeds compute), dynamic imports (15KB gzipped is noise).

## Updating the code list

If MasterFormat releases a new edition:

1. Source the new Level 3 list from CSI official sources or ARCAT
2. Replace `src/lib/constants/csiCodes.json` (same schema)
3. Validate: all existing stored codes should still be present (superset guarantee)
4. Run `npx tsc --noEmit` to verify — no code changes needed
5. The Zod `.refine()` validation in `gantt.ts` auto-updates since it reads from the Maps

If existing codes are removed in the new edition, `formatCsiCode()` gracefully falls back to returning the raw code string (no crash).
