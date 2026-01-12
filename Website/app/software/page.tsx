"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const features = [
  {
    title: "Multiple Server Types",
    description: "Support for all major Minecraft server implementations including Paper, Spigot, Vanilla, Fabric, Forge, Purpur, Velocity, Waterfall, BungeeCord, and custom JAR files. Each server type is automatically configured with appropriate settings and version management.",
    details: [
      "Paper - High-performance Spigot fork with optimizations",
      "Spigot - Popular Bukkit fork with plugin support",
      "Vanilla - Official Minecraft server",
      "Fabric - Lightweight mod loader",
      "Forge - Full-featured modding platform",
      "Purpur - Paper fork with additional features",
      "Velocity - Modern proxy server",
      "Waterfall - BungeeCord fork",
      "BungeeCord - Network proxy server",
      "Custom JAR - Support for any server implementation"
    ]
  },
  {
    title: "Server Lifecycle Management",
    description: "Complete control over server operations with start, stop, restart, and kill commands. Real-time resource monitoring tracks CPU, RAM, and disk usage for each server instance. Configure RAM allocation per server with automatic system detection.",
    details: [
      "Start/Stop servers with one click",
      "Restart functionality with graceful shutdown",
      "Force kill option for unresponsive servers",
      "Real-time CPU usage monitoring",
      "RAM usage tracking (MB and GB)",
      "Disk space monitoring per server",
      "Per-server RAM allocation configuration",
      "Automatic system resource detection",
      "Aggregate statistics across all servers"
    ]
  },
  {
    title: "Integrated Server Console",
    description: "Full-featured console interface with real-time output streaming, command execution, and log management. View server output, send commands, and monitor server activity all from within the application.",
    details: [
      "Real-time console output streaming",
      "Command input and execution",
      "Auto-scroll to latest output",
      "Console log history",
      "Filter by output type (stdout/stderr)",
      "Timestamp tracking for all messages",
      "Copy console output to clipboard",
      "Clear console functionality"
    ]
  },
  {
    title: "World Manager",
    description: "Organize and manage multiple world files for each server. Create, delete, rename, and switch between worlds. Manage world backups and restore previous world states.",
    details: [
      "View all worlds for a server",
      "Create new world instances",
      "Delete and rename worlds",
      "Switch active world",
      "World backup management",
      "Restore from backups",
      "World file organization"
    ]
  },
  {
    title: "Plugin Manager",
    description: "Install, update, and manage server plugins directly from the application. View installed plugins, enable or disable them, and manage plugin configurations.",
    details: [
      "View installed plugins",
      "Plugin enable/disable controls",
      "Plugin configuration management",
      "Plugin information display",
      "Plugin version tracking"
    ]
  },
  {
    title: "File Editor",
    description: "Built-in text editor for direct server configuration file editing. Edit server.properties, bukkit.yml, spigot.yml, and other configuration files without leaving the application.",
    details: [
      "Syntax highlighting for configuration files",
      "Save changes directly to server files",
      "Edit multiple configuration files",
      "File validation and error checking",
      "Search and replace functionality"
    ]
  },
  {
    title: "Resource Monitoring",
    description: "Comprehensive resource tracking for CPU, RAM, and disk usage across all servers. Monitor system-wide statistics and individual server performance metrics.",
    details: [
      "Real-time CPU usage per server",
      "RAM usage tracking (MB and GB)",
      "Disk space monitoring",
      "Aggregate statistics dashboard",
      "System-wide resource overview",
      "Per-server performance metrics",
      "Historical performance tracking"
    ]
  },
  {
    title: "Server Properties Editor",
    description: "User-friendly interface for editing server.properties and other configuration files. No need to manually edit text files - use the intuitive editor with validation.",
    details: [
      "Visual property editor",
      "Configuration validation",
      "Default value suggestions",
      "Property descriptions and help text",
      "Save and apply changes"
    ]
  },
  {
    title: "Local-First Architecture",
    description: "All server data, configurations, and worlds are stored locally on your machine. No cloud dependencies, no data collection, complete privacy and control over your server infrastructure.",
    details: [
      "All data stored on local machine",
      "No cloud synchronization required",
      "Complete data privacy",
      "Portable server configurations",
      "Offline operation support",
      "Full control over data location"
    ]
  }
];

const imagePlaceholders = [
  {
    id: 1,
    title: "Server Dashboard",
    aspectRatio: "16/10",
    gradient: "from-accent/20 via-accent/10 to-transparent"
  },
  {
    id: 2,
    title: "Console Interface",
    aspectRatio: "16/9",
    gradient: "from-accent/15 via-accent/5 to-transparent"
  },
  {
    id: 3,
    title: "World Manager",
    aspectRatio: "4/3",
    gradient: "from-accent/10 via-accent/5 to-transparent"
  },
  {
    id: 4,
    title: "Resource Monitoring",
    aspectRatio: "16/10",
    gradient: "from-accent/20 via-accent/10 to-transparent"
  },
  {
    id: 5,
    title: "Plugin Manager",
    aspectRatio: "16/9",
    gradient: "from-accent/15 via-accent/5 to-transparent"
  },
  {
    id: 6,
    title: "File Editor",
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

export default function SoftwarePage() {
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
            SOFTWARE
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
            Development
          </motion.span>
        </div>
        <p className="text-lg leading-relaxed text-text-secondary sm:text-xl max-w-3xl">
          Desktop application for creating and managing Minecraft servers.
          Handles server lifecycle, world management, backups, and version
          control. All data stored locally on host machine.
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-mono text-text-muted uppercase tracking-wider mb-1">
                    Application Preview
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

          <div className="space-y-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
