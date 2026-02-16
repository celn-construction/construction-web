import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { OrgProvider } from "@/components/providers/OrgProvider";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  // Auth check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { orgSlug } = await params;
  const userId = session.user.id;

  // Resolve organization by slug
  const organization = await db.organization.findUnique({
    where: { slug: orgSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      memberships: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  // Organization not found or user not a member
  if (!organization || organization.memberships.length === 0) {
    // Try to find user's first organization and redirect there
    const userFirstOrg = await db.organization.findFirst({
      where: {
        memberships: {
          some: { userId },
        },
      },
      select: { slug: true },
    });

    if (userFirstOrg) {
      redirect(`/${userFirstOrg.slug}`);
    } else {
      redirect("/onboarding");
    }
  }

  const memberRole = organization.memberships[0]!.role;

  // Sync active organization in database
  await db.user.update({
    where: { id: userId },
    data: { activeOrganizationId: organization.id },
  });

  return (
    <OrgProvider
      value={{
        orgId: organization.id,
        orgSlug: organization.slug,
        orgName: organization.name,
        memberRole,
      }}
    >
      {children}
    </OrgProvider>
  );
}
