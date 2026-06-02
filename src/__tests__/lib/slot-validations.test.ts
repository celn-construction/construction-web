import { describe, it, expect } from "vitest";
import {
  setSlotCountSchema,
  updateSlotSchema,
  saveSlotsSchema,
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
});

describe("saveSlotsSchema", () => {
  const valid = {
    taskId: "t1",
    kind: "submittal",
    slots: [
      { id: "s1", name: "Shop Drawing", dueDate: "2026-05-12" },
      { id: null, name: "Product Data", dueDate: null },
    ],
  } as const;

  it("accepts a mix of existing (id) and new (id: null) slots", () => {
    const result = saveSlotsSchema.parse(valid);
    expect(result.slots).toHaveLength(2);
    expect(result.slots[0]!.id).toBe("s1");
    expect(result.slots[1]!.id).toBeNull();
  });

  it("accepts an empty list (clears all requirements)", () => {
    expect(saveSlotsSchema.parse({ taskId: "t1", kind: "submittal", slots: [] }).slots).toEqual([]);
  });

  it("trims slot names", () => {
    const result = saveSlotsSchema.parse({
      taskId: "t1",
      kind: "submittal",
      slots: [{ id: null, name: "  Cert  ", dueDate: null }],
    });
    expect(result.slots[0]!.name).toBe("Cert");
  });

  it("rejects more than 50 slots", () => {
    const slots = Array.from({ length: 51 }, () => ({ id: null, name: null, dueDate: null }));
    expect(() => saveSlotsSchema.parse({ taskId: "t1", kind: "submittal", slots })).toThrow();
  });

  it("rejects an invalid kind", () => {
    expect(() => saveSlotsSchema.parse({ ...valid, kind: "rfi" })).toThrow();
  });
});
