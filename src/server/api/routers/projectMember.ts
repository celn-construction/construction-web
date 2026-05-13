import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, projectProcedure } from "@/server/api/trpc";
import {
  canInviteMembers,
  canRemoveMembers,
  canAssignRole,
} from "@/lib/permissions";
import { bulkAddProjectMembersSchema } from "@/lib/validations/projectMember";

export const projectMemberRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx, input }) => {
    const members = await ctx.db.projectMember.findMany({
      where: {
        projectId: input.projectId,
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

  listProjectMemberships: projectProcedure.query(async ({ ctx, input }) => {
    const members = await ctx.db.projectMember.findMany({
      where: { projectId: input.projectId },
      select: { userId: true },
    });

    const userIds = members.map((m) => m.userId);
    if (userIds.length === 0) return [];

    // Limit to projects the calling user is also a member of so they can't
    // see cross-project memberships for projects they don't belong to.
    const callerProjectIds = await ctx.db.projectMember
      .findMany({
        where: {
          userId: ctx.session.user.id,
          project: { organizationId: ctx.organization.id },
        },
        select: { projectId: true },
      })
      .then((rows) => rows.map((r) => r.projectId));

    const memberships = await ctx.db.projectMember.findMany({
      where: {
        userId: { in: userIds },
        projectId: { in: callerProjectIds },
      },
      select: {
        id: true,
        userId: true,
        projectId: true,
        role: true,
      },
    });

    const byUser = new Map<
      string,
      { memberId: string; projectId: string; role: string }[]
    >();
    for (const m of memberships) {
      const existing = byUser.get(m.userId) ?? [];
      existing.push({ memberId: m.id, projectId: m.projectId, role: m.role });
      byUser.set(m.userId, existing);
    }

    return Array.from(byUser.entries()).map(([userId, projects]) => ({
      userId,
      projects,
    }));
  }),

  remove: projectProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!canRemoveMembers(ctx.projectMember.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to remove members",
        });
      }

      // Prevent removing yourself if you're the only owner
      const target = await ctx.db.projectMember.findUnique({
        where: { id: input.memberId, projectId: input.projectId },
      });

      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      if (!canAssignRole(ctx.projectMember.role, target.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove a member with equal or higher privileges",
        });
      }

      if (target.role === "owner") {
        const ownerCount = await ctx.db.projectMember.count({
          where: { projectId: input.projectId, role: "owner" },
        });
        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove the only project owner",
          });
        }
      }

      await ctx.db.projectMember.delete({
        where: { id: input.memberId, projectId: input.projectId },
      });

      return { success: true };
    }),

  updateRole: projectProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["admin", "member"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!canInviteMembers(ctx.projectMember.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to change member roles",
        });
      }

      const target = await ctx.db.projectMember.findUnique({
        where: { id: input.memberId, projectId: input.projectId },
      });

      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      if (target.role === input.role) {
        return { success: true, role: target.role };
      }

      if (!canAssignRole(ctx.projectMember.role, target.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot change the role of a member with equal or higher privileges",
        });
      }

      if (!canAssignRole(ctx.projectMember.role, input.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot assign a role equal to or higher than your own",
        });
      }

      if (target.role === "owner") {
        const ownerCount = await ctx.db.projectMember.count({
          where: { projectId: input.projectId, role: "owner" },
        });
        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot demote the only project owner",
          });
        }
      }

      const updated = await ctx.db.projectMember.update({
        where: { id: input.memberId, projectId: input.projectId },
        data: { role: input.role },
      });

      return { success: true, role: updated.role };
    }),

  bulkAdd: projectProcedure
    .input(bulkAddProjectMembersSchema)
    .mutation(async ({ ctx, input }) => {
      if (!canInviteMembers(ctx.projectMember.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to add members to this project",
        });
      }

      for (const member of input.members) {
        if (!canAssignRole(ctx.projectMember.role, member.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot assign a role equal to or above your own",
          });
        }
      }

      const userIds = input.members.map((m) => m.userId);
      const memberships = await ctx.db.membership.findMany({
        where: {
          organizationId: ctx.organization.id,
          userId: { in: userIds },
        },
        select: { userId: true },
      });
      const validUserIds = new Set(memberships.map((m) => m.userId));
      const invalidIds = userIds.filter((id) => !validUserIds.has(id));
      if (invalidIds.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more users are not members of this organization",
        });
      }

      const result = await ctx.db.projectMember.createMany({
        data: input.members.map((m) => ({
          userId: m.userId,
          projectId: ctx.project.id,
          role: m.role,
        })),
        skipDuplicates: true,
      });

      return { added: result.count };
    }),
});
