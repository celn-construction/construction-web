import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { getActiveProjectId } from "@/server/api/helpers/getActiveProject";
import CreateFirstProject from "./CreateFirstProject";

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

  // Resolve org
  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, slug: true },
  });

  if (!org) {
    redirect("/onboarding");
  }

  // Try to find an active project to redirect to
  const projectId = await getActiveProjectId(db, session.user.id, org.id);

  if (projectId) {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { slug: true },
    });

    if (project) {
      redirect(`/${orgSlug}/projects/${project.slug}/gantt`);
    }
  }

  // No projects — show create first project page
  return <CreateFirstProject />;
}
