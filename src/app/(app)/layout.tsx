import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Email verification gate (DB-authoritative via session)
  if (!session.user.emailVerified) {
    redirect("/verify-email");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingComplete: true },
  });

  if (!user?.onboardingComplete) {
    redirect("/onboarding");
  }

  return <AppShell>{children}</AppShell>;
}
