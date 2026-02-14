import { db } from "~/server/db";

export async function resolveActiveProject(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { activeOrganizationId: true, activeProjectId: true },
  });

  if (!user?.activeOrganizationId) return null;

  let project = user.activeProjectId
    ? await db.project.findFirst({
        where: { id: user.activeProjectId, organizationId: user.activeOrganizationId },
      })
    : null;

  if (!project) {
    project = await db.project.findFirst({
      where: { organizationId: user.activeOrganizationId },
      orderBy: { createdAt: "asc" },
    });
  }

  return project;
}
