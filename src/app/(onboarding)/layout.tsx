import { BlueprintBackground } from "~/components/onboarding/BlueprintBackground";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)]">
      <BlueprintBackground />
      {children}
    </div>
  );
}
