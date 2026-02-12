import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "~/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  list: orgProcedure
    .input(
      z.object({
        organizationId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const notifications = await ctx.db.notification.findMany({
        where: {
          userId: ctx.session.user.id,
          organizationId: ctx.organization.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined = undefined;
      if (notifications.length > input.limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  unreadCount: orgProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx }) => {
      const count = await ctx.db.notification.count({
        where: {
          userId: ctx.session.user.id,
          organizationId: ctx.organization.id,
          read: false,
        },
      });

      return count;
    }),

  markAsRead: orgProcedure
    .input(z.object({ organizationId: z.string(), ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.updateMany({
        where: {
          id: { in: input.ids },
          userId: ctx.session.user.id,
          organizationId: ctx.organization.id,
        },
        data: {
          read: true,
        },
      });

      return { success: true };
    }),

  markAllAsRead: orgProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx }) => {
      await ctx.db.notification.updateMany({
        where: {
          userId: ctx.session.user.id,
          organizationId: ctx.organization.id,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return { success: true };
    }),
});
