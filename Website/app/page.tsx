"use client";

import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";
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
  id,
}: {
  children: React.ReactNode;
  className?: string;
  bootComplete?: boolean;
  id?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      id={id}
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

const allFeatures = [
  "Create servers with multiple server types (Paper, Spigot, Vanilla, Fabric, Forge, and more)",
  "Full server lifecycle management (start, stop, restart, kill)",
  "Integrated server console with command execution and real-time output",
  "World manager for organizing and managing multiple world files",
  "Plugin manager for installing and managing server plugins",
  "File editor for direct server configuration file editing",
  "Resource monitoring with CPU, RAM, and disk usage tracking",
  "Local-first architecture - all data stored on your machine, no cloud dependencies"
];

const defaultFeatures = [
  "Create servers with multiple server types (Paper, Spigot, Vanilla, Fabric, Forge, and more)",
  "Integrated server console with command execution and real-time output",
  "Local-first architecture - all data stored on your machine, no cloud dependencies"
];

function FeatureList() {
  const [isExpanded, setIsExpanded] = useState(false);
  const hiddenFeatures = allFeatures.filter(f => !defaultFeatures.includes(f));

  return (
    <div className="space-y-3 border-t border-border pt-6">
      {/* Always show default features */}
      {defaultFeatures.map((feature, index) => (
        <motion.div
          key={feature}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 + (index * 0.1), type: "spring", stiffness: 200, damping: 25 }}
          className="flex items-start gap-3"
        >
          <span className="mt-0.5 text-accent">→</span>
          <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
            {feature}
          </span>
        </motion.div>
      ))}
      
      {/* Expandable hidden features */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            key="expanded-features"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden space-y-3"
          >
            {hiddenFeatures.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ 
                  delay: index * 0.05, 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 25 
                }}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 text-accent">→</span>
                <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                  {feature}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-4 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent hover:text-accent/80 transition-colors"
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="inline-block"
        >
          ▼
        </motion.span>
        {isExpanded ? "Show Less" : "Show More Features"}
      </motion.button>
    </div>
  );
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

      {/* Development Notice Banner */}
      {bootComplete && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="full-width-section relative z-50 border-b border-accent/20 bg-accent/5"
        >
          <div className="section-content mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider text-accent/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
              </span>
              <span>Website in active development</span>
            </div>
          </div>
        </motion.div>
      )}

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
                  application for server creation and management, and planned hosting
                  infrastructure. All data remains local and portable by default.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={bootComplete ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  className="flex gap-4 justify-center border-t border-border pt-8"
                >
                  <a
                    href="https://github.com/404twillCODE/Hexnode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary block"
                  >
                    <span className="relative z-20 font-mono">DOCUMENTATION</span>
                  </a>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={bootComplete ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  className="grid grid-cols-2 gap-12 pt-8 border-t border-border"
                >
                    <div>
                      <div className="mb-3 text-xs font-mono uppercase tracking-wider text-text-muted">
                        In Development
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
                      </div>
                    </div>
                    <div>
                      <div className="mb-3 text-xs font-mono uppercase tracking-wider text-text-muted">
                        Planned
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
                            Recycle Host
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
                            Hosting
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
      <AnimatedSection bootComplete={bootComplete} id="software-section" className="full-width-section relative bg-background-secondary">
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
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
                SOFTWARE
              </h2>
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-mono uppercase tracking-wider text-accent"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
                </span>
                Development
              </motion.span>
            </div>
          </motion.div>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
            <div className="order-1">
              <p className="mb-6 text-base leading-relaxed text-text-secondary sm:text-lg">
                Desktop application for creating and managing Minecraft servers.
                Handles server lifecycle, world management, backups, and version
                control. All data stored locally on host machine.
              </p>
              <FeatureList />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 25 }}
                className="mt-8"
              >
                <div className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-4">
                    <motion.button
                      disabled
                      className="btn-primary relative cursor-not-allowed opacity-70"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="relative z-20 font-mono">DOWNLOAD</span>
                    </motion.button>
                    <Link
                      href="/software"
                      className="btn-secondary"
                    >
                      <span className="relative z-20 font-mono">LEARN MORE</span>
                    </Link>
                  </div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <motion.span
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.75, 0, 0.75]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                        className="absolute inline-flex h-full w-full rounded-full bg-accent/60"
                      ></motion.span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent/60"></span>
                    </span>
                    Coming soon
                  </motion.span>
                </div>
              </motion.div>
            </div>
            <div className="order-2">
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
        </div>
      </AnimatedSection>

      {/* Module: Recycle Host */}
      <AnimatedSection bootComplete={bootComplete} className="full-width-section relative">
        <div className="section-content mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
            <div className="order-2 lg:order-1 lg:pt-16">
              <FloatingCard delay={0.3} bootComplete={bootComplete}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="system-card p-6 opacity-60"
                >
                  <div className="card-content space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-28 bg-text-primary/15 rounded"></div>
                      <div className="h-4 w-20 bg-border/50 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="flex items-center gap-1">
                          <span className="text-text-muted">Region:</span>
                          <span className="h-3 w-16 bg-text-primary/15 rounded"></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-text-muted">Status:</span>
                          <span className="h-3 w-12 bg-border/50 rounded"></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-mono">
                        <span className="text-text-muted">Resources:</span>
                        <span className="h-3 w-20 bg-text-primary/15 rounded"></span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-border pt-4">
                      <div className="h-7 flex-1 bg-border/50 rounded"></div>
                      <div className="h-7 flex-1 bg-border/50 rounded"></div>
                    </div>
                  </div>
                </motion.div>
              </FloatingCard>
            </div>
            <div className="order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
                className="mb-10"
              >
                <div className="flex items-center gap-4 mb-3">
                  <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
                    RECYCLE HOST
                  </h2>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-mono uppercase tracking-wider text-accent"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
                    </span>
                    Planned
                  </motion.span>
                </div>
              </motion.div>
              <p className="mb-6 text-base leading-relaxed text-text-secondary sm:text-lg">
                Sustainable hosting powered by recycled and repurposed hardware.
                Eco-friendly alternative without compromising on reliability. Perfect
                for development, staging, and budget-conscious deployments.
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
                    Repurposed enterprise hardware for reduced environmental impact
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
                    Cost-effective pricing for budget-conscious projects
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-text-muted">→</span>
                  <span className="text-sm leading-relaxed text-text-muted sm:text-base">
                    Standard DDoS protection and security features
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Module: Hosting */}
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
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
                HOSTING
              </h2>
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-mono uppercase tracking-wider text-accent"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
                </span>
                Planned
              </motion.span>
            </div>
          </motion.div>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
            <div className="order-1">
              <p className="mb-6 text-base leading-relaxed text-text-secondary sm:text-lg">
                Premium hosting infrastructure built for demanding applications.
                Delivers exceptional performance, reliability, and support for
                mission-critical workloads on global edge network.
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
                    Global edge network with 50+ locations worldwide
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
                    Dedicated resources with guaranteed performance SLAs
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-text-muted">→</span>
                  <span className="text-sm leading-relaxed text-text-muted sm:text-base">
                    Built-in CDN and DDoS protection
                  </span>
                </motion.div>
              </div>
            </div>
            <div className="order-2">
              <FloatingCard delay={0.5} bootComplete={bootComplete}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="system-card p-6 opacity-60"
                >
                  <div className="card-content space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-32 bg-text-primary/15 rounded"></div>
                      <div className="h-4 w-16 bg-border/50 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="flex items-center gap-1">
                          <span className="text-text-muted">Region:</span>
                          <span className="h-3 w-16 bg-text-primary/15 rounded"></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-text-muted">Status:</span>
                          <span className="h-3 w-12 bg-border/50 rounded"></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-mono">
                        <span className="text-text-muted">Resources:</span>
                        <span className="h-3 w-20 bg-text-primary/15 rounded"></span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-border pt-4">
                      <div className="h-7 flex-1 bg-border/50 rounded"></div>
                      <div className="h-7 flex-1 bg-border/50 rounded"></div>
                    </div>
                  </div>
                </motion.div>
              </FloatingCard>
            </div>
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
                Local-first, always. All server data remains on user-controlled hardware
                by default. No cloud dependencies or platform lock-in. When you need cloud
                hosting, we provide that option—but local ownership is the foundation.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 25 }}
              >
                Environmental responsibility through recycled hardware. Recycle Host repurposes
                enterprise PCs, reducing electronic waste while delivering reliable hosting.
                Sustainable infrastructure that doesn&apos;t compromise on performance or reliability.
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
