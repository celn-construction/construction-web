import { describe, it, expect } from "vitest";
import {
  setSlotCountSchema,
  updateSlotSchema,
  slotKindSchema,
} from "@/lib/validations/gantt";

describe("slotKindSchema", () => {
  it("accepts submittal and inspection", () => {
    expect(slotKindSchema.parse("submittal")).toBe("submittal");
    expect(slotKindSchema.parse("inspection")).toBe("inspection");
  });
  it("rejects other kinds", () => {
    expect(() => slotKindSchema.parse("rfi")).toThrow();
  });
});

describe("setSlotCountSchema", () => {
  const valid = { taskId: "t1", kind: "submittal", count: 3 } as const;

  it("accepts valid input", () => {
    expect(setSlotCountSchema.parse(valid)).toEqual(valid);
  });

  it("clamps count to non-negative", () => {
    expect(() => setSlotCountSchema.parse({ ...valid, count: -1 })).toThrow();
  });

  it("clamps count to <= 50", () => {
    expect(() => setSlotCountSchema.parse({ ...valid, count: 51 })).toThrow();
  });

  it("requires integer count", () => {
    expect(() => setSlotCountSchema.parse({ ...valid, count: 2.5 })).toThrow();
  });
});

describe("updateSlotSchema", () => {
  it("accepts a name update", () => {
    const result = updateSlotSchema.parse({ slotId: "s1", name: "Shop Drawing" });
    expect(result.name).toBe("Shop Drawing");
  });

  it("accepts a null name (to clear it)", () => {
    expect(updateSlotSchema.parse({ slotId: "s1", name: null }).name).toBeNull();
  });

  it("trims whitespace from names", () => {
    expect(updateSlotSchema.parse({ slotId: "s1", name: "  Shop Drawing  " }).name).toBe(
      "Shop Drawing",
    );
  });

  it("rejects names longer than 200 chars", () => {
    expect(() =>
      updateSlotSchema.parse({ slotId: "s1", name: "a".repeat(201) }),
    ).toThrow();
  });

  it("accepts dueDate as ISO string", () => {
    const result = updateSlotSchema.parse({ slotId: "s1", dueDate: "2026-05-12" });
    expect(typeof result.dueDate).toBe("string");
  });

  it("accepts null dueDate to clear it", () => {
    expect(updateSlotSchema.parse({ slotId: "s1", dueDate: null }).dueDate).toBeNull();
  });

  it("accepts approverId as nullable string", () => {
    expect(updateSlotSchema.parse({ slotId: "s1", approverId: "u1" }).approverId).toBe("u1");
    expect(updateSlotSchema.parse({ slotId: "s1", approverId: null }).approverId).toBeNull();
  });
});
