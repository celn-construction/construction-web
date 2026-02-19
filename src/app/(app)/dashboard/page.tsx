import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const firstOrg = await db.organization.findFirst({
    where: { memberships: { some: { userId: session.user.id } } },
    select: { slug: true },
  });

  if (firstOrg) {
    redirect(`/${firstOrg.slug}`);
  } else {
    redirect("/onboarding");
  }
}
