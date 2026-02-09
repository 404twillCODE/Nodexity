"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Display name is required.");
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { name: trimmedName },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });
      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("An account with this email already exists.");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }
      setEmailSent(true);
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <section className="full-width-section relative">
        <div className="section-content mx-auto w-full max-w-md px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl font-mono">
              CHECK YOUR EMAIL
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              We sent a confirmation link to <strong className="text-text-primary">{email}</strong>. Click the link in that email to confirm your account, then you can sign in.
            </p>
            <p className="mt-3 text-sm text-text-muted">
              If you don&apos;t see it, check your spam folder.
            </p>
          </div>
          <div className="space-y-4 border-t border-border pt-8">
            <Link href="/login" className="btn-primary block w-full text-center">
              <span className="relative z-20 font-mono">GO TO LOG IN</span>
            </Link>
            <p className="text-center text-sm text-text-muted">
              <Link href="/" className="text-accent hover:underline">← Back home</Link>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="full-width-section relative">
      <div className="section-content mx-auto w-full max-w-md px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl font-mono">
            SIGN UP
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Create an account to post in support and keep your threads in one place. You&apos;ll need to confirm your email before signing in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 border-t border-border pt-8">
          {error && (
            <div className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-text-muted">
              Display name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-border bg-background-secondary px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Your name"
            />
          </div>
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
              Password (min 8 characters)
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded border border-border bg-background-secondary px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            <span className="relative z-20 font-mono">{loading ? "Creating account…" : "SIGN UP"}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
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
