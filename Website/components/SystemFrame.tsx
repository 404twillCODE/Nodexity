"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function SystemTopBar() {
  const { data: session, status } = useSession();

  return (
    <div className="border-b border-border bg-background-secondary">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-text-primary hover:text-accent transition-colors">
            Nodexity
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <a
            href="/"
            className="text-sm text-text-secondary hover:text-accent transition-colors"
          >
            Overview
          </a>
          <a
            href="/docs"
            className="text-sm text-text-secondary hover:text-accent transition-colors"
          >
            Docs
          </a>
          <a
            href="/support"
            className="text-sm text-text-secondary hover:text-accent transition-colors"
          >
            Support
          </a>
          <a
            href="/status"
            className="text-sm text-text-secondary hover:text-accent transition-colors"
          >
            Status
          </a>
          <a
            href="/settings"
            className="text-sm text-text-secondary hover:text-accent transition-colors"
          >
            Settings
          </a>
          {status === "loading" ? (
            <span className="text-sm text-text-muted">…</span>
          ) : session ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-text-secondary hover:text-accent transition-colors"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-text-secondary hover:text-accent transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-text-secondary hover:text-accent transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="text-sm text-accent hover:text-accent/80 transition-colors font-medium"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
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
              href="/login"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Log in
            </a>
            <a
              href="/register"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Sign up
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
