"use client";

import { motion } from "framer-motion";
import ModrinthInstructions from "@/components/pure/ModrinthInstructions";
import PureBuilder from "@/components/pure/PureBuilder";
import PureHero from "@/components/pure/PureHero";

const quickValueCards = [
  {
    title: "Easy setup",
    description:
      "Pick a version, choose a profile, and export a clean config without digging through mod lists.",
  },
  {
    title: "Optimized FPS",
    description:
      "Pure FPS starts with a performance-first Fabric baseline built for smoother Minecraft sessions.",
  },
  {
    title: "Modrinth ready",
    description:
      "The entire V1 workflow is shaped around clean Modrinth import and future Modrinth-focused pack generation.",
  },
  {
    title: "Custom controls",
    description:
      "Profiles are fast, but every key toggle is still exposed when you want more control.",
  },
] as const;

const whyPureCards = [
  {
    title: "Simple",
    description:
      "No technical modpack rabbit hole. Pure FPS gives you the knobs that matter and hides the noise.",
  },
  {
    title: "Clean",
    description:
      "The builder is designed to feel like an official Nodexity product, not a temporary checklist or rough prototype.",
  },
  {
    title: "Performance-first",
    description:
      "Fabric, Modrinth, and FPS-focused defaults keep the experience fast without pretending to be everything at once.",
  },
  {
    title: "Customizable",
    description:
      "Profiles, presets, manual toggles, and PC-based suggestions make it easy to land on the right build quickly.",
  },
  {
    title: "Future-ready",
    description:
      "The data model and export flow are structured so real backend generation, updates, and saved accounts can plug in later.",
  },
] as const;

export default function PurePageClient() {
  return (
    <div className="relative">
      <PureHero />

      <section className="full-width-section relative overflow-hidden py-12 sm:py-16">
        <div className="section-content mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.34em] text-accent/80">
                Quick Value
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Pure FPS makes modpack building feel stupid simple.
              </h2>
            </div>
            <p className="max-w-2xl text-base text-text-secondary">
              Built for Modrinth. Designed for simplicity. Focused on the cleanest
              route from idea to better FPS.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickValueCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1117]/90 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.28)]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,242,162,0.12),transparent_48%)]" />
                <div className="relative">
                  <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent/80">
                    0{index + 1}
                  </p>
                  <h3 className="mt-4 text-xl font-semibold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm text-text-secondary">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PureBuilder />
      <ModrinthInstructions />

      <section
        id="pure-features"
        className="full-width-section relative overflow-hidden py-20"
      >
        <div className="section-background">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(46,242,162,0.12),transparent_36%),radial-gradient(circle_at_top_right,rgba(70,110,255,0.1),transparent_30%)]" />
        </div>

        <div className="section-content mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="space-y-4">
              <p className="text-xs font-mono uppercase tracking-[0.34em] text-accent/80">
                Why Pure FPS
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                More FPS without technical confusion.
              </h2>
              <p className="max-w-2xl text-base text-text-secondary sm:text-lg">
                Pure FPS is for people who want a cleaner Minecraft experience without
                getting buried in launcher complexity, mismatched mod loaders, or
                endless setup steps.
              </p>
              <div className="rounded-[28px] border border-accent/20 bg-accent/10 p-5 text-sm text-accent">
                The current export is intentionally a mock config file so the UI,
                builder state, and update flow are ready before real `.mrpack`
                generation lands.
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {whyPureCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className={`rounded-[28px] border p-6 shadow-[0_18px_70px_rgba(0,0,0,0.28)] ${
                    index === 4
                      ? "border-accent/20 bg-accent/10"
                      : "border-white/10 bg-[#0d1117]/90"
                  }`}
                >
                  <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-3 text-sm text-text-secondary">
                    {card.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
