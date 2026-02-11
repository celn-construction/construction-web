import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const organizationRouter = createTRPCRouter({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    // Get the user's first organization (for now)
    const membership = await ctx.db.membership.findFirst({
      where: { userId: ctx.session.user.id },
      include: {
        organization: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return membership?.organization ?? null;
  }),
});
