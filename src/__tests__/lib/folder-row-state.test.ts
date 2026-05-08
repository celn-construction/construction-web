import { describe, it, expect } from "vitest";

/**
 * The four states ManageChipRow renders are derived from a tiny pure function.
 * We extract that resolution here to lock its contract independent of MUI/JSX.
 * Mirror this in the component if you change the rules.
 */
type State = "not-set-up" | "in-progress" | "pending-review" | "complete";

function resolveFolderState(args: {
  required: number | null;
  approved: number;
  pending: number;
}): State {
  const total = args.required ?? 0;
  if (total === 0) return "not-set-up";
  if (args.approved >= total) return "complete";
  if (args.pending > 0) return "pending-review";
  return "in-progress";
}

describe("resolveFolderState", () => {
  it("returns 'not-set-up' when required is null", () => {
    expect(resolveFolderState({ required: null, approved: 0, pending: 0 })).toBe("not-set-up");
  });

  it("returns 'not-set-up' when required is 0", () => {
    expect(resolveFolderState({ required: 0, approved: 0, pending: 0 })).toBe("not-set-up");
  });

  it("returns 'in-progress' when nothing has been uploaded yet", () => {
    expect(resolveFolderState({ required: 3, approved: 0, pending: 0 })).toBe("in-progress");
  });

  it("returns 'pending-review' when uploads are awaiting approval", () => {
    expect(resolveFolderState({ required: 3, approved: 0, pending: 2 })).toBe("pending-review");
  });

  it("returns 'pending-review' when some are approved and some pending", () => {
    expect(resolveFolderState({ required: 3, approved: 1, pending: 1 })).toBe("pending-review");
  });

  it("returns 'complete' only when approved meets the requirement", () => {
    expect(resolveFolderState({ required: 3, approved: 3, pending: 0 })).toBe("complete");
  });

  it("treats over-approval as still complete (defensive)", () => {
    expect(resolveFolderState({ required: 3, approved: 4, pending: 0 })).toBe("complete");
  });

  it("complete wins over pending when approved already meets the requirement", () => {
    // Edge case: someone uploads an extra doc beyond the required count and it's pending review.
    // We don't surface "pending review" once the requirement is satisfied — the work is done.
    expect(resolveFolderState({ required: 3, approved: 3, pending: 1 })).toBe("complete");
  });
});
