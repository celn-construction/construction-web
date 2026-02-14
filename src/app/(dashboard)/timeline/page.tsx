import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "~/lib/auth";
import { resolveActiveProject } from "~/server/api/helpers/resolveActiveProject";

export default async function TimelineRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const project = await resolveActiveProject(session.user.id);
  if (project) redirect(`/projects/${project.slug}/timeline`);

  return null;
}
