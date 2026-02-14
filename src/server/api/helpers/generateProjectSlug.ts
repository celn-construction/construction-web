import type { PrismaClient } from "../../../../generated/prisma";
import { generateSlug } from "~/lib/utils/slug";

/**
 * Generate a unique project slug within an organization
 * @param name - The project name
 * @param organizationId - The organization ID
 * @param db - Prisma client instance
 * @returns A unique slug for the project
 */
export async function generateUniqueProjectSlug(
  name: string,
  organizationId: string,
  db: PrismaClient
): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  // Keep trying until we find a unique slug
  while (true) {
    const existing = await db.project.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
          slug,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
