import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { new: isNewTeam } = await searchParams;

  // If user already has an org and isn't explicitly creating a new team,
  // redirect there instead of showing onboarding
  if (isNewTeam !== "true") {
    const userOrg = await db.organization.findFirst({
      where: { memberships: { some: { userId: session.user.id } } },
      select: { slug: true },
    });

    if (userOrg) {
      // Fix data inconsistency: user has org but onboardingComplete may be false,
      // which causes an infinite redirect loop with (app)/layout.tsx
      await db.user.update({
        where: { id: session.user.id },
        data: { onboardingComplete: true },
      });
      redirect(`/${userOrg.slug}`);
    }
  }

  return <OnboardingWizard />;
}
