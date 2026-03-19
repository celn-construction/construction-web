import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  setEmailVerified: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session.user.emailVerified) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Email not verified" });
    }
    const cookieStore = await cookies();
    cookieStore.set("email-verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return { success: true };
  }),

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
});
