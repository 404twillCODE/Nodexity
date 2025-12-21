'use client';

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useResourcePoolConfig } from "@/components/context/ResourcePoolConfigContext";
import {
  fadeUp,
  fadeUpTransition,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "@/components/motionVariants";

// Preset configurations
const PRESETS = {
  starter: {
    name: 'Starter',
    ram: 4,
    cpu: 2,
    storage: 50,
    backups: false,
    price: 8,
    description: 'Perfect for small networks, proxies, or test environments.',
  },
  pro: {
    name: 'Pro',
    ram: 8,
    cpu: 4,
    storage: 100,
    backups: false,
    price: 14,
    description: 'Ideal for growing networks and multiple game modes.',
    highlighted: true,
  },
  power: {
    name: 'Power',
    ram: 16,
    cpu: 8,
    storage: 200,
    backups: false,
    price: 26,
    description: 'For serious Minecraft infrastructure and modded servers.',
  },
};

export default function PricingPage() {
  const router = useRouter();
  const { updateConfig } = useResourcePoolConfig();

  const handlePresetSelect = (preset: typeof PRESETS.starter) => {
    updateConfig({
      ram: preset.ram,
      cpu: preset.cpu,
      storage: preset.storage,
      backups: preset.backups,
    });
    router.push('/dashboard');
  };

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Page Header */}
          <motion.div
            className="text-center mb-12"
            variants={fadeUp}
            transition={fadeUpTransition}
          >
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Pricing
            </h1>
            <p className="text-xl text-muted">
              Simple resource-based pricing. No per-server limits.
            </p>
          </motion.div>

          {/* Preset Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
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
            {/* Starter */}
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
                  {PRESETS.starter.name}
                </h3>
                <div className="text-3xl font-bold text-foreground">
                  ${PRESETS.starter.price} <span className="text-lg font-normal text-muted">/ month</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-foreground/10">
                <p className="text-foreground">{PRESETS.starter.ram} GB RAM</p>
                <p className="text-foreground">{PRESETS.starter.cpu} CPU Cores</p>
                <p className="text-foreground">{PRESETS.starter.storage} GB Storage</p>
              </div>
              <p className="text-muted text-sm leading-relaxed mt-2">
                {PRESETS.starter.description}
              </p>
            </motion.div>

            {/* Pro (Highlighted) */}
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
                  {PRESETS.pro.name}
                </h3>
                <div className="text-3xl font-bold text-foreground">
                  ${PRESETS.pro.price} <span className="text-lg font-normal text-muted">/ month</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-foreground/10">
                <p className="text-foreground">{PRESETS.pro.ram} GB RAM</p>
                <p className="text-foreground">{PRESETS.pro.cpu} CPU Cores</p>
                <p className="text-foreground">{PRESETS.pro.storage} GB Storage</p>
              </div>
              <p className="text-muted text-sm leading-relaxed mt-2">
                {PRESETS.pro.description}
              </p>
            </motion.div>

            {/* Power */}
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
                  {PRESETS.power.name}
                </h3>
                <div className="text-3xl font-bold text-foreground">
                  ${PRESETS.power.price} <span className="text-lg font-normal text-muted">/ month</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-foreground/10">
                <p className="text-foreground">{PRESETS.power.ram} GB RAM</p>
                <p className="text-foreground">{PRESETS.power.cpu} CPU Cores</p>
                <p className="text-foreground">{PRESETS.power.storage} GB Storage</p>
              </div>
              <p className="text-muted text-sm leading-relaxed mt-2">
                {PRESETS.power.description}
              </p>
            </motion.div>
          </motion.div>

          {/* Divider */}
          <motion.div
            className="flex items-center gap-4 mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={fadeUpTransition}
          >
            <div className="flex-1 h-px bg-foreground/10"></div>
            <p className="text-muted text-lg">Need something custom?</p>
            <div className="flex-1 h-px bg-foreground/10"></div>
          </motion.div>

          {/* Build Your Own Pool Card */}
          <motion.div
            className="max-w-2xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={fadeUpTransition}
          >
            <Link href="/pricing/custom">
              <motion.div
                className="p-8 border-2 border-dashed border-foreground/20 rounded-lg text-center hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer"
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  Build Your Own Pool
                </h3>
                <p className="text-muted mb-6">
                  Configure RAM, CPU, storage, and backups to match your exact needs.
                </p>
                <motion.span
                  className="inline-block px-6 py-3 bg-accent text-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Customize Resources
                </motion.span>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
