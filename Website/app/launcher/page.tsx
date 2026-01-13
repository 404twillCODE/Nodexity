"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const launcherFeatures = [
  {
    title: "Version Management",
    description: "Manage multiple Minecraft versions and installations from a single interface. Download, install, and switch between versions effortlessly.",
    details: [
      "Support for all Minecraft versions",
      "Automatic version detection",
      "Quick version switching",
      "Version history and rollback",
      "Custom version installations",
      "Snapshot and beta version support"
    ]
  },
  {
    title: "Profile System",
    description: "Create and manage multiple profiles for different mod configurations, resource packs, and game settings. Switch between profiles instantly.",
    details: [
      "Multiple profile support",
      "Profile-specific mod configurations",
      "Resource pack management per profile",
      "Custom game settings per profile",
      "Profile sharing and export",
      "Quick profile switching"
    ]
  },
  {
    title: "Mod Management",
    description: "Install, update, and manage mods directly from the launcher. Support for Fabric, Forge, Quilt, and other mod loaders with automatic compatibility checking.",
    details: [
      "Mod installation and updates",
      "Mod loader support (Fabric, Forge, Quilt)",
      "Automatic dependency resolution",
      "Mod compatibility checking",
      "Mod search and discovery",
      "Mod version management"
    ]
  },
  {
    title: "Server Integration",
    description: "Seamless integration with HexNode Server Manager. Launch directly into servers you manage, or connect to any Minecraft server.",
    details: [
      "Direct integration with Server Manager",
      "Quick connect to managed servers",
      "Server favorites and history",
      "Direct server connection",
      "Server status indicators",
      "One-click server joining"
    ]
  },
  {
    title: "Resource Packs",
    description: "Manage resource packs and shaders with an intuitive interface. Enable, disable, and organize packs per profile.",
    details: [
      "Resource pack management",
      "Shader pack support",
      "Pack organization and sorting",
      "Per-profile pack configurations",
      "Pack preview and testing",
      "Automatic pack updates"
    ]
  },
  {
    title: "Settings & Customization",
    description: "Comprehensive settings for Java arguments, memory allocation, window settings, and more. Customize your Minecraft experience to your preferences.",
    details: [
      "Java arguments configuration",
      "Memory allocation settings",
      "Window size and fullscreen options",
      "Performance optimization settings",
      "Custom launch arguments",
      "Settings profiles and presets"
    ]
  },
  {
    title: "Update Management",
    description: "Automatic updates for Minecraft, mods, and the launcher itself. Stay up-to-date with the latest versions and features.",
    details: [
      "Automatic Minecraft updates",
      "Mod update notifications",
      "Launcher auto-updates",
      "Update scheduling options",
      "Update history and changelogs",
      "Rollback capabilities"
    ]
  },
  {
    title: "Local-First Design",
    description: "All game files, mods, and configurations stored locally on your machine. Complete control over your Minecraft installations with no cloud dependencies.",
    details: [
      "All data stored locally",
      "No cloud synchronization required",
      "Complete privacy and control",
      "Offline operation support",
      "Portable installations",
      "Full data ownership"
    ]
  }
];

const imagePlaceholders = [
  {
    id: 1,
    title: "Launcher Interface",
    aspectRatio: "16/10",
    gradient: "from-accent/20 via-accent/10 to-transparent"
  },
  {
    id: 2,
    title: "Version Selector",
    aspectRatio: "16/9",
    gradient: "from-accent/15 via-accent/5 to-transparent"
  },
  {
    id: 3,
    title: "Profile Manager",
    aspectRatio: "4/3",
    gradient: "from-accent/10 via-accent/5 to-transparent"
  },
  {
    id: 4,
    title: "Mod Browser",
    aspectRatio: "16/10",
    gradient: "from-accent/20 via-accent/10 to-transparent"
  },
  {
    id: 5,
    title: "Server List",
    aspectRatio: "16/9",
    gradient: "from-accent/15 via-accent/5 to-transparent"
  },
  {
    id: 6,
    title: "Settings Panel",
    aspectRatio: "16/10",
    gradient: "from-accent/10 via-accent/5 to-transparent"
  }
];

function ImagePlaceholder({ placeholder, index }: { placeholder: typeof imagePlaceholders[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 25 }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-lg border border-border/50 bg-background-secondary/50 backdrop-blur-sm">
        <div 
          className={`relative bg-gradient-to-br ${placeholder.gradient}`}
          style={{ aspectRatio: placeholder.aspectRatio }}
        >
          {/* Animated grid pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(46, 242, 162, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(46, 242, 162, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-lg border-2 border-dashed border-accent/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs font-mono text-text-muted uppercase tracking-wider">
                {placeholder.title}
              </p>
            </div>
          </div>

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );
}

export default function LauncherPage() {
  const heroImageRef = useRef(null);
  const heroImageInView = useInView(heroImageRef, { once: true, margin: "-100px" });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 25 }}
        className="mb-12"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors font-mono mb-8"
        >
          ← Back to Overview
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl lg:text-6xl font-mono">
            LAUNCHER
          </h1>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
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
        <p className="text-lg leading-relaxed text-text-secondary sm:text-xl max-w-3xl">
          Custom Minecraft launcher application for managing game installations,
          mods, and profiles. Seamlessly integrates with HexNode server management
          for a complete Minecraft ecosystem experience.
        </p>
      </motion.div>

      {/* Hero Image Section */}
      <motion.div
        ref={heroImageRef}
        initial={{ opacity: 0, y: 40 }}
        animate={heroImageInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 100, damping: 25 }}
        className="mb-16"
      >
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-background-secondary/50 backdrop-blur-sm">
          <div className="relative aspect-[21/9] bg-gradient-to-br from-accent/20 via-accent/10 to-transparent">
            {/* Animated grid pattern */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(46, 242, 162, 0.15) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(46, 242, 162, 0.15) 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px'
              }}
            />
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-xl border-2 border-dashed border-accent/40 flex items-center justify-center bg-background/20 backdrop-blur-sm">
                  <svg className="w-12 h-12 text-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-mono text-text-muted uppercase tracking-wider mb-1">
                    Launcher Interface Preview
                  </p>
                  <p className="text-xs text-text-muted/60">
                    Screenshot coming soon
                  </p>
                </div>
              </div>
            </div>

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Image Gallery Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 100, damping: 25 }}
        className="mb-16"
      >
        <h2 className="text-2xl font-semibold text-text-primary font-mono mb-6">
          Interface Previews
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imagePlaceholders.map((placeholder, index) => (
            <ImagePlaceholder key={placeholder.id} placeholder={placeholder} index={index} />
          ))}
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="space-y-8">
        {launcherFeatures.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 25 }}
            className="system-card p-8"
          >
            <h2 className="text-2xl font-semibold text-text-primary font-mono mb-3">
              {feature.title}
            </h2>
            <p className="text-base leading-relaxed text-text-secondary mb-4">
              {feature.description}
            </p>
            <div className="space-y-2 border-t border-border pt-4">
              {feature.details.map((detail, detailIndex) => (
                <div key={detailIndex} className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary">
                    {detail}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
