import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { del } from "@vercel/blob";
import { createTRPCRouter, protectedProcedure, projectProcedure } from "@/server/api/trpc";
import { createProjectSchema, deleteProjectSchema } from "@/lib/validations/project";
import { canDeleteProjects } from "@/lib/permissions";
import { getActiveOrganizationId } from "@/server/api/helpers/getActiveOrganization";
import { getActiveProjectId } from "@/server/api/helpers/getActiveProject";
import { getTemplateData } from "@/server/gantt/templates";
import { generateUniqueProjectSlug } from "@/server/api/helpers/generateProjectSlug";

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

      // Get task completion stats per project
      const projectIds = projects.map((p) => p.id);
      const taskStats = projectIds.length > 0
        ? await ctx.db.ganttTask.groupBy({
            by: ["projectId"],
            where: { projectId: { in: projectIds } },
            _avg: { percentDone: true },
            _count: { id: true },
          })
        : [];

      const statsMap = new Map(
        taskStats.map((s) => [
          s.projectId,
          { taskCount: s._count.id, completionPercent: Math.round(s._avg.percentDone ?? 0) },
        ])
      );

      return projects.map((p) => ({
        ...p,
        taskCount: statsMap.get(p.id)?.taskCount ?? 0,
        completionPercent: statsMap.get(p.id)?.completionPercent ?? 0,
      }));
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

      // Get template data
      const template = input.template ?? "BLANK";
      const templateData = getTemplateData(template);

      // Generate unique slug for this project
      const slug = await generateUniqueProjectSlug(
        input.name,
        organizationId,
        ctx.db
      );

      // Create the project with template config
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          slug,
          status: "active",
          organizationId,
          template,
          calendarId: templateData.project.calendarId,
          hoursPerDay: templateData.project.hoursPerDay,
          daysPerWeek: templateData.project.daysPerWeek,
          daysPerMonth: templateData.project.daysPerMonth,
          calendars: templateData.project.calendars ?? undefined,
        },
      });

      // Seed template tasks and resources
      if (templateData.tasks.length > 0) {
        await ctx.db.ganttTask.createMany({
          data: templateData.tasks.map((task, index) => ({
            projectId: project.id,
            name: task.name,
            duration: task.duration,
            durationUnit: task.durationUnit ?? "day",
            percentDone: task.percentDone ?? 0,
            expanded: task.expanded ?? false,
            orderIndex: task.orderIndex ?? index,
          })),
        });
      }

      if (templateData.resources.length > 0) {
        await ctx.db.ganttResource.createMany({
          data: templateData.resources.map((resource) => ({
            projectId: project.id,
            name: resource.name,
            city: resource.city,
            calendar: resource.calendar,
          })),
        });
      }

      // Add creator as project owner
      await ctx.db.projectMember.create({
        data: {
          userId: ctx.session.user.id,
          projectId: project.id,
          role: "owner",
        },
      });

      // Set as active project for user
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { activeProjectId: project.id },
      });

      return project;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      });

      return project;
    }),

  getBySlug: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        organizationId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let organizationId = input.organizationId;

      // If no organizationId provided, use active organization
      if (!organizationId) {
        const activeOrgId = await getActiveOrganizationId(
          ctx.db,
          ctx.session.user.id
        );

        if (!activeOrgId) {
          return null;
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
        return null;
      }

      // Get project by slug
      const project = await ctx.db.project.findUnique({
        where: {
          organizationId_slug: {
            organizationId,
            slug: input.slug,
          },
        },
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      });

      return project;
    }),

  getActive: protectedProcedure
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
          return null;
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
        return null;
      }

      // Get active project ID
      const activeProjectId = await getActiveProjectId(
        ctx.db,
        ctx.session.user.id,
        organizationId
      );

      if (!activeProjectId) {
        return null;
      }

      // Return the project
      const project = await ctx.db.project.findUnique({
        where: { id: activeProjectId },
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      });

      return project;
    }),

  setActive: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify project exists and user has org membership
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Validate user has access to this organization
      const membership = await ctx.db.membership.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: project.organizationId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a member of this organization",
        });
      }

      // Update user's active project
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { activeProjectId: input.projectId },
      });

      return project;
    }),

  delete: projectProcedure
    .input(deleteProjectSchema)
    .mutation(async ({ ctx, input }) => {
      if (!canDeleteProjects(ctx.projectMember.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to delete projects" });
      }

      // Verify confirmation name matches
      if (input.confirmName.trim().toLowerCase() !== ctx.project.name.trim().toLowerCase()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Project name does not match" });
      }

      // Collect blob URLs for cleanup (documents + task cover images)
      const [documents, tasksWithCovers] = await Promise.all([
        ctx.db.document.findMany({
          where: { projectId: ctx.project.id },
          select: { blobUrl: true },
        }),
        ctx.db.ganttTask.findMany({
          where: { projectId: ctx.project.id, coverImageUrl: { not: null } },
          select: { coverImageUrl: true },
        }),
      ]);

      const blobUrls = [
        ...documents.map((d) => d.blobUrl),
        ...tasksWithCovers.map((t) => t.coverImageUrl).filter((url): url is string => !!url),
      ];

      // Best-effort blob cleanup
      if (blobUrls.length > 0) {
        try {
          await del(blobUrls);
        } catch (e) {
          console.error("Blob cleanup failed for project", ctx.project.id, e);
        }
      }

      // Delete project — cascade handles all child records,
      // onDelete: SetNull handles User.activeProjectId
      await ctx.db.project.delete({ where: { id: ctx.project.id } });

      return { success: true, organizationId: ctx.organization.id };
    }),
});
