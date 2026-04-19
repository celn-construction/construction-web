import { createTRPCRouter, protectedProcedure, orgProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createOrganizationSchema } from "@/lib/validations/onboarding";
import { generateUniqueSlug } from "@/server/api/helpers/slug";

export const organizationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const MAX_SLUG_RETRIES = 2;
      for (let attempt = 0; attempt <= MAX_SLUG_RETRIES; attempt++) {
        try {
          const slug = await generateUniqueSlug(input.name, ctx.db);

          const result = await ctx.db.$transaction(async (tx) => {
            const organization = await tx.organization.create({
              data: {
                name: input.name.trim(),
                slug,
                companyType: input.companyType,
                phone: input.phone,
                website: input.website,
                address: input.address,
                city: input.city,
                state: input.state,
                zip: input.zip,
                licenseNumber: input.licenseNumber,
                logoUrl: input.logoUrl,
              },
            });

            await tx.membership.create({
              data: {
                userId,
                organizationId: organization.id,
                role: "owner",
              },
            });

            return organization;
          });

          return { organization: result };
        } catch (err: unknown) {
          const isPrismaUniqueViolation =
            err != null &&
            typeof err === "object" &&
            "code" in err &&
            (err as { code: string }).code === "P2002";

          if (isPrismaUniqueViolation) {
            if (attempt === MAX_SLUG_RETRIES) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Could not generate unique URL. Try a different name.",
              });
            }
            continue;
          }
          throw err;
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create organization",
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.membership.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }),

  stats: orgProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx }) => {
      const orgId = ctx.organization.id;
      const [projectCount, memberCount, taskCount, documentCount] = await Promise.all([
        ctx.db.project.count({ where: { organizationId: orgId } }),
        ctx.db.membership.count({ where: { organizationId: orgId } }),
        ctx.db.ganttTask.count({ where: { project: { organizationId: orgId } } }),
        ctx.db.document.count({ where: { project: { organizationId: orgId } } }),
      ]);
      return { projectCount, memberCount, taskCount, documentCount };
    }),
});
