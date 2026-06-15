import { describe, it, expect } from "vitest";
import {
  CSI_TREE,
  CSI_SUBDIVISION_MAP,
  CSI_DIVISION_MAP,
  formatCsiCode,
} from "@/lib/constants/csiCodes";

// Every selectable code in the tree: Level-2 group headings + their Level-3
// section children.
function treeLeafCodes(): string[] {
  const codes: string[] = [];
  for (const div of CSI_TREE) {
    for (const group of div.groups) {
      codes.push(group.code);
      for (const section of group.sections) codes.push(section.code);
    }
  }
  return codes;
}

describe("CSI_TREE — derived 3-tier hierarchy", () => {
  it("preserves every flat code, with none invented or duplicated", () => {
    const leaves = treeLeafCodes();
    const leafSet = new Set(leaves);

    // No duplicates introduced by grouping.
    expect(leafSet.size).toBe(leaves.length);

    // Exactly the flat set of subdivision codes — nothing lost, nothing added.
    expect(leafSet.size).toBe(CSI_SUBDIVISION_MAP.size);
    for (const code of CSI_SUBDIVISION_MAP.keys()) {
      expect(leafSet.has(code)).toBe(true);
    }
  });

  it("has 35 divisions matching the flat division map", () => {
    expect(CSI_TREE.length).toBe(35);
    expect(CSI_TREE.length).toBe(CSI_DIVISION_MAP.size);
  });

  it("nests Level-3 details under their Level-2 heading (03 30 00)", () => {
    const div03 = CSI_TREE.find((d) => d.code === "03");
    expect(div03).toBeDefined();
    const castInPlace = div03!.groups.find((g) => g.code === "03 30 00");
    expect(castInPlace).toBeDefined();
    const childCodes = castInPlace!.sections.map((s) => s.code);
    // Known Level-3 children of Cast-in-Place Concrete.
    expect(childCodes).toContain("03 31 00");
    expect(childCodes).toContain("03 33 00");
    expect(childCodes).toContain("03 35 00");
    // Every section's second-pair shares the heading's first digit ("3").
    for (const s of castInPlace!.sections) {
      expect(s.code.split(" ")[1]![0]).toBe("3");
    }
  });

  it("places orphan Level-3 codes directly under their division (none dropped)", () => {
    // These have no Level-2 parent heading in the data and must be promoted to
    // Level-2 leaves under their own division.
    const orphans = ["00 31 00", "00 51 00", "33 92 00"];
    for (const code of orphans) {
      const divCode = code.split(" ")[0]!;
      const div = CSI_TREE.find((d) => d.code === divCode);
      expect(div).toBeDefined();
      const asGroup = div!.groups.find((g) => g.code === code);
      expect(asGroup).toBeDefined();
      expect(asGroup!.sections.length).toBe(0);
    }
  });

  it("every Level-3 section's parent heading shares its XX <Y> prefix", () => {
    for (const div of CSI_TREE) {
      for (const group of div.groups) {
        for (const section of group.sections) {
          // group "03 30 00" -> prefix "03 3"; section "03 31 00" starts with it.
          const prefix = group.code.slice(0, 4);
          expect(section.code.startsWith(prefix)).toBe(true);
        }
      }
    }
  });
});

describe("flat lookups remain intact", () => {
  it("resolves Level-2 and Level-3 codes via formatCsiCode", () => {
    expect(formatCsiCode("03 30 00")).toBe("03 30 00 - Cast-in-Place Concrete");
    expect(CSI_SUBDIVISION_MAP.has("03 31 00")).toBe(true);
    expect(formatCsiCode("99 99 99")).toBe("99 99 99"); // unknown → raw code
  });
});
