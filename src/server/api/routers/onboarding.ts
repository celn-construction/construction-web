import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createOrganizationSchema } from "~/lib/validations/onboarding";
import { generateSlug } from "~/lib/utils/slug";

async function generateUniqueSlug(
  name: string,
  db: any,
): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  // Keep trying until we find a unique slug
  while (true) {
    const existing = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
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
      const slug = await generateUniqueSlug(input.name, ctx.db);

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
