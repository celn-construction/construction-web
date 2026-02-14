import type { PrismaClient } from "@prisma/client";

/**
 * Resolves the active project ID for a user within a specific organization.
 *
 * Priority:
 * 1. User's activeProjectId if set and valid project exists in the org
 * 2. First project in the org ordered by createdAt ascending
 * 3. null if no projects exist in the org
 */
export async function getActiveProjectId(
  db: PrismaClient,
  userId: string,
  organizationId: string,
): Promise<string | null> {
  // Get user with active project preference
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { activeProjectId: true },
  });

  // If user has an active project preference, validate it belongs to the org
  if (user?.activeProjectId) {
    const project = await db.project.findFirst({
      where: {
        id: user.activeProjectId,
        organizationId,
      },
    });

    // If valid project exists in the org, return the active project
    if (project) {
      return user.activeProjectId;
    }
  }

  // Fallback to first project in the org
  const firstProject = await db.project.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });

  // Update user's active project to this one if found
  if (firstProject) {
    await db.user.update({
      where: { id: userId },
      data: { activeProjectId: firstProject.id },
    });
  }

  return firstProject?.id ?? null;
}
