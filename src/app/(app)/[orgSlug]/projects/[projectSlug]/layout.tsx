import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { ProjectProvider } from "@/components/providers/ProjectProvider";
import ProjectShell from "@/components/layout/ProjectShell";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; projectSlug: string }>;
}) {
  // Auth check
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { orgSlug, projectSlug } = await params;
  const userId = session.user.id;

  // Fetch org and current user activeProjectId in parallel
  const [organization, user] = await Promise.all([
    db.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { activeProjectId: true },
    }),
  ]);

  if (!organization) {
    redirect(`/${orgSlug}`);
  }

  // Resolve project by slug within this organization
  const project = await db.project.findUnique({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: projectSlug,
      },
    },
    select: { id: true, slug: true, name: true, organizationId: true },
  });

  // Project not found - redirect to org home
  if (!project) {
    redirect(`/${orgSlug}`);
  }

  // Only write if the active project actually changed
  if (user?.activeProjectId !== project.id) {
    await db.user.update({
      where: { id: userId },
      data: { activeProjectId: project.id },
    });
  }

  return (
    <ProjectProvider
      value={{
        projectId: project.id,
        projectSlug: project.slug,
        projectName: project.name,
        organizationId: project.organizationId,
      }}
    >
      <ProjectShell
        projectId={project.id}
        projectName={project.name}
      >
        {children}
      </ProjectShell>
    </ProjectProvider>
  );
}
