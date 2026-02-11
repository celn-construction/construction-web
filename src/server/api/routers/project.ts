import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const projectRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Get the user's organization
    const membership = await ctx.db.membership.findFirst({
      where: { userId: ctx.session.user.id },
      include: {
        organization: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!membership) {
      return [];
    }

    // Get all projects for this organization
    let projects = await ctx.db.project.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "asc" },
    });

    // If no projects exist, seed two default projects
    if (projects.length === 0) {
      const [project1, project2] = await Promise.all([
        ctx.db.project.create({
          data: {
            name: "Downtown Tower Construction",
            status: "active",
            organizationId: membership.organizationId,
          },
        }),
        ctx.db.project.create({
          data: {
            name: "Residential Complex Phase 2",
            status: "active",
            organizationId: membership.organizationId,
          },
        }),
      ]);
      projects = [project1, project2];
    }

    return projects;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: {
          organization: true,
        },
      });

      return project;
    }),
});
