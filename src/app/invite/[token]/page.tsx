"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { api } from "~/trpc/react";
import { useSession } from "@/lib/auth-client";
import { LogoIcon } from "@/components/ui/Logo";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { data: session, isPending: sessionLoading } = useSession();
  const [accepting, setAccepting] = useState(false);

  const { data: invitation, isLoading, error } = api.invitation.getByToken.useQuery(
    { token },
    { retry: false }
  );

  const acceptInvitation = api.invitation.accept.useMutation({
    onSuccess: () => {
      document.cookie = "onboarding-complete=true; path=/; max-age=31536000";
      router.push("/dashboard");
    },
    onError: (error) => {
      alert(error.message || "Failed to accept invitation");
      setAccepting(false);
    },
  });

  const handleAccept = () => {
    setAccepting(true);
    acceptInvitation.mutate({ token });
  };

  if (isLoading || sessionLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[var(--bg-card)] rounded-lg shadow-sm p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            <h1 className="text-xl font-medium text-gray-800 dark:text-[var(--text-primary)] mb-2">
              Invalid Invitation
            </h1>
            <p className="text-gray-500 dark:text-[var(--text-secondary)] mb-6">
              {error.message}
            </p>
            <Link
              href="/sign-in"
              className="inline-block bg-[var(--accent-primary)] dark:bg-[var(--accent-purple)] text-white px-6 py-2 rounded-md hover:opacity-90 transition-colors"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[var(--bg-card)] rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[var(--accent-primary)] dark:bg-gray-700 rounded-md flex items-center justify-center">
                <LogoIcon size={36} />
              </div>
            </div>
            <h1 className="text-2xl font-medium text-gray-800 dark:text-[var(--text-primary)] mb-2">
              You're invited!
            </h1>
            <p className="text-gray-500 dark:text-[var(--text-secondary)]">
              Join your team on BuildTrack Pro
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-[var(--bg-input)] rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--accent-primary)] dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-medium text-gray-800 dark:text-[var(--text-primary)] mb-1">
                  {invitation.organization.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)]">
                  Invited by {invitation.invitedBy.name || "a team member"}
                </p>
                <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)] mt-2">
                  Role: <span className="font-medium capitalize">{invitation.role}</span>
                </p>
              </div>
            </div>
          </div>

          {session?.user ? (
            <div className="space-y-4">
              <p className="text-sm text-center text-gray-500 dark:text-[var(--text-secondary)]">
                Signed in as <strong>{session.user.email}</strong>
              </p>
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full bg-[var(--accent-primary)] dark:bg-[var(--accent-purple)] text-white py-3 rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    Accept Invitation
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href={`/sign-up?invite=${token}`}
                className="w-full bg-[var(--accent-primary)] dark:bg-[var(--accent-purple)] text-white py-3 rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                Sign up to join
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href={`/sign-in?invite=${token}`}
                className="w-full bg-gray-100 dark:bg-[var(--bg-input)] text-gray-800 dark:text-[var(--text-primary)] py-3 rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
