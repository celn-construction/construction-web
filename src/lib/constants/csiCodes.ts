import rawData from "./csiCodes.json";

export interface CsiDivision {
  code: string;
  name: string;
}

export interface CsiSubdivision {
  code: string; // e.g. "03 30 00"
  name: string; // e.g. "Cast-in-Place Concrete"
  nameLower: string; // pre-computed for search perf
}

// ─── Three-tier hierarchy (Division → Level-2 group → Level-3 section) ───
// A Level-3 detail code. Same shape as CsiSubdivision.
export type CsiSection = CsiSubdivision;

// A Level-2 broad heading (e.g. "03 30 00 Cast-in-Place Concrete") with its
// Level-3 detail children. Headings with no children render as a selectable
// leaf with an empty `sections` array.
export interface CsiGroup {
  code: string;
  name: string;
  nameLower: string; // pre-computed for search perf
  sections: CsiSection[];
}

export interface CsiDivisionTree {
  code: string;
  name: string;
  nameLower: string; // pre-computed for search perf
  groups: CsiGroup[];
}

// ─── Flat lookup maps (source of truth for validation + display) ─────────
// Built directly from the raw flat list so their contents never depend on the
// tree-grouping logic below. Every "XX XX 00" code is keyed by code.
export const CSI_DIVISIONS: CsiDivision[] = rawData.map(({ code, name }) => ({
  code,
  name,
}));

export const CSI_DIVISION_MAP = new Map<string, CsiDivision>();
export const CSI_SUBDIVISION_MAP = new Map<
  string,
  { subdivision: CsiSubdivision; division: CsiDivision }
>();

for (const div of rawData) {
  const division: CsiDivision = { code: div.code, name: div.name };
  CSI_DIVISION_MAP.set(div.code, division);
  for (const sub of div.subdivisions) {
    CSI_SUBDIVISION_MAP.set(sub.code, {
      subdivision: {
        code: sub.code,
        name: sub.name,
        nameLower: sub.name.toLowerCase(),
      },
      division,
    });
  }
}

// ─── Tree construction ──────────────────────────────────────────────────
// MasterFormat codes are "XX YY 00". The second pair `YY` determines the tier:
//   - "00"                     → division title  → selectable Level-2 leaf
//   - "01"–"09" or ends in 0   → Level-2 heading → sits under the division
//   - otherwise (11, 31, 33…)  → Level-3 detail  → nests under "XX <Y>0 00"
// A Level-3 code whose computed parent heading is absent is promoted to sit
// directly under its division (orphan handling) — nothing is dropped.
function isGroupPair(yy: string): boolean {
  return yy === "00" || yy[0] === "0" || yy[1] === "0";
}

function buildTree(): CsiDivisionTree[] {
  return rawData.map((div) => {
    const subs = [...div.subdivisions].sort((a, b) =>
      a.code.localeCompare(b.code),
    );
    const groups: CsiGroup[] = [];
    const byCode = new Map<string, CsiGroup>();

    const pushGroup = (code: string, name: string): CsiGroup => {
      const g: CsiGroup = {
        code,
        name,
        nameLower: name.toLowerCase(),
        sections: [],
      };
      groups.push(g);
      byCode.set(code, g);
      return g;
    };

    for (const sub of subs) {
      const yy = sub.code.split(" ")[1] ?? "00";
      if (isGroupPair(yy)) {
        pushGroup(sub.code, sub.name);
      } else {
        const parentCode = `${div.code} ${yy[0]}0 00`;
        const parent = byCode.get(parentCode);
        const section: CsiSection = {
          code: sub.code,
          name: sub.name,
          nameLower: sub.name.toLowerCase(),
        };
        if (parent) {
          parent.sections.push(section);
        } else {
          // Orphan: no parent heading in the data — promote to a Level-2 leaf.
          pushGroup(sub.code, sub.name);
        }
      }
    }

    return {
      code: div.code,
      name: div.name,
      nameLower: div.name.toLowerCase(),
      groups,
    };
  });
}

export const CSI_TREE: CsiDivisionTree[] = buildTree();

export function formatCsiCode(code: string): string {
  // Check subdivision first (more specific)
  const subEntry = CSI_SUBDIVISION_MAP.get(code);
  if (subEntry) return `${code} - ${subEntry.subdivision.name}`;
  // Fall back to division (backward compat for old 2-digit codes)
  const div = CSI_DIVISION_MAP.get(code);
  if (div) return `${code} - ${div.name}`;
  return code;
}
