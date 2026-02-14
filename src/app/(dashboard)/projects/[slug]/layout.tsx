import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { ProjectProvider } from "~/components/providers/ProjectProvider";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { slug } = await params;
  const userId = session.user.id;

  // Get user's active organization
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { activeOrganizationId: true },
  });

  if (!user?.activeOrganizationId) {
    redirect("/dashboard");
  }

  // Resolve project by slug
  const project = await db.project.findUnique({
    where: {
      organizationId_slug: {
        organizationId: user.activeOrganizationId,
        slug,
      },
    },
  });

  // Project not found - redirect to dashboard
  if (!project) {
    redirect("/dashboard");
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
