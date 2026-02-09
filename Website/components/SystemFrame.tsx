"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useBootComplete } from "@/components/BootCompleteContext";

const DISCORD_URL = "https://discord.gg/RVTAEbdDBJ";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
};

const mainNav: NavItem[] = [
  { href: "/docs", label: "Docs", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { href: DISCORD_URL, label: "Support", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z", external: true },
  { href: "/status", label: "Status", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

export function SystemTopBar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);
  const { bootComplete } = useBootComplete();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={bootComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
      transition={{
        delay: bootComplete ? 0.15 : 0,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="w-full shrink-0 px-4 pt-4 pb-1 sm:px-6 lg:px-8"
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-lg border border-[#333] bg-[#141414]/95 px-5 py-3 sm:px-6 lg:px-8 shadow-sm">
        <Link href="/" className="shrink-0 text-sm font-semibold text-accent hover:text-accent/80 transition-colors font-mono">
          Nodexity
        </Link>

        <span className="absolute left-1/2 -translate-x-1/2 text-xs font-mono text-amber-500/90 hidden sm:inline" aria-hidden>
          Website in active development
        </span>

        <nav className="flex items-center gap-6 sm:ml-auto" aria-label="Main">
          {mainNav.map(({ href, label, icon, external }) => (
            external ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 text-sm text-[#a0a0a0] hover:text-accent transition-colors font-mono"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                {label}
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                className="hidden sm:flex items-center gap-2 text-sm text-[#a0a0a0] hover:text-accent transition-colors font-mono"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                {label}
              </Link>
            )
          ))}
          <Link
            href="/donate"
            className="hidden sm:flex items-center justify-center text-[#a0a0a0] hover:text-red-500 transition-colors"
            title="Donate"
            aria-label="Donate"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </Link>
          <div className="relative sm:hidden" ref={mobileRef}>
            <button
              type="button"
              onClick={() => setMobileNavOpen((o) => !o)}
              className="flex items-center gap-2 text-sm font-mono text-[#a0a0a0] hover:text-accent transition-colors"
              aria-expanded={mobileNavOpen}
              aria-haspopup="true"
            >
              Menu
              <svg className={`h-4 w-4 transition-transform ${mobileNavOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {mobileNavOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-44 rounded-lg border border-[#333] bg-[#141414]/98 py-1.5 shadow-lg">
                {mainNav.map(({ href, label, external }) => (
                  external ? (
                    <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm font-mono text-[#a0a0a0] hover:bg-white/5 hover:text-accent transition-colors rounded-md mx-1" onClick={() => setMobileNavOpen(false)}>{label}</a>
                  ) : (
                    <Link key={href} href={href} className="block px-4 py-2 text-sm font-mono text-[#a0a0a0] hover:bg-white/5 hover:text-accent transition-colors rounded-md mx-1" onClick={() => setMobileNavOpen(false)}>{label}</Link>
                  )
                ))}
                <Link href="/donate" className="flex items-center gap-2 px-4 py-2 text-sm font-mono text-[#a0a0a0] hover:bg-white/5 hover:text-red-500 transition-colors rounded-md mx-1 border-t border-[#333] mt-1 pt-2" onClick={() => setMobileNavOpen(false)}>
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  Donate
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </motion.header>
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
