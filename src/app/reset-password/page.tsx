"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/Logo";

function ResetPasswordForm() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from URL on client side only
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)] flex items-center justify-center p-6 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-[var(--bg-card)] rounded-lg p-12 shadow-sm dark:shadow-black/20 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-md flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-medium text-gray-800 dark:text-[var(--text-primary)] mb-3">Invalid Reset Link</h1>
          <p className="text-gray-500 dark:text-[var(--text-secondary)] mb-8">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="w-full h-14 bg-[var(--accent-primary)] text-white text-base rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 group"
          >
            Request new link
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)] flex items-center justify-center p-6 transition-colors">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 bg-white dark:bg-[var(--bg-card)] rounded-lg overflow-hidden shadow-sm dark:shadow-black/20">
        {/* Left side - Form */}
        <div className="p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-12">
            <Link href="/" className="flex items-center gap-3 mb-8 w-fit hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-[var(--accent-primary)] dark:bg-gray-700 rounded-md flex items-center justify-center">
                <LogoIcon size={28} />
              </div>
              <span className="text-gray-800 dark:text-[var(--text-primary)] text-lg font-medium">BuildTrack Pro</span>
            </Link>

            {success ? (
              <>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-md flex items-center justify-center mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-medium text-gray-800 dark:text-[var(--text-primary)] mb-3">Password reset!</h1>
                <p className="text-gray-500 dark:text-[var(--text-secondary)]">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-medium text-gray-800 dark:text-[var(--text-primary)] mb-3">Set new password</h1>
                <p className="text-gray-500 dark:text-[var(--text-secondary)]">
                  Your new password must be at least 8 characters long.
                </p>
              </>
            )}
          </div>

          {success ? (
            <button
              onClick={() => router.push("/sign-in")}
              className="w-full h-14 bg-[var(--accent-primary)] text-white text-base rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 group cursor-pointer"
            >
              Continue to sign in
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm text-gray-700 dark:text-[var(--text-secondary)] mb-2">
                  New password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-gray-400 dark:text-[var(--text-muted)]" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-12 pr-12 py-4 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)]"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[var(--text-muted)] hover:text-gray-600 dark:hover:text-[var(--text-secondary)]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm text-gray-700 dark:text-[var(--text-secondary)] mb-2">
                  Confirm new password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-gray-400 dark:text-[var(--text-muted)]" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-12 pr-12 py-4 bg-[var(--bg-input)] dark:bg-[var(--bg-input)] text-gray-900 dark:text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-[var(--accent-purple)] transition-all placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)]"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[var(--text-muted)] hover:text-gray-600 dark:hover:text-[var(--text-secondary)]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-14 bg-[var(--accent-primary)] text-white text-base rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 group cursor-pointer"
              >
                Reset password
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </Button>
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
              <h2 className="text-white text-xl font-medium mb-2">Secure Your Account</h2>
              <p className="text-white/80">
                Choose a strong password to keep your projects and data safe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
