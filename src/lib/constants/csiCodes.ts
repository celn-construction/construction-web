import rawData from "./csiCodes.json";

export interface CsiDivision {
  code: string;
  name: string;
}

export interface CsiSubdivision {
  code: string; // e.g. "03 30 00"
  name: string; // e.g. "Cast-in-Place Concrete"
}

export interface CsiDivisionWithSubs {
  code: string;
  name: string;
  subdivisions: CsiSubdivision[];
}

export const CSI_MASTERFORMAT: CsiDivisionWithSubs[] = rawData;

// Backward-compatible flat division list
export const CSI_DIVISIONS: CsiDivision[] = CSI_MASTERFORMAT.map(({ code, name }) => ({
  code,
  name,
}));

export const CSI_DIVISION_MAP = new Map(
  CSI_MASTERFORMAT.map((d) => [d.code, d]),
);

// Flat lookup: subdivision code -> { subdivision, division }
export const CSI_SUBDIVISION_MAP = new Map<
  string,
  { subdivision: CsiSubdivision; division: CsiDivisionWithSubs }
>();
for (const div of CSI_MASTERFORMAT) {
  for (const sub of div.subdivisions) {
    CSI_SUBDIVISION_MAP.set(sub.code, { subdivision: sub, division: div });
  }
}

export function formatCsiCode(code: string): string {
  // Check subdivision first (more specific)
  const subEntry = CSI_SUBDIVISION_MAP.get(code);
  if (subEntry) return `${code} - ${subEntry.subdivision.name}`;
  // Fall back to division (backward compat for old 2-digit codes)
  const div = CSI_DIVISION_MAP.get(code);
  if (div) return `${code} - ${div.name}`;
  return code;
}
