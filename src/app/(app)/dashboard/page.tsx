import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { getActiveOrganizationId } from "@/server/api/helpers/getActiveOrganization";
import { getActiveProjectId } from "@/server/api/helpers/getActiveProject";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const orgId = await getActiveOrganizationId(db, session.user.id);

  if (!orgId) {
    redirect("/onboarding");
  }

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { slug: true },
  });

  if (!org) {
    redirect("/onboarding");
  }

  const projectId = await getActiveProjectId(db, session.user.id, orgId);

  if (projectId) {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { slug: true },
    });

    if (project) {
      redirect(`/${org.slug}/projects/${project.slug}/gantt`);
    }
  }

  redirect(`/${org.slug}`);
}
