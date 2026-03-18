"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const previewItems = [
  { label: "Launcher", value: "Modrinth only" },
  { label: "Mod Loader", value: "Fabric only" },
  { label: "Versions", value: "4 supported now" },
  { label: "Updater", value: "Pack config re-import" },
];

export default function PureHero() {
  return (
    <section className="full-width-section relative overflow-hidden pb-14 pt-16 sm:pb-20 sm:pt-20 lg:pb-24">
      <div className="section-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(46,242,162,0.16),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(70,110,255,0.14),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_60%)]" />
      </div>

      <div className="section-content mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <p className="text-xs font-mono uppercase tracking-[0.36em] text-accent/85">
                Nodexity Performance Builder
              </p>
              <div className="space-y-4">
                <h1 className="text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                  Pure FPS
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl">
                  Build a clean, optimized Minecraft FPS modpack for Modrinth in
                  minutes.
                </p>
              </div>
              <p className="max-w-2xl text-sm text-text-muted sm:text-base">
                Pure FPS is the cleanest way to boost Minecraft performance.
                Choose your version, customize your setup, and download your
                optimized pack without the usual modpack confusion.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="#pure-builder" className="btn-primary font-mono">
                Build Your Pack
              </Link>
              <Link href="#pure-features" className="btn-secondary font-mono">
                See Features
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-mono uppercase tracking-[0.22em] text-text-muted">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                Website-based workflow
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                Modrinth focused
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                Future-ready pack generation
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-[radial-gradient(circle,rgba(46,242,162,0.2),transparent_55%)] blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0c1115]/90 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(46,242,162,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_45%)]" />
              <div className="relative space-y-6 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.28em] text-accent/80">
                      Pure FPS Builder
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                      Clean pack generation flow
                    </p>
                  </div>
                  <div className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-accent">
                    V1 Live UI
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {previewItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-text-muted">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 rounded-[28px] border border-white/10 bg-black/25 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-text-muted">
                        Suggested flow
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {"Version -> Profile -> Toggles -> Download"}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M9 17l6-5-6-5v10z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {[
                      "Choose a Minecraft version",
                      "Pick your baseline profile",
                      "Apply a preset or PC suggestion",
                      "Export a reusable Pure FPS config",
                    ].map((step, index) => (
                      <div
                        key={step}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-xs font-mono text-accent">
                          0{index + 1}
                        </div>
                        <p className="text-sm text-text-secondary">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
