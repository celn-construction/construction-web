import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getActiveOrganizationId } from "~/server/api/helpers/getActiveOrganization";

export const organizationRouter = createTRPCRouter({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = await getActiveOrganizationId(
      ctx.db,
      ctx.session.user.id
    );

    if (!organizationId) {
      return null;
    }

    const organization = await ctx.db.organization.findUnique({
      where: { id: organizationId },
    });

    return organization;
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.membership.findMany({
      where: { userId: ctx.session.user.id },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }),

  switchOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Validate user has membership in this organization
      const membership = await ctx.db.membership.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
        },
        include: {
          organization: true,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a member of this organization",
        });
      }

      // Update user's active organization
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { activeOrganizationId: input.organizationId },
      });

      return membership.organization;
    }),
});
