import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { env } from "@/env";

export const betaRouter = createTRPCRouter({
  validateCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(({ input }) => {
      const betaCode = env.BETA_ACCESS_CODE;

      console.log("[beta] validateCode attempt", {
        envVarSet: !!betaCode,
        envVarPreview: betaCode ? `${betaCode.slice(0, 4)}... (len=${betaCode.length})` : null,
        submittedPreview: input.code ? `${input.code.slice(0, 4)}... (len=${input.code.length})` : "(empty)",
      });

      if (!betaCode) {
        console.log("[beta] no BETA_ACCESS_CODE configured — allowing all");
        return { valid: true as const };
      }

      if (input.code !== betaCode) {
        console.log("[beta] code mismatch — rejecting");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid beta access code",
        });
      }

      console.log("[beta] code matched — allowing");
      return { valid: true as const };
    }),
});
