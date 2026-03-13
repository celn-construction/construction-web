import { createTRPCRouter, protectedProcedure, orgProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const organizationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.membership.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }),

  stats: orgProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx }) => {
      const orgId = ctx.organization.id;
      const [projectCount, memberCount, taskCount, documentCount] = await Promise.all([
        ctx.db.project.count({ where: { organizationId: orgId } }),
        ctx.db.membership.count({ where: { organizationId: orgId } }),
        ctx.db.ganttTask.count({ where: { project: { organizationId: orgId } } }),
        ctx.db.document.count({ where: { project: { organizationId: orgId } } }),
      ]);
      return { projectCount, memberCount, taskCount, documentCount };
    }),
});
