import type { PrismaClient } from "@prisma/client";

/**
 * Resolves the active organization ID for a user.
 *
 * Priority:
 * 1. User's activeOrganizationId if set and valid membership exists
 * 2. First membership ordered by createdAt ascending
 * 3. null if no memberships exist
 */
export async function getActiveOrganizationId(
  db: PrismaClient,
  userId: string
): Promise<string | null> {
  // Get user with active org preference
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { activeOrganizationId: true },
  });

  // If user has an active org preference, validate it
  if (user?.activeOrganizationId) {
    const membership = await db.membership.findFirst({
      where: {
        userId,
        organizationId: user.activeOrganizationId,
      },
    });

    // If valid membership exists, return the active org
    if (membership) {
      return user.activeOrganizationId;
    }
  }

  // Fallback to first membership
  const firstMembership = await db.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return firstMembership?.organizationId ?? null;
}
