"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowRight, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { useSession } from "@/lib/auth-client";
import { LogoIcon } from "@/components/ui/Logo";
import { BlueprintBackground } from "@/components/onboarding/BlueprintBackground";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { data: session, isPending: sessionLoading } = useSession();
  const [accepting, setAccepting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: invitation, isLoading, error } = api.invitation.getByToken.useQuery(
    { token },
    { retry: false }
  );

  const acceptInvitation = api.invitation.accept.useMutation({
    onSuccess: () => {
      document.cookie = "onboarding-complete=true; path=/; max-age=31536000";
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/projects");
      }, 1500);
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
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <BlueprintBackground />
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <BlueprintBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-lg shadow-black/[0.03] p-8 text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="flex justify-center mb-4"
            >
              <div className="w-16 h-16 bg-[var(--status-red)]/10 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h1 className="text-xl font-medium text-[var(--text-primary)] mb-2">
                Invalid Invitation
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.28 }}
              className="text-[var(--text-secondary)] mb-6"
            >
              {error.message}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Link
                href="/sign-in"
                className="inline-block bg-[var(--accent-primary)] text-white px-6 py-2 rounded-md hover:opacity-90 transition-colors"
              >
                Go to Sign In
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <BlueprintBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-lg shadow-black/[0.03] p-8 text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="flex justify-center mb-4"
            >
              <div className="w-16 h-16 bg-[var(--status-green)]/10 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-[var(--status-green)] rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-xl font-medium text-[var(--text-primary)] mb-2"
            >
              Welcome aboard!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.38 }}
              className="text-[var(--text-secondary)]"
            >
              Redirecting to dashboard...
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <BlueprintBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-lg shadow-black/[0.03] p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="flex justify-center mb-4"
            >
              <div className="w-16 h-16 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center">
                <LogoIcon size={36} />
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
            >
              <motion.h1
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="text-2xl font-medium text-[var(--text-primary)] mb-2"
              >
                You're invited!
              </motion.h1>
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="text-[var(--text-secondary)]"
              >
                Join your team on BuildTrack Pro
              </motion.p>
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-medium text-[var(--text-primary)] mb-1">
                  {invitation.organization.name}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Invited by {invitation.invitedBy.name || "a team member"}
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  Role: <span className="font-medium capitalize">{invitation.role.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            {session?.user ? (
              <div className="space-y-4">
                <p className="text-sm text-center text-[var(--text-secondary)]">
                  Signed in as <strong>{session.user.email}</strong>
                </p>
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full bg-[var(--accent-primary)] text-white py-3 rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
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
                  className="w-full bg-[var(--accent-primary)] text-white py-3 rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  Sign up to join
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href={`/sign-in?invite=${token}`}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] text-[var(--text-primary)] py-3 rounded-md hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  Sign in
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
