import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { updateProfileSchema } from "@/lib/validations/user";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    return user;
  }),

  update: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          phone: input.phone || null,
          image: input.image || null,
        },
      });
    }),
});
