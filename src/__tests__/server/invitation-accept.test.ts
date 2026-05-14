// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock email module (the router imports it even though `accept` doesn't send mail)
vi.mock("@/lib/email", () => ({
  sendInvitationEmail: vi.fn(),
}));

// Mock the tRPC module so procedures become passthrough chains exposing `_handler`.
vi.mock("@/server/api/trpc", () => {
  const buildChain = () => {
    const chain: Record<string, unknown> = {
      input: (schema: unknown) => {
        chain._schema = schema;
        return chain;
      },
      query: (handler: unknown) => {
        chain._handler = handler;
        return chain;
      },
      mutation: (handler: unknown) => {
        chain._handler = handler;
        return chain;
      },
    };
    return chain;
  };
  return {
    createTRPCRouter: (routes: Record<string, unknown>) => routes,
    protectedProcedure: buildChain(),
    publicProcedure: buildChain(),
    projectProcedure: buildChain(),
  };
});

type Handler = (args: { ctx: ReturnType<typeof makeCtx>; input: { token: string } }) => Promise<unknown>;

const TOKEN = "valid-token";

function makeInvitation(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv-1",
    email: "invitee@example.com",
    token: TOKEN,
    role: "member",
    organizationId: "org-1",
    projectId: "proj-1",
    invitedById: "admin-1",
    status: "pending",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    organization: { id: "org-1", name: "Acme", slug: "acme" },
    project: { id: "proj-1", name: "Office Tower", slug: "office-tower" },
    ...overrides,
  };
}

type MockTx = {
  membership: { upsert: ReturnType<typeof vi.fn> };
  projectMember: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  invitation: { update: ReturnType<typeof vi.fn> };
  user: { update: ReturnType<typeof vi.fn> };
  notification: { createMany: ReturnType<typeof vi.fn> };
};

function makeCtx(invitation = makeInvitation(), sessionEmail = invitation.email) {
  const tx: MockTx = {
    membership: { upsert: vi.fn().mockResolvedValue({}) },
    projectMember: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    invitation: { update: vi.fn().mockResolvedValue({}) },
    user: { update: vi.fn().mockResolvedValue({}) },
    notification: { createMany: vi.fn().mockResolvedValue({}) },
  };

  return {
    tx,
    db: {
      invitation: {
        findUnique: vi.fn().mockResolvedValue(invitation),
      },
      $transaction: vi.fn(async (fn: (tx: MockTx) => Promise<unknown>) => fn(tx)),
    },
    session: { user: { id: "user-1", email: sessionEmail, name: "Invitee" } },
  };
}

describe("invitation.accept", () => {
  let accept: { _handler: Handler };

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/server/api/routers/invitation");
    const router = mod.invitationRouter as unknown as Record<string, typeof accept>;
    accept = router.accept!;
  });

  it("sets emailVerified=true and onboardingComplete=true on the user", async () => {
    const ctx = makeCtx();

    await accept._handler({ ctx, input: { token: TOKEN } });

    expect(ctx.tx.user.update).toHaveBeenCalledTimes(1);
    const [updateArgs] = ctx.tx.user.update.mock.calls;
    expect(updateArgs![0]).toMatchObject({
      where: { id: "user-1" },
      data: expect.objectContaining({
        emailVerified: true,
        onboardingComplete: true,
        activeProjectId: "proj-1",
      }),
    });
  });

  it("creates org and project memberships in the same transaction", async () => {
    const ctx = makeCtx();

    await accept._handler({ ctx, input: { token: TOKEN } });

    expect(ctx.tx.membership.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_organizationId: { userId: "user-1", organizationId: "org-1" },
        },
        create: expect.objectContaining({
          userId: "user-1",
          organizationId: "org-1",
          role: "member",
        }),
      }),
    );
    expect(ctx.tx.projectMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          projectId: "proj-1",
          role: "member",
        }),
      }),
    );
  });

  it("rejects when session email does not match invitation email", async () => {
    const ctx = makeCtx(makeInvitation(), "different@example.com");

    await expect(
      accept._handler({ ctx, input: { token: TOKEN } }),
    ).rejects.toThrow(/different email/i);

    expect(ctx.tx.user.update).not.toHaveBeenCalled();
  });

  it("rejects expired invitations", async () => {
    const expired = makeInvitation({
      expiresAt: new Date(Date.now() - 60_000),
    });
    const ctx = makeCtx(expired);

    await expect(
      accept._handler({ ctx, input: { token: TOKEN } }),
    ).rejects.toThrow(/expired/i);
  });

  it("rejects non-pending invitations", async () => {
    const accepted = makeInvitation({ status: "accepted" });
    const ctx = makeCtx(accepted);

    await expect(
      accept._handler({ ctx, input: { token: TOKEN } }),
    ).rejects.toThrow(/no longer valid/i);
  });

  it("returns the org and project slugs for client-side redirect", async () => {
    const ctx = makeCtx();

    const result = await accept._handler({ ctx, input: { token: TOKEN } });

    expect(result).toEqual({
      organization: expect.objectContaining({ slug: "acme" }),
      orgSlug: "acme",
      projectSlug: "office-tower",
    });
  });
});
