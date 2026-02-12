import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createProjectSchema } from "~/lib/validations/project";
import { getActiveOrganizationId } from "~/server/api/helpers/getActiveOrganization";

export const projectRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      let organizationId = input?.organizationId;

      // If no organizationId provided, use active organization
      if (!organizationId) {
        const activeOrgId = await getActiveOrganizationId(
          ctx.db,
          ctx.session.user.id
        );

        if (!activeOrgId) {
          return [];
        }

        organizationId = activeOrgId;
      }

      // Validate user has access to this organization
      const membership = await ctx.db.membership.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a member of this organization",
        });
      }

      // Get all projects for this organization
      const projects = await ctx.db.project.findMany({
        where: { organizationId },
        orderBy: { createdAt: "asc" },
      });

      return projects;
    }),

  create: protectedProcedure
    .input(
      createProjectSchema.extend({
        organizationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let organizationId = input.organizationId;

      // If no organizationId provided, use active organization
      if (!organizationId) {
        const activeOrgId = await getActiveOrganizationId(
          ctx.db,
          ctx.session.user.id
        );

        if (!activeOrgId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "User is not a member of any organization",
          });
        }

        organizationId = activeOrgId;
      }

      // Validate user has access to this organization
      const membership = await ctx.db.membership.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a member of this organization",
        });
      }

      // Create the project
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          status: "active",
          organizationId,
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
