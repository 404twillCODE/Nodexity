"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { RoleBadge } from "@/components/RoleBadge";
import type { UserRole } from "@/lib/supabase/server";

const mainNav = [
  { href: "/docs", label: "Docs", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { href: "/support", label: "Support", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" },
  { href: "/status", label: "Status", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
] as const;

export function SystemTopBar({ userRole }: { userRole?: UserRole | null }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (accountRef.current && !accountRef.current.contains(target)) setAccountOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(target)) setMobileNavOpen(false);
    }
    if (accountOpen || mobileNavOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [accountOpen, mobileNavOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAccountOpen(false);
    window.location.href = "/";
  }

  return (
    <div className="border-b border-border bg-background-secondary">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: logo + main nav */}
        <div className="flex flex-1 items-center gap-8">
          <Link href="/" className="shrink-0 text-sm font-semibold text-text-primary hover:text-accent transition-colors font-mono">
            Nodexity
          </Link>
          <nav className="hidden items-center gap-6 sm:flex" aria-label="Main">
            {mainNav.map(({ href, label, icon }) => (
              <a key={href} href={href} className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                {label}
              </a>
            ))}
          </nav>
          {/* Mobile: menu dropdown */}
          <div className="relative sm:hidden" ref={mobileRef}>
            <button
              type="button"
              onClick={() => setMobileNavOpen((o) => !o)}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
              aria-expanded={mobileNavOpen}
              aria-haspopup="true"
            >
              Menu
              <svg className={`h-4 w-4 transition-transform ${mobileNavOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {mobileNavOpen && (
              <div className="absolute left-0 top-full z-40 mt-1 w-40 rounded border border-border bg-background-secondary py-1 shadow-lg">
                {mainNav.map(({ href, label }) => (
                  <a key={href} href={href} className="block px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-accent" onClick={() => setMobileNavOpen(false)}>{label}</a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Account button (prominent, like reference Login) */}
        <div className="relative w-fit shrink-0" ref={accountRef}>
          <button
            type="button"
            onClick={() => setAccountOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md border border-accent/60 bg-accent/10 px-4 py-2 text-sm font-medium text-text-primary hover:border-accent hover:bg-accent/20 transition-colors whitespace-nowrap"
            aria-expanded={accountOpen}
            aria-haspopup="true"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account
            <svg
              className={`h-4 w-4 shrink-0 transition-transform ${accountOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
            {accountOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-40 rounded border border-border bg-background-secondary py-1 shadow-lg">
                {loading ? (
                  <div className="px-4 py-2 text-sm text-text-muted">Loading…</div>
                ) : session ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                      <RoleBadge role={userRole ?? null} size="sm" />
                      <span className="text-xs text-text-muted truncate">{session.user.email}</span>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-accent transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/profile/settings"
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-accent transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      Profile settings
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-accent transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      Website settings
                    </Link>
                    {userRole && (userRole === "mod" || userRole === "admin" || userRole === "owner") && (
                      <Link
                        href="/mod"
                        className="block px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-accent transition-colors"
                        onClick={() => setAccountOpen(false)}
                      >
                        Moderation
                      </Link>
                    )}
                    {userRole && (userRole === "owner" || userRole === "admin") && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-accent transition-colors"
                        onClick={() => setAccountOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-background hover:text-accent transition-colors"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-accent transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      Website settings
                    </Link>
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-accent transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-accent transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

export function SystemFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-text-muted">
            © {currentYear} Nodexity. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="https://discord.gg/RVTAEbdDBJ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Discord
            </a>
            <a
              href="/faq"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              FAQ
            </a>
            <a
              href="/support"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Support
            </a>
            <a
              href="/donate"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Donate
            </a>
            <a
              href="/privacy"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Terms
            </a>
            <a
              href="/settings"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
