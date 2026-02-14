import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const organizationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.membership.findMany({
      where: { userId: ctx.session.user.id },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }),
});
