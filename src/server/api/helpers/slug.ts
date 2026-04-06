import type { PrismaClient } from "@prisma/client";
import { generateSlug } from "@/lib/utils/slug";

export async function generateUniqueSlug(
  name: string,
  db: PrismaClient,
): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

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
