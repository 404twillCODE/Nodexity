"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const hostingFeatures = [
  {
    title: "Global Edge Network",
    description: "Premium hosting infrastructure with 50+ edge locations worldwide. Deploy your servers close to your players for minimal latency and maximum performance.",
    details: [
      "50+ edge locations across all continents",
      "Automatic routing to nearest data center",
      "Low-latency connections worldwide",
      "Geographic redundancy and failover",
      "Real-time network monitoring",
      "Custom routing configurations"
    ]
  },
  {
    title: "Dedicated Resources",
    description: "Guaranteed performance SLAs with dedicated CPU, RAM, and storage. No resource contention, consistent performance for your mission-critical workloads.",
    details: [
      "Dedicated CPU cores per instance",
      "Guaranteed RAM allocation",
      "SSD storage with high IOPS",
      "Performance SLAs and uptime guarantees",
      "Resource monitoring and alerts",
      "Automatic scaling capabilities"
    ]
  },
  {
    title: "Security & Protection",
    description: "Enterprise-grade security with built-in DDoS protection, CDN integration, and advanced firewall configurations. Keep your servers safe from attacks.",
    details: [
      "Built-in DDoS protection and mitigation",
      "CDN integration for global content delivery",
      "Advanced firewall and security rules",
      "Custom SSL certificate management",
      "IP whitelisting and access controls",
      "Security monitoring and threat detection"
    ]
  },
  {
    title: "High Availability",
    description: "Automatic failover and redundancy across regions ensures your servers stay online even during hardware failures or regional outages.",
    details: [
      "Automatic failover between regions",
      "Multi-region redundancy",
      "Health monitoring and auto-recovery",
      "Backup and disaster recovery",
      "Zero-downtime deployments",
      "SLA-backed uptime guarantees"
    ]
  },
  {
    title: "Monitoring & Analytics",
    description: "Advanced monitoring dashboard with real-time metrics, performance analytics, and alerting. Track your server performance and resource usage.",
    details: [
      "Real-time performance metrics",
      "Resource usage analytics",
      "Custom alerting and notifications",
      "Historical performance data",
      "Network traffic analysis",
      "Player connection statistics"
    ]
  },
  {
    title: "Support & Management",
    description: "24/7 priority support with dedicated account management. Get help when you need it with expert support for your infrastructure.",
    details: [
      "24/7 priority support access",
      "Dedicated account management",
      "Expert infrastructure guidance",
      "Custom configuration assistance",
      "API access for automation",
      "Comprehensive documentation"
    ]
  }
];

const recycleHostFeatures = [
  {
    title: "Sustainable Infrastructure",
    description: "Eco-friendly hosting powered by repurposed enterprise hardware. Reduce electronic waste while getting reliable hosting for your projects.",
    details: [
      "Repurposed enterprise-grade hardware",
      "Reduced environmental impact",
      "Carbon offset tracking",
      "Sustainable infrastructure practices",
      "Hardware lifecycle management",
      "Environmental impact reporting"
    ]
  },
  {
    title: "Cost-Effective Pricing",
    description: "Budget-friendly hosting without compromising on reliability. Perfect for development, staging, and smaller production deployments.",
    details: [
      "Affordable pricing for all budgets",
      "Flexible resource allocation",
      "Pay-as-you-go options",
      "No long-term commitments required",
      "Transparent pricing structure",
      "Cost-effective for small projects"
    ]
  },
  {
    title: "Shared Resources",
    description: "Efficient resource sharing with fair usage policies. Get reliable performance while sharing infrastructure costs with other users.",
    details: [
      "Shared infrastructure model",
      "Fair usage policies",
      "Resource allocation management",
      "Performance monitoring",
      "Automatic resource balancing",
      "Community-friendly hosting"
    ]
  },
  {
    title: "Standard Security",
    description: "Essential security features including DDoS protection, SSL certificates, and basic firewall rules. Keep your servers protected without premium costs.",
    details: [
      "Standard DDoS protection",
      "Included SSL certificates",
      "Basic firewall configurations",
      "Security best practices",
      "Regular security updates",
      "Standard monitoring tools"
    ]
  },
  {
    title: "Community Support",
    description: "Access to community forums, documentation, and standard support channels. Get help from the community and comprehensive guides.",
    details: [
      "Community forum access",
      "Comprehensive documentation",
      "Standard support channels",
      "Knowledge base articles",
      "Community-driven solutions",
      "Regular updates and announcements"
    ]
  },
  {
    title: "Flexible Deployment",
    description: "Flexible resource allocation for variable workloads. Scale up or down based on your needs without premium pricing tiers.",
    details: [
      "Variable resource allocation",
      "Flexible scaling options",
      "Custom configurations available",
      "Multiple server deployment",
      "Resource adjustment on demand",
      "No rigid tier restrictions"
    ]
  }
];

const imagePlaceholders = [
  {
    id: 1,
    title: "Hosting Dashboard",
    aspectRatio: "16/10",
    gradient: "from-accent/20 via-accent/10 to-transparent"
  },
  {
    id: 2,
    title: "Server Management",
    aspectRatio: "16/9",
    gradient: "from-accent/15 via-accent/5 to-transparent"
  },
  {
    id: 3,
    title: "Resource Monitoring",
    aspectRatio: "4/3",
    gradient: "from-accent/10 via-accent/5 to-transparent"
  },
  {
    id: 4,
    title: "Network Overview",
    aspectRatio: "16/10",
    gradient: "from-accent/20 via-accent/10 to-transparent"
  },
  {
    id: 5,
    title: "Security Settings",
    aspectRatio: "16/9",
    gradient: "from-accent/15 via-accent/5 to-transparent"
  },
  {
    id: 6,
    title: "Analytics Dashboard",
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

export default function HostingPage() {
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
            HOSTING
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
          Premium and sustainable hosting solutions for Minecraft servers.
          Choose between enterprise-grade infrastructure or eco-friendly budget hosting.
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-mono text-text-muted uppercase tracking-wider mb-1">
                    Hosting Dashboard Preview
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

      {/* Premium Hosting Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 100, damping: 25 }}
        className="mb-16"
      >
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-3xl font-semibold text-text-primary font-mono">
            PREMIUM HOSTING
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
        <p className="text-base leading-relaxed text-text-secondary sm:text-lg mb-8 max-w-3xl">
          Enterprise-grade hosting infrastructure built for demanding applications.
          Delivers exceptional performance, reliability, and support for mission-critical workloads.
        </p>
        <div className="space-y-8">
          {hostingFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 25 }}
              className="system-card p-8"
            >
              <h3 className="text-2xl font-semibold text-text-primary font-mono mb-3">
                {feature.title}
              </h3>
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
      </motion.div>

      {/* Recycle Host Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 100, damping: 25 }}
        className="mb-16"
      >
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-3xl font-semibold text-text-primary font-mono">
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
        <p className="text-base leading-relaxed text-text-secondary sm:text-lg mb-8 max-w-3xl">
          Sustainable hosting powered by recycled and repurposed hardware.
          Eco-friendly alternative without compromising on reliability. Perfect for development, staging, and budget-conscious deployments.
        </p>
        <div className="space-y-8">
          {recycleHostFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 25 }}
              className="system-card p-8"
            >
              <h3 className="text-2xl font-semibold text-text-primary font-mono mb-3">
                {feature.title}
              </h3>
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
      </motion.div>
    </div>
  );
}
