import { describe, it, expect } from "vitest";
import { updateProjectSchema } from "@/lib/validations/project";

describe("updateProjectSchema", () => {
  // Regression: this schema is the `.input()` of a `projectProcedure`, which
  // separately injects `{ projectId }`. tRPC parses each input against the full
  // raw input, so a `.strict()` schema here rejects `projectId` with
  // "Unrecognized key(s): 'projectId'" and every project.update call fails.
  it("does not reject the procedure-injected projectId (must NOT be .strict())", () => {
    const result = updateProjectSchema.safeParse({ name: "Tower", projectId: "abc123" });
    expect(result.success).toBe(true);
  });

  it("accepts a yyyy-MM-dd startDate and treats empty/null as a clear", () => {
    expect(updateProjectSchema.safeParse({ startDate: "2026-05-01" }).success).toBe(true);
    expect(updateProjectSchema.safeParse({ startDate: "" }).success).toBe(true);
    expect(updateProjectSchema.safeParse({ startDate: null }).success).toBe(true);
  });

  it("rejects an unparseable startDate", () => {
    expect(updateProjectSchema.safeParse({ startDate: "not-a-date" }).success).toBe(false);
  });
});
