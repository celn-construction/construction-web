import "server-only";
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

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, onboardingComplete: true },
  });

  // Email verification gate (DB-authoritative, avoids stale session cookie cache)
  if (!user?.emailVerified) {
    redirect("/verify-email");
  }

  if (!user?.onboardingComplete) {
    redirect("/onboarding");
  }

  return <AppShell>{children}</AppShell>;
}
