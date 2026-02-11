import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createOrganizationSchema } from "~/lib/validations/onboarding";

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
    .input(createOrganizationSchema)
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
