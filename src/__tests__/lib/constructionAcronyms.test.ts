import { describe, it, expect } from "vitest";
import {
  expandAcronyms,
  CONSTRUCTION_ACRONYMS,
} from "@/lib/constants/constructionAcronyms";

describe("expandAcronyms", () => {
  it("expands a single known acronym", () => {
    expect(expandAcronyms("RFI")).toBe("RFI request for information");
  });

  it("expands an acronym within a query", () => {
    expect(expandAcronyms("RFI inspection")).toBe(
      "RFI request for information inspection"
    );
  });

  it("expands multiple acronyms", () => {
    expect(expandAcronyms("MEP RFI")).toBe(
      "MEP mechanical electrical plumbing RFI request for information"
    );
  });

  it("leaves unknown words unchanged", () => {
    expect(expandAcronyms("drywall photos")).toBe("drywall photos");
  });

  it("does not expand acronyms inside compound tokens like CO2", () => {
    expect(expandAcronyms("CO2 emissions")).toBe("CO2 emissions");
  });

  it("does not expand lowercase versions", () => {
    expect(expandAcronyms("rfi inspection")).toBe("rfi inspection");
  });

  it("handles empty string", () => {
    expect(expandAcronyms("")).toBe("");
  });

  it("preserves the original acronym alongside the expansion", () => {
    const result = expandAcronyms("CO");
    expect(result).toContain("CO");
    expect(result).toContain("change order");
  });

  it("expands all defined acronyms correctly", () => {
    for (const [acronym, expansion] of Object.entries(
      CONSTRUCTION_ACRONYMS
    )) {
      const result = expandAcronyms(acronym);
      expect(result).toBe(`${acronym} ${expansion}`);
    }
  });

  it("handles extra whitespace between words", () => {
    expect(expandAcronyms("RFI  inspection")).toBe(
      "RFI request for information inspection"
    );
  });
});
