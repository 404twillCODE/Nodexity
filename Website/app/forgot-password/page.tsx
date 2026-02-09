"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback?type=recovery` : undefined,
      });
      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }
      setSent(true);
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <section className="full-width-section relative">
        <div className="section-content mx-auto w-full max-w-md px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl font-mono">
              CHECK YOUR EMAIL
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              We sent a password reset link to <strong className="text-text-primary">{email}</strong>. Click the link to set a new password.
            </p>
            <p className="mt-3 text-sm text-text-muted">
              If you don&apos;t see it, check your spam folder.
            </p>
          </div>
          <Link href="/login" className="btn-primary block w-full text-center">
            <span className="relative z-20 font-mono">BACK TO LOG IN</span>
          </Link>
          <p className="mt-4 text-center">
            <Link href="/" className="text-sm text-text-muted hover:text-accent">← Back home</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="full-width-section relative">
      <div className="section-content mx-auto w-full max-w-md px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl font-mono">
            RESET PASSWORD
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Enter your email and we&apos;ll send you a link to set a new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 border-t border-border pt-8">
          {error && (
            <div className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-border bg-background-secondary px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            <span className="relative z-20 font-mono">{loading ? "Sending…" : "SEND RESET LINK"}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          <Link href="/login" className="text-accent hover:underline">← Back to log in</Link>
        </p>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-text-muted hover:text-accent">← Back home</Link>
        </p>
      </div>
    </section>
  );
}
