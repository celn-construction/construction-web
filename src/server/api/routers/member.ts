import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";

export const memberRouter = createTRPCRouter({
  list: orgProcedure.query(async ({ ctx, input }) => {
    const members = await ctx.db.membership.findMany({
      where: {
        organizationId: input.organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return members;
  }),
});
