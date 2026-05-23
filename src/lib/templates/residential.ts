/**
 * Residential single-family construction template.
 *
 * Shared between the server (seeds GanttTask rows on project create) and the
 * client (renders a read-only preview before the user commits). Keep this file
 * data-only — no Prisma imports, no DB calls — so it can be bundled to either
 * side without dragging server code into the client bundle.
 */

export interface ResidentialTemplateTask {
  /** Stable key used to reference this task as a parent of others. */
  key: string;
  /** Display name. */
  name: string;
  /** Key of the parent task, if this is a child. */
  parentKey?: string;
  /** Duration in days. Leaf tasks only. */
  duration?: number;
  /** Days from project start to this task's start. Leaf tasks only. */
  startOffsetDays?: number;
  /** CSI MasterFormat Level-3 code, e.g. "03 30 00". */
  csiCode?: string;
  expanded?: boolean;
  orderIndex?: number;
}

// Phase offsets in days from project start (single-family residential, ~125-day build).
// Each phase is laid out sequentially; consumers can shift dates after creation.
const PHASE_SITE = 0; // 10 days
const PHASE_FOUNDATION = 10; // 20 days
const PHASE_FRAMING = 30; // 27 days
const PHASE_MEP = 55; // 22 days
const PHASE_FINISHES = 75; // 35 days
const PHASE_CLOSEOUT = 110; // 15 days

