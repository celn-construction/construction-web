import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, projectProcedure } from "@/server/api/trpc";
import { canRemoveMembers } from "@/lib/permissions";

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
});
