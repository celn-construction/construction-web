import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createProjectSchema } from "~/lib/validations/project";

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
    const projects = await ctx.db.project.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "asc" },
    });

    return projects;
  }),

  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the user's organization
      const membership = await ctx.db.membership.findFirst({
        where: { userId: ctx.session.user.id },
        include: {
          organization: true,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a member of any organization",
        });
      }

      // Create the project
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          status: "active",
          organizationId: membership.organizationId,
        },
      });

      return project;
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
