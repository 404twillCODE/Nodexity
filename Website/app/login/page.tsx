"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/support";
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}` : undefined,
        },
      });
      if (otpError) {
        setError(otpError.message);
        setLoading(false);
        return;
      }
      setMagicLinkSent(true);
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (magicLinkSent) {
    return (
      <section className="full-width-section relative">
        <div className="section-content mx-auto w-full max-w-md px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl font-mono">
              CHECK YOUR EMAIL
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              We sent a sign-in link to <strong className="text-text-primary">{email}</strong>. Click the link in that email to sign in.
            </p>
            <p className="mt-3 text-sm text-text-muted">
              If you don&apos;t see it, check your spam folder.
            </p>
          </div>
          <p className="text-center text-sm text-text-muted">
            <button type="button" onClick={() => { setMagicLinkSent(false); setError(""); }} className="text-accent hover:underline">
              Use a different method
            </button>
          </p>
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
            LOG IN
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to post in support and manage your threads.
          </p>
        </div>

        <div className="flex gap-2 border-b border-border mb-6">
          <button
            type="button"
            onClick={() => { setMode("password"); setError(""); }}
            className={`px-3 py-2 text-sm font-medium transition-colors ${mode === "password" ? "text-accent border-b-2 border-accent -mb-px" : "text-text-muted hover:text-text-secondary"}`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setMode("magic"); setError(""); }}
            className={`px-3 py-2 text-sm font-medium transition-colors ${mode === "magic" ? "text-accent border-b-2 border-accent -mb-px" : "text-text-muted hover:text-text-secondary"}`}
          >
            Magic link
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
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
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-text-muted">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded border border-border bg-background-secondary px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="mt-1.5 text-right">
                <Link href="/forgot-password" className="text-xs text-text-muted hover:text-accent">
                  Forgot password?
                </Link>
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              <span className="relative z-20 font-mono">{loading ? "Signing in…" : "SIGN IN"}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-5">
            {error && (
              <div className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}
            <p className="text-sm text-text-muted">
              Enter your email and we&apos;ll send you a link to sign in (no password needed).
            </p>
            <div>
              <label htmlFor="magic-email" className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-text-muted">
                Email
              </label>
              <input
                id="magic-email"
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
              <span className="relative z-20 font-mono">{loading ? "Sending…" : "SEND MAGIC LINK"}</span>
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-text-muted hover:text-accent">
            ← Back home
          </Link>
        </p>
      </div>
    </section>
  );
}
