import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export const onboardingRouter = createTRPCRouter({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { onboardingComplete: true },
    });

    return {
      onboardingComplete: user?.onboardingComplete ?? false,
    };
  }),

  createOrganization: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Company name is required"),
        companyType: z.string().min(1, "Company type is required"),
        phone: z.string().optional(),
        website: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        licenseNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const slug = generateSlug(input.name);

      // Use transaction to ensure atomicity
      const result = await ctx.db.$transaction(async (tx) => {
        // Create organization
        const organization = await tx.organization.create({
          data: {
            name: input.name,
            slug,
            companyType: input.companyType,
            phone: input.phone,
            website: input.website,
            address: input.address,
            city: input.city,
            state: input.state,
            zip: input.zip,
            licenseNumber: input.licenseNumber,
          },
        });

        // Create owner membership
        await tx.membership.create({
          data: {
            userId,
            organizationId: organization.id,
            role: "owner",
          },
        });

        // Mark onboarding as complete
        await tx.user.update({
          where: { id: userId },
          data: { onboardingComplete: true },
        });

        return organization;
      });

      return { organization: result };
    }),
});
