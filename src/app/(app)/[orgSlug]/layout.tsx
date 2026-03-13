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

  // Resolve organization and current user activeOrganizationId in parallel
  const [organization, user] = await Promise.all([
    db.organization.findUnique({
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
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { activeOrganizationId: true },
    }),
  ]);

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

  // Only sync active organization if it actually changed
  if (user?.activeOrganizationId !== organization.id) {
    await db.user.update({
      where: { id: userId },
      data: { activeOrganizationId: organization.id },
    });
  }

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
