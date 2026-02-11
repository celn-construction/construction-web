import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { LogoIcon } from "@/components/ui/Logo";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-[var(--bg-card)] rounded-lg shadow-sm p-8 lg:p-12">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[var(--accent-primary)] dark:bg-gray-700 rounded-md flex items-center justify-center">
                <LogoIcon size={36} />
              </div>
            </div>
            <h1 className="text-2xl font-medium text-gray-800 dark:text-[var(--text-primary)] mb-2">
              Welcome to BuildTrack Pro
            </h1>
            <p className="text-gray-500 dark:text-[var(--text-secondary)]">
              Let's set up your construction company
            </p>
          </div>

          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
