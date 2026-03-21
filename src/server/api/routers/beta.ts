import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { env } from "@/env";

export const betaRouter = createTRPCRouter({
  validateCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(({ input }) => {
      const betaCode = env.BETA_ACCESS_CODE;

      if (!betaCode) {
        return { valid: true as const };
      }

      if (input.code !== betaCode) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid beta access code",
        });
      }

      return { valid: true as const };
    }),
});
