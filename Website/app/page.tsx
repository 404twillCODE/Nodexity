"use client";

import { motion, useInView, useScroll, useTransform, AnimatePresence, useAnimation } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import BootSequence from "@/components/BootSequence";
import HexNodeTyping from "@/components/HexNodeTyping";

// Hook to track scroll direction
function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      if (direction !== scrollDirection && (scrollY - lastScrollY > 10 || scrollY - lastScrollY < -10)) {
        setScrollDirection(direction);
      }
      setLastScrollY(scrollY > 0 ? scrollY : 0);
    };
    window.addEventListener('scroll', updateScrollDirection);
    return () => window.removeEventListener('scroll', updateScrollDirection);
  }, [scrollDirection, lastScrollY]);

  return scrollDirection;
}

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
  scrollDirection = 'down',
}: {
  children: React.ReactNode;
  className?: string;
  bootComplete?: boolean;
  id?: string;
  scrollDirection?: 'up' | 'down';
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });

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
        delay: scrollDirection === 'up' ? 0.3 : 0,
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
                viewport={{ once: false }}
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
  const scrollDirection = useScrollDirection();
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [creeperWalking, setCreeperWalking] = useState(false);
  const [creeperLooking, setCreeperLooking] = useState(false);
  const [exploded, setExploded] = useState(false);

  // Helper to reverse delay based on scroll direction
  const getDelay = (baseDelay: number, maxDelay: number = 0.4) => {
    if (scrollDirection === 'up') {
      return maxDelay - baseDelay;
    }
    return baseDelay;
  };

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
                  animate={bootComplete ? { 
                    opacity: 1,
                  } : { opacity: 0, y: 20 }}
                  transition={{ 
                    delay: 0.3,
                    duration: 0.8,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  className="text-base leading-relaxed text-text-secondary sm:text-lg lg:text-xl font-mono relative"
                >
                  <motion.span
                    animate={bootComplete ? {
                      y: [0, -2, 0],
                    } : { y: 0 }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.1
                    }}
                    className="block"
                  >
                    Local-first Minecraft server management system. Provides desktop
                    application for server creation and management, and planned hosting
                    infrastructure. All data remains local and portable by default.
                  </motion.span>
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={bootComplete ? { 
                    opacity: 1, 
                  } : { opacity: 0, y: 20 }}
                  transition={{ 
                    delay: 0.5,
                    duration: 0.8,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  className="flex gap-4 justify-center border-t border-border pt-8"
                >
                  <motion.div
                    animate={bootComplete ? {
                      y: [0, -2, 0],
                    } : {}}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.3
                    }}
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
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={bootComplete ? { 
                    opacity: 1, 
                  } : { opacity: 0, y: 20 }}
                  transition={{ 
                    delay: 0.7,
                    duration: 0.8,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  className="grid grid-cols-2 gap-12 pt-8 border-t border-border"
                >
                  <motion.div
                    animate={bootComplete ? {
                      y: [0, -2, 0],
                    } : {}}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.5
                    }}
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
                            Server Manager
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
                            Launcher
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
                            Recycle Hosting
                          </span>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={bootComplete ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 1.1, type: "spring", stiffness: 200, damping: 25 }}
                          className="flex items-center justify-center gap-2.5"
                        >
                          <div className="h-1.5 w-1.5 bg-border rounded-full"></div>
                          <span className="text-sm text-text-muted font-mono">
                            Premium Hosting
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
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
          className="full-width-section relative h-1 overflow-hidden bg-background"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: false }}
            transition={{ 
              type: "spring",
              stiffness: 50,
              damping: 20,
            }}
            className="h-full origin-left block-divider"
          />
        </motion.div>
      )}

      {/* Module: Server Manager */}
      <AnimatedSection bootComplete={bootComplete} scrollDirection={scrollDirection} id="software-section" className="full-width-section relative bg-background-secondary">
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
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="order-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
                className="mb-10"
              >
                <div className="flex items-center gap-4 mb-3">
                  <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
                    SERVER MANAGER
                  </h2>
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false }}
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
              <p className="mb-6 text-base leading-relaxed text-text-secondary sm:text-lg">
                Desktop application for creating and managing Minecraft servers.
                Handles server lifecycle, world management, backups, and version
                control. All data stored locally on host machine.
              </p>
              <FeatureList />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ delay: getDelay(0.4, 0.4), type: "spring", stiffness: 100, damping: 25 }}
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
                    viewport={{ once: false }}
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
            <div className="order-2 flex items-center">
              <FloatingCard delay={0.5} bootComplete={bootComplete}>
                <motion.div
                  whileHover={{ y: -4 }}
                  animate={bootComplete ? {
                    y: [0, -3, 0],
                  } : { y: 0 }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="system-card p-6 opacity-60 w-full"
                >
                  <div className="card-content space-y-4">
                    {/* Server Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-accent/20 to-accent/5 rounded border border-accent/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <div className="h-3.5 w-28 bg-text-primary/20 rounded"></div>
                          <div className="h-2.5 w-20 bg-text-muted/30 rounded"></div>
                        </div>
                      </div>
                      <div className="h-6 w-16 bg-accent/30 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-accent rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Server Stats */}
                    <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-text-muted uppercase">Version</div>
                        <div className="h-3 w-16 bg-text-primary/15 rounded"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-text-muted uppercase">Players</div>
                        <div className="h-3 w-12 bg-accent/20 rounded"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-text-muted uppercase">CPU</div>
                        <div className="h-3 w-14 bg-accent/15 rounded"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-text-muted uppercase">RAM</div>
                        <div className="h-3 w-14 bg-text-primary/15 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Console Preview */}
                    <div className="border-t border-border pt-3">
                      <div className="text-[10px] font-mono text-text-muted uppercase mb-2">Console</div>
                      <div className="bg-background-secondary/50 rounded border border-border/50 p-2 space-y-1">
                        <div className="h-2 w-full bg-text-primary/10 rounded"></div>
                        <div className="h-2 w-3/4 bg-text-primary/10 rounded"></div>
                        <div className="h-2 w-5/6 bg-accent/20 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex gap-2 border-t border-border pt-3">
                      <div className="h-8 flex-1 bg-accent/20 border border-accent/30 rounded flex items-center justify-center">
                        <div className="h-3 w-10 bg-accent/40 rounded"></div>
                      </div>
                      <div className="h-8 w-8 bg-border/50 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FloatingCard>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Module: Launcher */}
      <AnimatedSection bootComplete={bootComplete} scrollDirection={scrollDirection} className="full-width-section relative">
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
                radial-gradient(circle at 50% 50%, rgba(46, 242, 162, 0.008) 0%, transparent 50%)
              `,
            }}
          />
        </motion.div>
        <div className="section-content mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="order-1">
              <FloatingCard delay={0.5} bootComplete={bootComplete}>
                <motion.div
                  whileHover={{ y: -4 }}
                  animate={{
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="system-card p-6 opacity-60"
                >
                  <div className="card-content space-y-4">
                    {/* Game Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg border border-accent/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <div className="h-3.5 w-32 bg-text-primary/20 rounded"></div>
                          <div className="h-2.5 w-24 bg-text-muted/30 rounded"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Profile & Version */}
                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-text-muted uppercase">Profile</div>
                        <div className="h-3 w-20 bg-border/50 rounded"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-text-muted uppercase">Version</div>
                        <div className="h-3 w-16 bg-text-primary/15 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Mods List */}
                    <div className="border-t border-border pt-3">
                      <div className="text-[10px] font-mono text-text-muted uppercase mb-2">Mods</div>
                      <div className="space-y-1.5">
                        <div className="h-2.5 w-full bg-accent/15 rounded"></div>
                        <div className="h-2.5 w-4/5 bg-accent/10 rounded"></div>
                        <div className="h-2.5 w-3/4 bg-text-primary/10 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Play Button */}
                    <div className="pt-2 border-t border-border">
                      <div className="h-10 w-full bg-accent/20 border border-accent/30 rounded flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-accent/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                          <div className="h-3 w-16 bg-accent/40 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FloatingCard>
            </div>
            <div className="order-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
                className="mb-10"
              >
                <div className="flex items-center gap-4 mb-3">
                  <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
                    LAUNCHER
                  </h2>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: false }}
                    transition={{ delay: getDelay(0.2, 0.2), type: "spring", stiffness: 200, damping: 20 }}
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
                Custom Minecraft launcher application for managing game installations,
                mods, and profiles. Seamlessly integrates with HexNode server management
                for a complete Minecraft ecosystem experience.
              </p>
              <div className="space-y-3 border-t border-border pt-6">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                  transition={{ delay: getDelay(0.1, 0.3), type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-text-muted">→</span>
                  <span className="text-sm leading-relaxed text-text-muted sm:text-base">
                    Manage multiple Minecraft versions and installations
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                  transition={{ delay: getDelay(0.2, 0.3), type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-text-muted">→</span>
                  <span className="text-sm leading-relaxed text-text-muted sm:text-base">
                    Profile management for different mod configurations
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false }}
                  transition={{ delay: getDelay(0.3, 0.3), type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-text-muted">→</span>
                  <span className="text-sm leading-relaxed text-text-muted sm:text-base">
                    Direct integration with HexNode server manager
                  </span>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ delay: getDelay(0.4, 0.4), type: "spring", stiffness: 100, damping: 25 }}
                className="mt-8"
              >
                <Link
                  href="/launcher"
                  className="btn-secondary"
                >
                  <span className="relative z-20 font-mono">LEARN MORE</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Module: Recycle Hosting */}
      <AnimatedSection bootComplete={bootComplete} scrollDirection={scrollDirection} className="full-width-section relative bg-background-secondary">
        <div className="section-content mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="order-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
                className="mb-10"
              >
                <div className="flex items-center gap-4 mb-3">
                  <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
                    RECYCLE HOSTING
                  </h2>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: false }}
                    transition={{ delay: getDelay(0.2, 0.2), type: "spring", stiffness: 200, damping: 20 }}
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
                viewport={{ once: false }}
                  transition={{ delay: getDelay(0.1, 0.3), type: "spring", stiffness: 200, damping: 25 }}
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
                viewport={{ once: false }}
                  transition={{ delay: getDelay(0.2, 0.3), type: "spring", stiffness: 200, damping: 25 }}
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
                viewport={{ once: false }}
                  transition={{ delay: getDelay(0.3, 0.3), type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-text-muted">→</span>
                  <span className="text-sm leading-relaxed text-text-muted sm:text-base">
                    Standard DDoS protection and security features
                  </span>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ delay: getDelay(0.4, 0.4), type: "spring", stiffness: 100, damping: 25 }}
                className="mt-8"
              >
                <Link
                  href="/hosting#recycle-hosting"
                  className="btn-secondary"
                >
                  <span className="relative z-20 font-mono">LEARN MORE</span>
                </Link>
              </motion.div>
            </div>
            <div className="order-2 flex items-center">
              <FloatingCard delay={0.3} bootComplete={bootComplete}>
                <motion.div
                  whileHover={{ y: -4 }}
                  animate={{
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3
                  }}
                  className="system-card p-6 opacity-60 w-full"
                >
                  <div className="card-content space-y-4">
                    {/* Hosting Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-accent/20 to-accent/5 rounded border border-accent/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <div className="h-3.5 w-28 bg-text-primary/20 rounded"></div>
                          <div className="h-2.5 w-20 bg-text-muted/30 rounded"></div>
                        </div>
                      </div>
                      <div className="h-6 w-14 bg-accent/30 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-accent rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Hosting Stats */}
                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-text-muted uppercase">Region</div>
                        <div className="h-3 w-16 bg-text-primary/15 rounded"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-text-muted uppercase">Status</div>
                        <div className="h-3 w-12 bg-border/50 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Resources */}
                    <div className="border-t border-border pt-3">
                      <div className="text-[10px] font-mono text-text-muted uppercase mb-2">Resources</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-muted">CPU:</span>
                          <div className="h-2 w-20 bg-accent/20 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-muted">RAM:</span>
                          <div className="h-2 w-16 bg-accent/15 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-muted">Storage:</span>
                          <div className="h-2 w-24 bg-text-primary/10 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 border-t border-border pt-3">
                      <div className="h-8 flex-1 bg-accent/20 border border-accent/30 rounded flex items-center justify-center">
                        <div className="h-3 w-12 bg-accent/40 rounded"></div>
                      </div>
                      <div className="h-8 w-8 bg-border/50 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FloatingCard>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Module: Premium Hosting */}
      <AnimatedSection bootComplete={bootComplete} scrollDirection={scrollDirection} className="full-width-section relative">
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
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="order-1">
              <FloatingCard delay={0.5} bootComplete={bootComplete}>
                <motion.div
                  whileHover={{ y: -4 }}
                  animate={bootComplete ? {
                    y: [0, -3, 0],
                  } : { y: 0 }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="system-card p-6 opacity-60 w-full"
                >
                  <div className="card-content space-y-4">
                    {/* Hosting Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-accent/20 to-accent/5 rounded border border-accent/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <div className="h-3.5 w-28 bg-text-primary/20 rounded"></div>
                          <div className="h-2.5 w-20 bg-text-muted/30 rounded"></div>
                        </div>
                      </div>
                      <div className="h-6 w-14 bg-accent/30 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-accent rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Hosting Stats */}
                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-text-muted uppercase">Region</div>
                        <div className="h-3 w-16 bg-text-primary/15 rounded"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-text-muted uppercase">Status</div>
                        <div className="h-3 w-12 bg-border/50 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Resources */}
                    <div className="border-t border-border pt-3">
                      <div className="text-[10px] font-mono text-text-muted uppercase mb-2">Resources</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-muted">CPU:</span>
                          <div className="h-2 w-20 bg-accent/20 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-muted">RAM:</span>
                          <div className="h-2 w-16 bg-accent/15 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-muted">Storage:</span>
                          <div className="h-2 w-24 bg-text-primary/10 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 border-t border-border pt-3">
                      <div className="h-8 flex-1 bg-accent/20 border border-accent/30 rounded flex items-center justify-center">
                        <div className="h-3 w-12 bg-accent/40 rounded"></div>
                      </div>
                      <div className="h-8 w-8 bg-border/50 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FloatingCard>
            </div>
            <div className="order-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
                className="mb-10"
              >
                <div className="flex items-center gap-4 mb-3">
                  <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
                    PREMIUM HOSTING
                  </h2>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: false }}
                    transition={{ delay: getDelay(0.2, 0.2), type: "spring", stiffness: 200, damping: 20 }}
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
                Premium hosting infrastructure built for demanding applications.
                Delivers exceptional performance, reliability, and support for
                mission-critical workloads on global edge network.
              </p>
              <div className="space-y-3 border-t border-border pt-6">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                  transition={{ delay: getDelay(0.1, 0.3), type: "spring", stiffness: 200, damping: 25 }}
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
                viewport={{ once: false }}
                  transition={{ delay: getDelay(0.2, 0.3), type: "spring", stiffness: 200, damping: 25 }}
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
                viewport={{ once: false }}
                  transition={{ delay: getDelay(0.3, 0.3), type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 text-text-muted">→</span>
                  <span className="text-sm leading-relaxed text-text-muted sm:text-base">
                    Built-in CDN and DDoS protection
                  </span>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ delay: getDelay(0.4, 0.4), type: "spring", stiffness: 100, damping: 25 }}
                className="mt-8"
              >
                <Link
                  href="/hosting"
                  className="btn-secondary"
                >
                  <span className="relative z-20 font-mono">LEARN MORE</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Module: Philosophy */}
      <AnimatedSection bootComplete={bootComplete} scrollDirection={scrollDirection} className="full-width-section relative bg-background-secondary">
        <div className="section-content mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
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
                viewport={{ once: false }}
                transition={{ delay: getDelay(0.1, 0.3), type: "spring", stiffness: 100, damping: 25 }}
              >
                Local-first, always. All server data remains on user-controlled hardware
                by default. No cloud dependencies or platform lock-in. When you need cloud
                hosting, we provide that option—but local ownership is the foundation.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ delay: getDelay(0.2, 0.3), type: "spring", stiffness: 100, damping: 25 }}
              >
                Environmental responsibility through recycled hardware. Recycle Hosting repurposes
                enterprise PCs, reducing electronic waste while delivering reliable hosting.
                Sustainable infrastructure that doesn&apos;t compromise on performance or reliability.
              </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: getDelay(0.3, 0.3), type: "spring", stiffness: 100, damping: 25 }}
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

      {/* Easter Egg: Creeper Button - Hidden at bottom */}
      {bootComplete && (
        <AnimatedSection bootComplete={bootComplete} scrollDirection={scrollDirection} className="full-width-section relative bg-background-secondary">
          <div className="section-content mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="flex justify-center items-center min-h-[200px] relative">
              {/* Creeper walking animation */}
              {creeperWalking && !exploded && (
                <motion.div
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: "-140px", opacity: 1 }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                  className="absolute left-1/2 top-1/2 -translate-y-1/2 z-10"
                >
                  <motion.div
                    animate={creeperLooking ? {
                      scale: [1, 1.15, 1],
                    } : {
                      y: [0, -12, 0],
                    }}
                    transition={creeperLooking ? {
                      duration: 0.15,
                      repeat: Infinity,
                      ease: "easeInOut",
                    } : {
                      duration: 0.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-16 h-24 relative"
                  >
                    {/* Glow effect when looking */}
                    {creeperLooking && (
                      <motion.div
                        animate={{
                          opacity: [0.5, 1, 0.5],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 0.3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 bg-accent rounded-full blur-xl -z-10"
                        style={{ boxShadow: "0 0 40px rgba(46, 242, 162, 0.8)" }}
                      />
                    )}
                    {/* Realistic Minecraft Creeper - Blocky Design */}
                    <svg
                      viewBox="0 0 48 72"
                      className="w-full h-full drop-shadow-2xl relative z-10"
                      style={{ imageRendering: "pixelated", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.6))" }}
                    >
                      {/* Define pattern for pixelated green/grey texture */}
                      <defs>
                        <pattern id="creeperTexture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                          <rect width="4" height="4" fill="#1AAD1A" />
                          <rect x="0" y="0" width="2" height="2" fill="#2ECC40" />
                          <rect x="2" y="2" width="2" height="2" fill="#0D7B0D" />
                          <rect x="1" y="1" width="1" height="1" fill="#B8D4B8" />
                          <rect x="3" y="3" width="1" height="1" fill="#B8D4B8" />
                        </pattern>
                        <pattern id="creeperDarkTexture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                          <rect width="4" height="4" fill="#0D7B0D" />
                          <rect x="0" y="0" width="2" height="2" fill="#1AAD1A" />
                          <rect x="2" y="2" width="2" height="2" fill="#000" />
                        </pattern>
                      </defs>
                      
                      {/* Head - Square block */}
                      <rect x="12" y="4" width="24" height="24" fill="url(#creeperTexture)" />
                      <rect x="12" y="4" width="24" height="24" fill="none" stroke="#0D7B0D" strokeWidth="0.5" opacity="0.3" />
                      
                      {/* Head shading for 3D effect */}
                      <rect x="12" y="4" width="24" height="6" fill="#2ECC40" opacity="0.4" />
                      <rect x="12" y="22" width="24" height="6" fill="#0D7B0D" opacity="0.4" />
                      <rect x="12" y="4" width="6" height="24" fill="#2ECC40" opacity="0.3" />
                      <rect x="30" y="4" width="6" height="24" fill="#0D7B0D" opacity="0.3" />
                      
                      {/* Eyes - Two small black squares */}
                      <rect x="16" y="10" width="4" height="4" fill="#000" />
                      <rect x="28" y="10" width="4" height="4" fill="#000" />
                      
                      {/* Mouth - Downturned U shape (frown) - more pronounced */}
                      <rect x="14" y="18" width="20" height="8" fill="#000" />
                      <rect x="16" y="20" width="16" height="6" fill="#000" />
                      <rect x="18" y="22" width="12" height="4" fill="#000" />
                      <rect x="20" y="24" width="8" height="2" fill="#000" />
                      {/* Mouth highlight */}
                      <rect x="20" y="22" width="2" height="2" fill="#1AAD1A" opacity="0.3" />
                      <rect x="26" y="22" width="2" height="2" fill="#1AAD1A" opacity="0.3" />
                      
                      {/* Body - Elongated block */}
                      <rect x="10" y="28" width="28" height="32" fill="url(#creeperTexture)" />
                      <rect x="10" y="28" width="28" height="32" fill="none" stroke="#0D7B0D" strokeWidth="0.5" opacity="0.3" />
                      
                      {/* Body shading for 3D effect */}
                      <rect x="10" y="28" width="28" height="8" fill="#2ECC40" opacity="0.4" />
                      <rect x="10" y="52" width="28" height="8" fill="#0D7B0D" opacity="0.4" />
                      <rect x="10" y="28" width="6" height="32" fill="#2ECC40" opacity="0.3" />
                      <rect x="32" y="28" width="6" height="32" fill="#0D7B0D" opacity="0.3" />
                      
                      {/* Legs - Four short blocky legs in 2x2 grid pattern */}
                      {/* Left front leg */}
                      <rect x="10" y="60" width="9" height="8" fill="url(#creeperDarkTexture)" />
                      <rect x="10" y="66" width="9" height="2" fill="#000" />
                      <rect x="12" y="68" width="2" height="2" fill="#1AAD1A" />
                      <rect x="14" y="68" width="2" height="2" fill="#000" />
                      <rect x="16" y="68" width="2" height="2" fill="#1AAD1A" />
                      
                      {/* Right front leg */}
                      <rect x="19" y="60" width="9" height="8" fill="url(#creeperDarkTexture)" />
                      <rect x="19" y="66" width="9" height="2" fill="#000" />
                      <rect x="21" y="68" width="2" height="2" fill="#1AAD1A" />
                      <rect x="23" y="68" width="2" height="2" fill="#000" />
                      <rect x="25" y="68" width="2" height="2" fill="#1AAD1A" />
                      
                      {/* Left back leg (slightly offset to show depth) */}
                      <rect x="12" y="60" width="9" height="8" fill="url(#creeperDarkTexture)" opacity="0.9" />
                      <rect x="12" y="66" width="9" height="2" fill="#000" />
                      <rect x="14" y="68" width="2" height="2" fill="#1AAD1A" />
                      <rect x="16" y="68" width="2" height="2" fill="#000" />
                      <rect x="18" y="68" width="2" height="2" fill="#1AAD1A" />
                      
                      {/* Right back leg */}
                      <rect x="29" y="60" width="9" height="8" fill="url(#creeperDarkTexture)" />
                      <rect x="29" y="66" width="9" height="2" fill="#000" />
                      <rect x="31" y="68" width="2" height="2" fill="#1AAD1A" />
                      <rect x="33" y="68" width="2" height="2" fill="#000" />
                      <rect x="35" y="68" width="2" height="2" fill="#1AAD1A" />
                    </svg>
                  </motion.div>
                </motion.div>
              )}

              {/* Explosion effect on button */}
              {exploded && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 6, opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                >
                  <div className="w-40 h-40 bg-accent rounded-full blur-3xl" style={{ boxShadow: "0 0 100px rgba(46, 242, 162, 1)" }} />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="absolute inset-0 bg-accent rounded-full blur-2xl"
                  />
                </motion.div>
              )}

              {/* Easter Egg Button */}
              <motion.button
                onClick={() => {
                  if (!easterEggActive && !exploded) {
                    setEasterEggActive(true);
                    setCreeperWalking(true);
                    // After walking, creeper looks at you
                    setTimeout(() => {
                      setCreeperLooking(true);
                      // Then explodes
                      setTimeout(() => {
                        setExploded(true);
                        setTimeout(() => {
                          setCreeperWalking(false);
                          setCreeperLooking(false);
                        }, 800);
                      }, 1000);
                    }, 3000);
                  }
                }}
                className={`easter-egg-button ${exploded ? "exploded" : ""} ${easterEggActive ? "active" : ""}`}
                whileHover={!exploded && !creeperWalking ? { scale: 1.05 } : {}}
                whileTap={!exploded && !creeperWalking ? { scale: 0.95 } : {}}
                style={{
                  opacity: exploded ? 0 : 1,
                  pointerEvents: exploded || creeperWalking ? "none" : "auto",
                }}
              >
                <svg
                  viewBox="0 0 32 32"
                  height="24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="easter-egg-icon"
                >
                  <path d="M30 2H2v28h28z" fill="#52a535"></path>
                  <path
                    d="M24.4 13.2h-5.6v.47h5.6zm-5.6 8.4h-5.6v.47h5.6zm2.8 2.8h-2.8v.47h2.8zm-8.4 0h-2.8v.47h2.8zm0-11.2H7.6v.47h5.6z"
                    fill="#86d562"
                  ></path>
                  <path
                    d="M24.4 13.2V7.6h-5.6v5.6h-5.6V16h-2.8v8.4h2.8v-2.8h5.6v2.8h2.8V16h-2.8v-2.8zM13.2 7.6H7.6v5.6h5.6z"
                  ></path>
                  <path
                    d="M24.4 7.6h-5.6v.47h5.6zm-5.6 5.6h-5.6v.47h5.6zm-5.6-5.6H7.6v.47h5.6zm0 8.4h-2.8v.47h2.8zm8.4 0h-2.8v.47h2.8z"
                    fill="#2a641c"
                  ></path>
                </svg>

                <div className="easter-egg-text">
                  <span>MINECRAFT</span>
                  <span>I LOVE MC</span>
                  <span>CREEPERS</span>
                </div>
              </motion.button>
            </div>
          </div>
        </AnimatedSection>
      )}
    </div>
  );
}
