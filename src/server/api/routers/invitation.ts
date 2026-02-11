import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure, orgProcedure } from "~/server/api/trpc";
import { canInviteMembers } from "~/lib/permissions";
import { sendInvitationEmail } from "~/lib/email";
import { randomBytes } from "crypto";

export const invitationRouter = createTRPCRouter({
  create: orgProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.string().default("member"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!canInviteMembers(ctx.membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to invite members",
        });
      }

      // Check if user is already a member
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
        include: {
          memberships: {
            where: { organizationId: input.organizationId },
          },
        },
      });

      if (existingUser?.memberships.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already a member of this organization",
        });
      }

      // Check for existing pending invitation
      const existingInvitation = await ctx.db.invitation.findFirst({
        where: {
          email: input.email,
          organizationId: input.organizationId,
          status: "pending",
        },
      });

      if (existingInvitation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An invitation has already been sent to this email",
        });
      }

      // Generate token and expiry
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // Create invitation
      const invitation = await ctx.db.invitation.create({
        data: {
          email: input.email,
          role: input.role,
          token,
          expiresAt,
          invitedById: ctx.session.user.id,
          organizationId: input.organizationId,
        },
      });

      // Send email
      await sendInvitationEmail(
        input.email,
        ctx.organization.name,
        ctx.session.user.name || "A team member",
        token
      );

      return { invitation };
    }),

  list: orgProcedure.query(async ({ ctx, input }) => {
    const invitations = await ctx.db.invitation.findMany({
      where: {
        organizationId: input.organizationId,
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return invitations;
  }),

  revoke: orgProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!canInviteMembers(ctx.membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to revoke invitations",
        });
      }

      const invitation = await ctx.db.invitation.update({
        where: {
          id: input.invitationId,
          organizationId: input.organizationId,
        },
        data: {
          status: "revoked",
        },
      });

      return { invitation };
    }),

  resend: orgProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!canInviteMembers(ctx.membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to resend invitations",
        });
      }

      // Update expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invitation = await ctx.db.invitation.update({
        where: {
          id: input.invitationId,
          organizationId: input.organizationId,
        },
        data: {
          expiresAt,
          status: "pending",
        },
      });

      // Resend email
      await sendInvitationEmail(
        invitation.email,
        ctx.organization.name,
        ctx.session.user.name || "A team member",
        invitation.token
      );

      return { invitation };
    }),

  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.db.invitation.findUnique({
        where: { token: input.token },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          invitedBy: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if expired
      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        });
      }

      // Check if already accepted or revoked
      if (invitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation is no longer valid",
        });
      }

      return invitation;
    }),

  accept: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.invitation.findUnique({
        where: { token: input.token },
        include: {
          organization: true,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if expired
      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        });
      }

      // Check if already accepted or revoked
      if (invitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation is no longer valid",
        });
      }

      // Check if user email matches invitation email
      if (ctx.session.user.email !== invitation.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation was sent to a different email address",
        });
      }

      // Create membership and mark invitation as accepted
      await ctx.db.$transaction([
        ctx.db.membership.create({
          data: {
            userId: ctx.session.user.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
          },
        }),
        ctx.db.invitation.update({
          where: { id: invitation.id },
          data: { status: "accepted" },
        }),
        ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { onboardingComplete: true },
        }),
      ]);

      return { organization: invitation.organization };
    }),
});
