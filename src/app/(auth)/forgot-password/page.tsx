"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reset email");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)] flex items-center justify-center p-6 transition-colors">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 bg-white dark:bg-[var(--bg-card)] rounded-lg overflow-hidden shadow-sm dark:shadow-black/20">
        {/* Left side - Form */}
        <div className="p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-12">
            <Link href="/" className="flex items-center gap-3 mb-8 w-fit hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-[var(--accent-primary)] dark:bg-gray-700 rounded-md flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white rounded-md"></div>
              </div>
              <span className="text-gray-800 dark:text-[var(--text-primary)] text-lg font-medium">BuildTrack Pro</span>
            </Link>

            {submitted ? (
              <>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-md flex items-center justify-center mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-medium text-gray-800 dark:text-[var(--text-primary)] mb-3">Check your email</h1>
                <p className="text-gray-500 dark:text-[var(--text-secondary)]">
                  If an account exists for <strong className="text-gray-700 dark:text-[var(--text-primary)]">{email}</strong>, we&apos;ve sent a password reset link.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-medium text-gray-800 dark:text-[var(--text-primary)] mb-3">Forgot password?</h1>
                <p className="text-gray-500 dark:text-[var(--text-secondary)]">No worries, we&apos;ll send you reset instructions.</p>
              </>
            )}
          </div>

          {submitted ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)]">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                  className="text-gray-800 dark:text-[var(--accent-purple)] hover:underline"
                >
                  try another email address
                </button>
              </p>

              <Link
                href="/sign-in"
                className="w-full h-14 bg-[var(--accent-primary)] text-white text-base rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm text-gray-700 dark:text-[var(--text-secondary)] mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail className="w-5 h-5 text-gray-400 dark:text-[var(--text-muted)]" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@company.com"
                    className="w-full pl-12 pr-4 py-4 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)]"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-14 bg-[var(--accent-primary)] text-white text-base rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 group cursor-pointer"
              >
                Send reset link
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </Button>

              <Link
                href="/sign-in"
                className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-[var(--text-secondary)] hover:text-gray-800 dark:hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </form>
          )}
        </div>

        {/* Right side - Image */}
        <div className="relative hidden lg:block">
          <Image
            src="/images/auth-construction.jpg"
            alt="Construction site"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent flex items-end p-8">
            <div>
              <h2 className="text-white text-xl font-medium mb-2">Secure Access</h2>
              <p className="text-white/80">
                Your account security is our priority. Reset your password safely and get back to managing your projects.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
