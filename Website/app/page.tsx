"use client";

import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import BootSequence from "@/components/BootSequence";
import HexNodeTyping from "@/components/HexNodeTyping";

const sectionVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { 
    opacity: 1, 
    y: 0,
  },
};

function AnimatedSection({
  children,
  className,
  bootComplete,
}: {
  children: React.ReactNode;
  className?: string;
  bootComplete?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={bootComplete && isInView ? "animate" : "initial"}
      variants={sectionVariants}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
        mass: 0.8,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FloatingCard({ children, delay = 0, bootComplete = false }: { children: React.ReactNode; delay?: number; bootComplete?: boolean }) {
  return <>{children}</>;
}

export default function Home() {
  const heroRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bootComplete, setBootComplete] = useState(false);

  const { scrollYProgress: containerScroll } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(heroScroll, [0, 1], ["0%", "30%"]);
  const dividerOpacity = useTransform(
    containerScroll,
    [0, 0.1, 0.9, 1],
    [0, 1, 1, 0.8]
  );

  return (
    <div ref={containerRef} className="relative flex flex-col">
      <BootSequence onComplete={() => setBootComplete(true)} />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="full-width-section relative overflow-hidden"
      >
        <motion.div
          style={{ y: backgroundY }}
          className="section-background depth-layer"
        />
        <motion.div
          style={{ y: useTransform(containerScroll, [0, 1], ["0%", "10%"]) }}
          className="absolute inset-0 opacity-20 pointer-events-none"
        >
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(46, 242, 162, 0.01) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(46, 242, 162, 0.01) 0%, transparent 50%)
              `,
            }}
          />
        </motion.div>
        <div className="section-content mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8 lg:py-48">
          {bootComplete && (
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="mb-12"
              >
                <HexNodeTyping />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.5,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                className="max-w-3xl space-y-8"
              >
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={bootComplete ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  className="text-base leading-relaxed text-text-secondary sm:text-lg lg:text-xl font-mono"
                >
                  Local-first Minecraft server management system. Provides desktop
                  application for server creation and management, USB-based portable
                  deployment, and planned hosting infrastructure. All data remains
                  local and portable by default.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={bootComplete ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  className="flex gap-4 justify-center border-t border-border pt-8"
                >
                  <Link href="/dashboard" className="btn-primary block">
                    <span className="relative z-20 font-mono">LAUNCH</span>
                  </Link>
                  <Link href="/docs" className="btn-secondary block">
                    <span className="relative z-20 font-mono">DOCUMENTATION</span>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={bootComplete ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  className="grid grid-cols-2 gap-12 pt-8 border-t border-border"
                >
                    <div>
                      <div className="mb-3 text-xs font-mono uppercase tracking-wider text-text-muted">
                        Active Modules
                      </div>
                      <div className="space-y-2">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={bootComplete ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 25 }}
                          className="flex items-center justify-center gap-2.5"
                        >
                          <div className="h-1.5 w-1.5 bg-accent rounded-full"></div>
                          <span className="text-sm text-text-secondary font-mono">
                            Software
                          </span>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={bootComplete ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 25 }}
                          className="flex items-center justify-center gap-2.5"
                        >
                          <div className="h-1.5 w-1.5 bg-accent rounded-full"></div>
                          <span className="text-sm text-text-secondary font-mono">
                            USB Server
                          </span>
                        </motion.div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-3 text-xs font-mono uppercase tracking-wider text-text-muted">
                        Planned Modules
                      </div>
                      <div className="space-y-2">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={bootComplete ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.9, type: "spring", stiffness: 200, damping: 25 }}
                          className="flex items-center justify-center gap-2.5"
                        >
                          <div className="h-1.5 w-1.5 bg-border rounded-full"></div>
                          <span className="text-sm text-text-muted font-mono">
                            Hosting
                          </span>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={bootComplete ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 1.0, type: "spring", stiffness: 200, damping: 25 }}
                          className="flex items-center justify-center gap-2.5"
                        >
                          <div className="h-1.5 w-1.5 bg-border rounded-full"></div>
                          <span className="text-sm text-text-muted font-mono">
                            Recycle Host
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
          )}
        </div>
      </section>

      {/* Divider */}
      {bootComplete && (
        <motion.div
          style={{ opacity: dividerOpacity }}
          className="full-width-section relative h-px overflow-hidden bg-background"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ 
              type: "spring",
              stiffness: 50,
              damping: 20,
            }}
            className="h-full origin-left bg-gradient-to-r from-transparent via-accent/20 to-transparent"
          />
        </motion.div>
      )}

      {/* Module: Software */}
      <AnimatedSection bootComplete={bootComplete} className="full-width-section relative bg-background-secondary">
        <motion.div
          style={{ y: useTransform(containerScroll, [0, 1], ["0%", "12%"]) }}
          className="section-background depth-layer"
        />
        <motion.div
          style={{ y: useTransform(containerScroll, [0, 1], ["0%", "8%"]) }}
          className="absolute inset-0 opacity-15 pointer-events-none"
        >
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `
                radial-gradient(circle at 30% 40%, rgba(46, 242, 162, 0.008) 0%, transparent 50%)
              `,
            }}
          />
        </motion.div>
        <div className="section-content mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 25 }}
            className="mb-10"
          >
            <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
              SOFTWARE
            </h2>
          </motion.div>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
            <div>
              <p className="mb-6 text-base leading-relaxed text-text-secondary sm:text-lg">
                Desktop application for creating and managing Minecraft servers.
                Handles server lifecycle, world management, backups, and version
                control. All data stored locally on host machine.
              </p>
              <div className="space-y-3 border-t border-border pt-6">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Server creation and lifecycle management
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    World data management and backup operations
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Version selection and server console access
                  </span>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 25 }}
                className="mt-8"
              >
                <a
                  href="https://github.com/yourusername/hexnode/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-block"
                >
                  <span className="relative z-20 font-mono">DOWNLOAD</span>
                </a>
              </motion.div>
            </div>
            <FloatingCard delay={0.5} bootComplete={bootComplete}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="system-card p-6"
              >
                <div className="card-content space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-32 bg-text-primary/20 rounded"></div>
                    <div className="h-4 w-16 bg-accent/30 rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="flex items-center gap-1">
                        <span className="text-text-muted">Version:</span>
                        <span className="h-3 w-12 bg-text-primary/20 rounded"></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-text-muted">Port:</span>
                        <span className="h-3 w-10 bg-text-primary/20 rounded"></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono">
                      <span className="text-text-muted">RAM:</span>
                      <span className="h-3 w-8 bg-text-primary/20 rounded"></span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-border pt-4">
                    <div className="h-7 flex-1 bg-accent/20 rounded"></div>
                    <div className="h-7 flex-1 bg-border rounded"></div>
                  </div>
                </div>
              </motion.div>
            </FloatingCard>
          </div>
        </div>
      </AnimatedSection>

      {/* Module: Hosting */}
      <AnimatedSection bootComplete={bootComplete} className="full-width-section relative">
        <div className="section-content mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 25 }}
            className="mb-10"
          >
            <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
              HOSTING
            </h2>
          </motion.div>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
            <div className="order-2 lg:order-1">
              <FloatingCard delay={0.3} bootComplete={bootComplete}>
                <div className="system-card p-6 opacity-40">
                  <div className="space-y-3">
                    <div className="h-3 w-3/4 bg-border rounded"></div>
                    <div className="h-3 w-full bg-border rounded"></div>
                    <div className="h-3 w-5/6 bg-border rounded"></div>
                  </div>
                </div>
              </FloatingCard>
            </div>
            <div className="order-1 lg:order-2">
              <p className="mb-6 text-base leading-relaxed text-text-secondary sm:text-lg">
                Planned hosting infrastructure for Minecraft servers. Two deployment
                options under development: premium hardware and recycled business PC
                infrastructure. Status: planning phase.
              </p>
              <div className="space-y-3 border-t border-border pt-6">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-text-muted">→</span>
                  <span className="text-sm leading-relaxed text-text-muted sm:text-base">
                    Premium hosting on high-end hardware
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-text-muted">→</span>
                  <span className="text-sm leading-relaxed text-text-muted sm:text-base">
                    Budget hosting using recycled business PCs
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Module: USB Server */}
      <AnimatedSection bootComplete={bootComplete} className="full-width-section relative bg-background-secondary">
        <motion.div
          style={{ y: useTransform(containerScroll, [0, 1], ["0%", "12%"]) }}
          className="section-background depth-layer"
        />
        <motion.div
          style={{ y: useTransform(containerScroll, [0, 1], ["0%", "8%"]) }}
          className="absolute inset-0 opacity-15 pointer-events-none"
        >
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `
                radial-gradient(circle at 70% 60%, rgba(46, 242, 162, 0.008) 0%, transparent 50%)
              `,
            }}
          />
        </motion.div>
        <div className="section-content mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 25 }}
            className="mb-10"
          >
            <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
              USB SERVER
            </h2>
          </motion.div>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
            <div>
              <p className="mb-6 text-base leading-relaxed text-text-secondary sm:text-lg">
                Complete Minecraft server deployment on USB media. Server binary,
                world data, configuration, and backups stored entirely on removable
                media. Enables portable server deployment across host machines.
              </p>
              <div className="space-y-3 border-t border-border pt-6">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Complete server state stored on USB media
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Portable world data and configuration
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Plug-and-play deployment on any host
                  </span>
                </motion.div>
              </div>
            </div>
            <FloatingCard delay={0.7} bootComplete={bootComplete}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="system-card p-6"
              >
                <div className="card-content space-y-3">
                  <div className="flex items-center gap-2.5 border-b border-border pb-3">
                    <div className="h-2 w-2 bg-accent rounded-full"></div>
                    <div className="h-3 flex-1 bg-border rounded"></div>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-border pb-3">
                    <div className="h-2 w-2 bg-border rounded-full"></div>
                    <div className="h-3 flex-1 bg-border rounded"></div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 bg-border rounded-full"></div>
                    <div className="h-3 flex-1 bg-border rounded"></div>
                  </div>
                </div>
              </motion.div>
            </FloatingCard>
          </div>
        </div>
      </AnimatedSection>

      {/* Module: Philosophy */}
      <AnimatedSection bootComplete={bootComplete} className="full-width-section relative">
        <div className="section-content mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 25 }}
            className="mb-10"
          >
            <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
              PHILOSOPHY
            </h2>
          </motion.div>
          <div className="space-y-6 text-base leading-relaxed text-text-secondary sm:text-lg">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 25 }}
              >
                Local-first architecture. All server data remains on user-controlled
                hardware. No cloud dependencies or platform lock-in. Portable data
                formats enable migration and backup operations.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 25 }}
              >
                Minimal complexity. Each module provides essential functionality
                without unnecessary abstraction. System designed for direct control
                and clear operational boundaries.
              </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100, damping: 25 }}
            className="mt-10 grid grid-cols-3 gap-8 border-t border-border pt-10"
          >
            <div>
              <div className="mb-2 text-xs uppercase tracking-wider text-text-muted">
                Software
              </div>
              <div className="text-xl font-semibold text-accent sm:text-2xl">
                First
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-wider text-text-muted">
                Local
              </div>
              <div className="text-xl font-semibold text-accent sm:text-2xl">
                Ownership
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-wider text-text-muted">
                Future
              </div>
              <div className="text-xl font-semibold text-accent sm:text-2xl">
                Expandable
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>
    </div>
  );
}
