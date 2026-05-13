import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";
import { canManageRoles, canRemoveMembers, canAssignRole } from "@/lib/permissions";
import { INVITATION_STATUS } from "@/lib/constants/invitation";

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

  updateRole: orgProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["admin", "member"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!canManageRoles(ctx.membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to change member roles",
        });
      }

      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role",
        });
      }

      const target = await ctx.db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: input.userId,
            organizationId: ctx.organization.id,
          },
        },
      });

      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found in this organization",
        });
      }

      if (target.role === input.role) {
        return { success: true, role: target.role };
      }

      if (target.role === "owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Owner role cannot be changed here",
        });
      }

      if (!canAssignRole(ctx.membership.role, target.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot change the role of a member with equal or higher privileges",
        });
      }

      if (!canAssignRole(ctx.membership.role, input.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot assign a role equal to or higher than your own",
        });
      }

      const updated = await ctx.db.$transaction(async (tx) => {
        const membership = await tx.membership.update({
          where: {
            userId_organizationId: {
              userId: input.userId,
              organizationId: ctx.organization.id,
            },
          },
          data: { role: input.role },
        });

        // When demoting to member, downgrade auto-created admin project roles.
        // Owner project roles are explicit grants and are left unchanged.
        if (input.role === "member") {
          await tx.projectMember.updateMany({
            where: {
              userId: input.userId,
              role: "admin",
              project: { organizationId: ctx.organization.id },
            },
            data: { role: "member" },
          });
        }

        return membership;
      });

      return { success: true, role: updated.role };
    }),

  remove: orgProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!canRemoveMembers(ctx.membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to remove members from this organization",
        });
      }

      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself from the organization",
        });
      }

      const target = await ctx.db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: input.userId,
            organizationId: ctx.organization.id,
          },
        },
        include: {
          user: { select: { email: true, name: true } },
        },
      });

      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found in this organization",
        });
      }

      if (!canAssignRole(ctx.membership.role, target.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove a member with equal or higher privileges",
        });
      }

      if (target.role === "owner") {
        const ownerCount = await ctx.db.membership.count({
          where: { organizationId: ctx.organization.id, role: "owner" },
        });
        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove the only organization owner",
          });
        }
      }

      const result = await ctx.db.$transaction(async (tx) => {
        const projectMembers = await tx.projectMember.deleteMany({
          where: {
            userId: input.userId,
            project: { organizationId: ctx.organization.id },
          },
        });

        const invitations = await tx.invitation.updateMany({
          where: {
            email: target.user.email,
            organizationId: ctx.organization.id,
            status: INVITATION_STATUS.PENDING,
          },
          data: { status: INVITATION_STATUS.REVOKED },
        });

        await tx.membership.delete({
          where: {
            userId_organizationId: {
              userId: input.userId,
              organizationId: ctx.organization.id,
            },
          },
        });

        return {
          projectsRemoved: projectMembers.count,
          invitationsRevoked: invitations.count,
        };
      });

      return result;
    }),
});
