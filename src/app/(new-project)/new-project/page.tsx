import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import CreateProjectForm from "./CreateProjectForm";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { org: orgSlug } = await searchParams;

  if (!orgSlug) {
    redirect("/onboarding");
  }

  // Verify org exists and user is a member
  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, slug: true, name: true },
  });

  if (!org) {
    redirect("/onboarding");
  }

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, organizationId: org.id },
    select: { id: true },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  return (
    <CreateProjectForm
      orgSlug={org.slug}
      orgName={org.name}
      organizationId={org.id}
    />
  );
}