export const RESIDENTIAL_TASKS: ResidentialTemplateTask[] = [
  // Phase 1 — Site Preparation
  { key: "phase-site", name: "1. Site preparation", csiCode: "31 22 00", expanded: true, orderIndex: 10 },
  { key: "site-survey", parentKey: "phase-site", name: "Site survey & layout",
    csiCode: "31 22 00", duration: 2, startOffsetDays: PHASE_SITE + 0, orderIndex: 11 },
  { key: "site-clearing", parentKey: "phase-site", name: "Clearing & grubbing",
    csiCode: "31 11 00", duration: 3, startOffsetDays: PHASE_SITE + 2, orderIndex: 12 },
  { key: "site-utilities", parentKey: "phase-site", name: "Temporary utilities & site access",
    csiCode: "01 50 00", duration: 2, startOffsetDays: PHASE_SITE + 3, orderIndex: 13 },
  { key: "site-erosion", parentKey: "phase-site", name: "Erosion & sediment control",
    csiCode: "31 25 00", duration: 2, startOffsetDays: PHASE_SITE + 5, orderIndex: 14 },
  { key: "site-excavation", parentKey: "phase-site", name: "Excavation",
    csiCode: "31 23 00", duration: 5, startOffsetDays: PHASE_SITE + 5, orderIndex: 15 },

  // Phase 2 — Foundation
  { key: "phase-foundation", name: "2. Foundation", csiCode: "03 30 00", expanded: true, orderIndex: 20 },
  { key: "fnd-footings", parentKey: "phase-foundation", name: "Footings",
    csiCode: "03 31 00", duration: 4, startOffsetDays: PHASE_FOUNDATION + 0, orderIndex: 21 },
  { key: "fnd-walls", parentKey: "phase-foundation", name: "Foundation walls",
    csiCode: "03 30 00", duration: 6, startOffsetDays: PHASE_FOUNDATION + 4, orderIndex: 22 },
  { key: "fnd-waterproofing", parentKey: "phase-foundation", name: "Waterproofing & drainage",
    csiCode: "07 10 00", duration: 3, startOffsetDays: PHASE_FOUNDATION + 10, orderIndex: 23 },
  { key: "fnd-slab", parentKey: "phase-foundation", name: "Slab on grade",
    csiCode: "03 30 00", duration: 4, startOffsetDays: PHASE_FOUNDATION + 13, orderIndex: 24 },
  { key: "fnd-inspection", parentKey: "phase-foundation", name: "Foundation inspection",
    csiCode: "01 45 00", duration: 1, startOffsetDays: PHASE_FOUNDATION + 17, orderIndex: 25 },

  // Phase 3 — Framing
  { key: "phase-framing", name: "3. Framing & weather seal", csiCode: "06 11 00", expanded: true, orderIndex: 30 },
  { key: "frm-floor", parentKey: "phase-framing", name: "Floor framing",
    csiCode: "06 11 00", duration: 4, startOffsetDays: PHASE_FRAMING + 0, orderIndex: 31 },
  { key: "frm-walls", parentKey: "phase-framing", name: "Wall framing",
    csiCode: "06 11 00", duration: 6, startOffsetDays: PHASE_FRAMING + 4, orderIndex: 32 },
  { key: "frm-roof", parentKey: "phase-framing", name: "Roof framing",
    csiCode: "06 11 00", duration: 5, startOffsetDays: PHASE_FRAMING + 10, orderIndex: 33 },
  { key: "frm-sheathing", parentKey: "phase-framing", name: "Sheathing",
    csiCode: "06 16 00", duration: 3, startOffsetDays: PHASE_FRAMING + 12, orderIndex: 34 },
  { key: "frm-roofing", parentKey: "phase-framing", name: "Roofing & flashing",
    csiCode: "07 31 00", duration: 4, startOffsetDays: PHASE_FRAMING + 15, orderIndex: 35 },
  { key: "frm-windows", parentKey: "phase-framing", name: "Windows & exterior doors",
    csiCode: "08 50 00", duration: 3, startOffsetDays: PHASE_FRAMING + 18, orderIndex: 36 },
  { key: "frm-inspection", parentKey: "phase-framing", name: "Framing inspection",
    csiCode: "01 45 00", duration: 1, startOffsetDays: PHASE_FRAMING + 21, orderIndex: 37 },

  // Phase 4 — MEP Rough-in
  { key: "phase-mep", name: "4. MEP rough-in", csiCode: "23 30 00", expanded: true, orderIndex: 40 },
  { key: "mep-plumbing", parentKey: "phase-mep", name: "Plumbing rough-in",
    csiCode: "22 11 00", duration: 6, startOffsetDays: PHASE_MEP + 0, orderIndex: 41 },
  { key: "mep-hvac", parentKey: "phase-mep", name: "HVAC rough-in",
    csiCode: "23 30 00", duration: 6, startOffsetDays: PHASE_MEP + 2, orderIndex: 42 },
  { key: "mep-electrical", parentKey: "phase-mep", name: "Electrical rough-in",
    csiCode: "26 05 00", duration: 6, startOffsetDays: PHASE_MEP + 4, orderIndex: 43 },
  { key: "mep-inspection", parentKey: "phase-mep", name: "MEP rough-in inspections",
    csiCode: "01 45 00", duration: 1, startOffsetDays: PHASE_MEP + 12, orderIndex: 44 },
  { key: "mep-insulation", parentKey: "phase-mep", name: "Insulation",
    csiCode: "07 21 00", duration: 4, startOffsetDays: PHASE_MEP + 13, orderIndex: 45 },

  // Phase 5 — Finishes
  { key: "phase-finishes", name: "5. Interior finishes", csiCode: "09 21 00", expanded: true, orderIndex: 50 },
  { key: "fin-drywall", parentKey: "phase-finishes", name: "Drywall hang & finish",
    csiCode: "09 21 00", duration: 8, startOffsetDays: PHASE_FINISHES + 0, orderIndex: 51 },
  { key: "fin-paint-interior", parentKey: "phase-finishes", name: "Interior painting",
    csiCode: "09 91 00", duration: 5, startOffsetDays: PHASE_FINISHES + 8, orderIndex: 52 },
  { key: "fin-cabinetry", parentKey: "phase-finishes", name: "Cabinetry & millwork",
    csiCode: "06 41 00", duration: 5, startOffsetDays: PHASE_FINISHES + 12, orderIndex: 53 },
  { key: "fin-flooring", parentKey: "phase-finishes", name: "Flooring",
    csiCode: "09 60 00", duration: 6, startOffsetDays: PHASE_FINISHES + 16, orderIndex: 54 },
  { key: "fin-doors-trim", parentKey: "phase-finishes", name: "Interior doors & trim",
    csiCode: "06 22 00", duration: 4, startOffsetDays: PHASE_FINISHES + 20, orderIndex: 55 },
  { key: "fin-plumb-fixtures", parentKey: "phase-finishes", name: "Plumbing fixtures",
    csiCode: "22 40 00", duration: 3, startOffsetDays: PHASE_FINISHES + 24, orderIndex: 56 },
  { key: "fin-elec-trim", parentKey: "phase-finishes", name: "Electrical trim & fixtures",
    csiCode: "26 05 00", duration: 3, startOffsetDays: PHASE_FINISHES + 25, orderIndex: 57 },
  { key: "fin-hvac-trim", parentKey: "phase-finishes", name: "HVAC trim & commissioning",
    csiCode: "23 30 00", duration: 3, startOffsetDays: PHASE_FINISHES + 27, orderIndex: 58 },

  // Phase 6 — Exterior & Closeout
  { key: "phase-closeout", name: "6. Exterior & closeout", csiCode: "01 77 00", expanded: true, orderIndex: 60 },
  { key: "close-siding", parentKey: "phase-closeout", name: "Exterior siding & paint",
    csiCode: "09 91 00", duration: 6, startOffsetDays: PHASE_CLOSEOUT + 0, orderIndex: 61 },
  { key: "close-paving", parentKey: "phase-closeout", name: "Driveway & walkways",
    csiCode: "32 10 00", duration: 3, startOffsetDays: PHASE_CLOSEOUT + 3, orderIndex: 62 },
  { key: "close-landscaping", parentKey: "phase-closeout", name: "Landscaping & planting",
    csiCode: "32 90 00", duration: 4, startOffsetDays: PHASE_CLOSEOUT + 6, orderIndex: 63 },
  { key: "close-final-inspect", parentKey: "phase-closeout", name: "Final inspection (CO)",
    csiCode: "01 45 00", duration: 1, startOffsetDays: PHASE_CLOSEOUT + 10, orderIndex: 64 },
  { key: "close-punch", parentKey: "phase-closeout", name: "Punch list",
    csiCode: "01 77 00", duration: 3, startOffsetDays: PHASE_CLOSEOUT + 11, orderIndex: 65 },
  { key: "close-clean", parentKey: "phase-closeout", name: "Final cleaning & handover",
    csiCode: "01 74 00", duration: 2, startOffsetDays: PHASE_CLOSEOUT + 13, orderIndex: 66 },
];

/** Total leaf-task count (excludes phase parents). */
export const RESIDENTIAL_LEAF_COUNT = RESIDENTIAL_TASKS.filter(
  (t) => t.parentKey !== undefined
).length;

/** Total task count including phase parents. */
export const RESIDENTIAL_TOTAL_COUNT = RESIDENTIAL_TASKS.length;
