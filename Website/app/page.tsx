'use client';

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ScrollIndicator from "@/components/ScrollIndicator";
import { useResourcePoolConfig } from "@/components/context/ResourcePoolConfigContext";
import {
  heroFadeUp,
  heroTransition,
  heroStaggerContainer,
  fadeUp,
  fadeUpTransition,
  staggerContainer,
  buttonHover,
  buttonTap,
  buttonTransition,
} from "@/components/motionVariants";

export default function Home() {
  const router = useRouter();
  const { updateConfig } = useResourcePoolConfig();

  // Preset configurations
  const PRESETS = {
    starter: {
      ram: 4,
      cpu: 2,
      storage: 50,
      backups: false,
    },
    pro: {
      ram: 8,
      cpu: 4,
      storage: 100,
      backups: false,
    },
    power: {
      ram: 16,
      cpu: 8,
      storage: 200,
      backups: false,
    },
  };

  const handlePresetSelect = (preset: typeof PRESETS.starter) => {
    updateConfig(preset);
    router.push('/dashboard');
  };

  return (
    <>
      <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] pt-16">
        <motion.div
          className="flex flex-col items-center text-center max-w-3xl mx-auto px-6"
          variants={heroStaggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.h1
              className="text-7xl font-bold text-foreground uppercase tracking-tight"
              variants={heroFadeUp}
              transition={heroTransition}
            >
              HEXNODE
            </motion.h1>
            <motion.p
              className="text-2xl text-muted"
              variants={heroFadeUp}
              transition={heroTransition}
            >
              Resources, not restrictions.
            </motion.p>
            <motion.p
              className="text-lg text-muted max-w-2xl"
              variants={heroFadeUp}
              transition={heroTransition}
            >
              Buy a pool of resources. Run as many Minecraft servers as you want.
            </motion.p>
          </div>
          
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
            variants={heroFadeUp}
            transition={heroTransition}
          >
            <motion.div
              whileHover={buttonHover}
              whileTap={buttonTap}
              transition={buttonTransition}
            >
              <Link
                href="/pricing"
                className="px-8 py-3 bg-accent text-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors block"
              >
                Choose a Plan
              </Link>
            </motion.div>
            <motion.div
              whileHover={buttonHover}
              whileTap={buttonTap}
              transition={buttonTransition}
            >
              <Link
                href="/pricing/custom"
                className="px-8 py-3 border border-foreground/20 text-foreground font-medium rounded-lg hover:border-foreground/30 hover:bg-foreground/5 transition-colors block"
              >
                Build Your Own Pool
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
        <ScrollIndicator />
      </section>

      <section id="how-it-works" className="w-full py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="flex flex-col items-center text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              className="text-4xl font-bold text-foreground mb-4"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              How HEXNODE Works
            </motion.h2>
            <motion.p
              className="text-xl text-muted"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              Pay for resources. Deploy servers freely.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div
              className="flex flex-col gap-3"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              <h3 className="text-xl font-semibold text-foreground">
                Buy a Resource Pool
              </h3>
              <p className="text-muted leading-relaxed">
                Purchase a pool of RAM, CPU, and storage instead of individual servers.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col gap-3"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              <h3 className="text-xl font-semibold text-foreground">
                Deploy Without Limits
              </h3>
              <p className="text-muted leading-relaxed">
                Run multiple Minecraft servers from a single pool — proxies, survival, modded, anything.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col gap-3"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              <h3 className="text-xl font-semibold text-foreground">
                Scale Instantly
              </h3>
              <p className="text-muted leading-relaxed">
                Reallocate resources at any time. Upgrade only when you actually need more.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="w-full py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="flex flex-col items-center text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              className="text-4xl font-bold text-foreground mb-4"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              Resource Pools
            </motion.h2>
            <motion.p
              className="text-xl text-muted"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              One pool. Unlimited servers.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.1,
                },
              },
            }}
          >
            {/* Tier 1: Starter */}
            <motion.div
              className="flex flex-col gap-4 p-6 border border-foreground/10 rounded-lg cursor-pointer"
              variants={fadeUp}
              transition={fadeUpTransition}
              whileHover={{
                scale: 1.01,
                borderColor: "rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
              onClick={() => handlePresetSelect(PRESETS.starter)}
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-semibold text-foreground">
                  Starter
                </h3>
                <div className="text-3xl font-bold text-foreground">
                  $8 <span className="text-lg font-normal text-muted">/ month</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-foreground/10">
                <p className="text-foreground">4 GB RAM</p>
                <p className="text-foreground">Shared CPU</p>
                <p className="text-foreground">50 GB Storage</p>
              </div>
              <p className="text-muted text-sm leading-relaxed mt-2">
                Perfect for small networks, proxies, or test environments.
              </p>
            </motion.div>

            {/* Tier 2: Pro (Highlighted) */}
            <motion.div
              className="flex flex-col gap-4 p-6 border-2 border-accent rounded-lg cursor-pointer"
              variants={fadeUp}
              transition={{ ...fadeUpTransition, delay: 0.2 }}
              initial={{ scale: 1.01 }}
              whileHover={{
                scale: 1.02,
                borderColor: "#8B5CF6",
                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.25)",
              }}
              onClick={() => handlePresetSelect(PRESETS.pro)}
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-semibold text-foreground">
                  Pro
                </h3>
                <div className="text-3xl font-bold text-foreground">
                  $14 <span className="text-lg font-normal text-muted">/ month</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-foreground/10">
                <p className="text-foreground">8 GB RAM</p>
                <p className="text-foreground">Shared CPU</p>
                <p className="text-foreground">100 GB Storage</p>
              </div>
              <p className="text-muted text-sm leading-relaxed mt-2">
                Ideal for growing networks and multiple game modes.
              </p>
            </motion.div>

            {/* Tier 3: Power */}
            <motion.div
              className="flex flex-col gap-4 p-6 border border-foreground/10 rounded-lg cursor-pointer"
              variants={fadeUp}
              transition={fadeUpTransition}
              whileHover={{
                scale: 1.01,
                borderColor: "rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
              onClick={() => handlePresetSelect(PRESETS.power)}
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-semibold text-foreground">
                  Power
                </h3>
                <div className="text-3xl font-bold text-foreground">
                  $26 <span className="text-lg font-normal text-muted">/ month</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-foreground/10">
                <p className="text-foreground">16 GB RAM</p>
                <p className="text-foreground">Shared CPU</p>
                <p className="text-foreground">200 GB Storage</p>
              </div>
              <p className="text-muted text-sm leading-relaxed mt-2">
                For serious Minecraft infrastructure and modded servers.
              </p>
            </motion.div>
          </motion.div>

          {/* Custom Option */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={fadeUpTransition}
          >
            <p className="text-muted text-center">
              Need something custom?
            </p>
            <motion.div
              whileHover={buttonHover}
              whileTap={buttonTap}
              transition={buttonTransition}
            >
              <Link
                href="/pricing/custom"
                className="px-6 py-2.5 border border-foreground/20 text-foreground font-medium rounded-lg hover:border-foreground/30 hover:bg-foreground/5 transition-colors block"
              >
                Build Your Own Pool
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

