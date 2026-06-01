import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { canManageProjects, hasImplicitProjectAccess } from "@/lib/permissions";

/**
 * Server-side gate for the project settings route.
 *
 * Only owners and admins (MANAGE_PROJECTS) may view project settings — members
 * are redirected to the project timeline. This is the authoritative check;
 * hiding the sidebar link is only cosmetic.
 *
 * The role is resolved the same way projectProcedure does (explicit ProjectMember
 * row, falling back to implicit access for org owners/admins) but without the
 * side-effecting auto-create, since this is a read-only access check.
 */
export default async function ProjectSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; projectSlug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { orgSlug, projectSlug } = await params;

  const organization = await db.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  });
  if (!organization) {
    redirect(`/${orgSlug}`);
  }

  const project = await db.project.findUnique({
    where: {
      organizationId_slug: { organizationId: organization.id, slug: projectSlug },
    },
    select: { id: true },
  });
  if (!project) {
    redirect(`/${orgSlug}`);
  }

  const projectMember = await db.projectMember.findUnique({
    where: {
      userId_projectId: { userId: session.user.id, projectId: project.id },
    },
    select: { role: true },
  });

  let role: string | null = projectMember?.role ?? null;
  if (!role) {
    const orgMembership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: organization.id,
        },
      },
      select: { role: true },
    });
    role =
      orgMembership && hasImplicitProjectAccess(orgMembership.role)
        ? orgMembership.role
        : null;
  }

  if (!role || !canManageProjects(role)) {
    redirect(`/${orgSlug}/projects/${projectSlug}/gantt`);
  }

  return <>{children}</>;
}
