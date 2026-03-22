import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

/**
 * Resolves the best redirect URL for the current user after sign-in.
 *
 * Default: returns JSON { url } for client-side navigation.
 * With ?redirect=true: issues a 302 redirect (for direct links).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shouldRedirect = searchParams.get("redirect") === "true";

  const url = await resolveUrl();

  if (shouldRedirect) {
    return NextResponse.redirect(new URL(url, request.url));
  }
  return NextResponse.json({ url });
}

async function resolveUrl(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return "/sign-in";
  }

  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      activeOrganizationId: true,
      activeProjectId: true,
    },
  });

  // Resolve organization
  let orgId = user?.activeOrganizationId ?? null;

  if (orgId) {
    const membership = await db.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      select: { id: true },
    });
    if (!membership) orgId = null;
  }

  if (!orgId) {
    const firstMembership = await db.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { organizationId: true },
    });
    orgId = firstMembership?.organizationId ?? null;
  }

  if (!orgId) {
    return "/onboarding";
  }

  // Resolve org slug + project in parallel
  const [org, project] = await Promise.all([
    db.organization.findUnique({
      where: { id: orgId },
      select: { slug: true },
    }),
    resolveProject(userId, orgId, user?.activeProjectId ?? null),
  ]);

  if (!org) {
    return "/onboarding";
  }

  if (project) {
    return `/${org.slug}/projects/${project.slug}/gantt`;
  }

  return `/new-project?org=${org.slug}`;
}

async function resolveProject(
  userId: string,
  orgId: string,
  activeProjectId: string | null,
) {
  if (activeProjectId) {
    const project = await db.project.findFirst({
      where: { id: activeProjectId, organizationId: orgId },
      select: { id: true, slug: true },
    });
    if (project) return project;
  }

  const firstProject = await db.project.findFirst({
    where: { organizationId: orgId },
    orderBy: { createdAt: "asc" },
    select: { id: true, slug: true },
  });

  if (firstProject) {
    void db.user.update({
      where: { id: userId },
      data: { activeProjectId: firstProject.id },
    });
  }

  return firstProject;
}
