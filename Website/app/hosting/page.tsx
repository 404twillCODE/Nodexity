"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as any },
};

const sectionVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
};

function AnimatedSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      variants={sectionVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HostingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          <motion.h1
            {...fadeInUp}
            className="text-5xl font-semibold tracking-tight text-text-primary sm:text-6xl md:text-7xl"
          >
            Hosting
          </motion.h1>
          <motion.p
            {...fadeInUp}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] as any }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl"
          >
            Enterprise-grade hosting solutions designed for performance,
            reliability, and sustainability.
          </motion.p>
        </div>
      </section>

      {/* HexNode Host (Premium) Section */}
      <AnimatedSection className="border-y border-border bg-background-secondary">
        <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-4xl">
            <div className="mb-5 inline-block rounded border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
              Planned – Coming Later
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              HexNode Host
            </h2>
            <p className="mt-5 text-base leading-relaxed text-text-secondary sm:text-lg">
              Premium hosting infrastructure built for demanding applications.
              HexNode Host delivers exceptional performance, reliability, and
              support for mission-critical workloads. Deploy on our global edge
              network with enterprise-grade features and dedicated resources.
            </p>
            <div className="mt-10">
              <h3 className="text-lg font-medium text-text-primary sm:text-xl">
                Planned Features
              </h3>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Global edge network with 50+ locations worldwide
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Dedicated resources with guaranteed performance SLAs
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Automatic scaling and load balancing
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Built-in CDN and DDoS protection
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Automatic failover and redundancy across regions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Advanced monitoring and analytics dashboard
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    24/7 priority support with dedicated account management
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Custom SSL certificates and security configurations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    API access for programmatic infrastructure management
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* HexNode Recycle Host (Budget / Eco) Section */}
      <AnimatedSection className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-4xl">
            <div className="mb-5 inline-block rounded border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
              Planned – Coming Later
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              HexNode Recycle Host
            </h2>
            <p className="mt-5 text-base leading-relaxed text-text-secondary sm:text-lg">
              Sustainable hosting powered by recycled and repurposed hardware.
              HexNode Recycle Host offers an eco-friendly alternative without
              compromising on reliability. Perfect for development, staging, and
              budget-conscious deployments that still require professional-grade
              infrastructure.
            </p>
            <div className="mt-10">
              <h3 className="text-lg font-medium text-text-primary sm:text-xl">
                Planned Features
              </h3>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Repurposed enterprise hardware for reduced environmental impact
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Cost-effective pricing for budget-conscious projects
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Shared resources with fair usage policies
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Standard DDoS protection and security features
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Basic monitoring and alerting capabilities
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Community support and documentation access
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Environmentally responsible hosting with carbon offset tracking
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Flexible resource allocation for variable workloads
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">→</span>
                  <span className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    Standard SSL certificates included
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
