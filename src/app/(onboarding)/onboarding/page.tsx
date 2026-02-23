import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // If user already has an org, redirect there instead of showing onboarding
  const userOrg = await db.organization.findFirst({
    where: { memberships: { some: { userId: session.user.id } } },
    select: { slug: true },
  });

  if (userOrg) {
    redirect(`/${userOrg.slug}`);
  }

  return <OnboardingWizard />;
}
