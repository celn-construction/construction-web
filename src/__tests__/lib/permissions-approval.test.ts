import { describe, it, expect } from "vitest";
import {
  canApproveDocuments,
  canInviteMembers,
  canManageProjects,
  hasPermission,
} from "@/lib/permissions";

describe("canApproveDocuments", () => {
  it("returns true for owner", () => {
    expect(canApproveDocuments("owner")).toBe(true);
  });

  it("returns true for admin", () => {
    expect(canApproveDocuments("admin")).toBe(true);
  });

  it("returns false for member", () => {
    expect(canApproveDocuments("member")).toBe(false);
  });

  it("returns false for unknown roles", () => {
    expect(canApproveDocuments("invalid_role")).toBe(false);
    expect(canApproveDocuments("")).toBe(false);
  });
});

describe("hasPermission(APPROVE_DOCUMENTS)", () => {
  it.each([
    ["owner", true],
    ["admin", true],
    ["member", false],
  ])("role %s ⇒ %s", (role, expected) => {
    expect(hasPermission(role, "APPROVE_DOCUMENTS")).toBe(expected);
  });
});

describe("regression: existing helpers still gate correctly", () => {
  it("canInviteMembers stays scoped to owner/admin", () => {
    expect(canInviteMembers("owner")).toBe(true);
    expect(canInviteMembers("admin")).toBe(true);
    expect(canInviteMembers("member")).toBe(false);
  });

  it("canManageProjects matches the approver tier", () => {
    expect(canManageProjects("owner")).toBe(true);
    expect(canManageProjects("admin")).toBe(true);
    expect(canManageProjects("member")).toBe(false);
  });
});
