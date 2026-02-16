import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { ProjectProvider } from "@/components/providers/ProjectProvider";

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

  // Get organization ID from orgSlug
  const organization = await db.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  });

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
  });

  // Project not found - redirect to org home
  if (!project) {
    redirect(`/${orgSlug}`);
  }

  // Set as active project
  await db.user.update({
    where: { id: userId },
    data: { activeProjectId: project.id },
  });

  return (
    <ProjectProvider
      value={{
        projectId: project.id,
        projectSlug: project.slug,
        projectName: project.name,
        organizationId: project.organizationId,
      }}
    >
      {children}
    </ProjectProvider>
  );
}
