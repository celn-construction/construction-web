import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { NoProjectPrompt } from "@/components/layout/NoProjectPrompt";

export default async function OrgHomePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { orgSlug } = await params;
  const userId = session.user.id;

  // Fetch org and user's active project preference in parallel
  const [org, user] = await Promise.all([
    db.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { activeProjectId: true },
    }),
  ]);

  if (!org) {
    redirect("/onboarding");
  }

  // Try the saved active project first
  let project: { id: string; slug: string } | null = null;

  if (user?.activeProjectId) {
    project = await db.project.findFirst({
      where: { id: user.activeProjectId, organizationId: org.id },
      select: { id: true, slug: true },
    });
  }

  // Fall back to first project in the org
  if (!project) {
    project = await db.project.findFirst({
      where: { organizationId: org.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true },
    });

    if (project) {
      void db.user.update({
        where: { id: userId },
        data: { activeProjectId: project.id },
      });
    }
  }

  if (project) {
    redirect(`/${orgSlug}/projects/${project.slug}/gantt`);
  }

  // No projects — show create project prompt inline
  return <NoProjectPrompt />;
}
