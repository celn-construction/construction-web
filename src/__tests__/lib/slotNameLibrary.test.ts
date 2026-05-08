import { describe, it, expect } from "vitest";
import {
  SLOT_NAME_LIBRARY,
  nextSuggestedSlotName,
} from "@/lib/constants/slotNameLibrary";

describe("nextSuggestedSlotName", () => {
  it("returns the first library name when nothing is taken", () => {
    expect(nextSuggestedSlotName("submittal", [])).toBe(SLOT_NAME_LIBRARY.submittal[0]);
    expect(nextSuggestedSlotName("inspection", [])).toBe(SLOT_NAME_LIBRARY.inspection[0]);
  });

  it("skips names that are already taken (case-insensitive)", () => {
    const first = SLOT_NAME_LIBRARY.submittal[0]!;
    const second = SLOT_NAME_LIBRARY.submittal[1]!;
    expect(nextSuggestedSlotName("submittal", [first.toUpperCase()])).toBe(second);
  });

  it("ignores null entries when checking taken names", () => {
    expect(nextSuggestedSlotName("submittal", [null, null])).toBe(SLOT_NAME_LIBRARY.submittal[0]);
  });

  it("trims whitespace before comparing", () => {
    const first = SLOT_NAME_LIBRARY.submittal[0]!;
    expect(nextSuggestedSlotName("submittal", [`  ${first}  `])).toBe(SLOT_NAME_LIBRARY.submittal[1]);
  });

  it("returns null when every library name is taken", () => {
    const allSubmittals = [...SLOT_NAME_LIBRARY.submittal];
    expect(nextSuggestedSlotName("submittal", allSubmittals)).toBeNull();
  });

  it("treats submittals and inspections as separate libraries", () => {
    // Taking all submittal names should not affect inspection suggestions.
    const allSubmittals = [...SLOT_NAME_LIBRARY.submittal];
    expect(nextSuggestedSlotName("inspection", allSubmittals)).toBe(
      SLOT_NAME_LIBRARY.inspection[0],
    );
  });
});
