'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useResourcePoolConfig } from "@/components/context/ResourcePoolConfigContext";
import {
  fadeUp,
  fadeUpTransition,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "@/components/motionVariants";

export default function CustomPricingPage() {
  const router = useRouter();
  const { config, updateConfig } = useResourcePoolConfig();
  const [ram, setRam] = useState(config.ram);
  const [cpu, setCpu] = useState(config.cpu);
  const [storage, setStorage] = useState(config.storage);
  const [backups, setBackups] = useState(config.backups);

  // Pricing calculations
  const ramPrice = ram * 2;
  const cpuPrice = cpu * 4;
  const storagePrice = storage * 0.1;
  const backupsPrice = backups ? 5 : 0;
  const totalPrice = ramPrice + cpuPrice + storagePrice + backupsPrice;

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
              Build Your Resource Pool
            </h1>
            <p className="text-xl text-muted">
              Configure your custom resource pool. Pay only for what you need.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-2 space-y-8">
              {/* RAM Slider */}
              <motion.div
                className="p-6 border border-foreground/10 rounded-lg"
                variants={fadeUp}
                transition={fadeUpTransition}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      RAM
                    </h3>
                    <p className="text-sm text-muted">
                      ${ramPrice.toFixed(2)} / month
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-accent">
                    {ram} GB
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="64"
                  step="1"
                  value={ram}
                  onChange={(e) => setRam(Number(e.target.value))}
                  className="w-full"
                  style={{
                    background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${((ram - 1) / (64 - 1)) * 100}%, rgba(255, 255, 255, 0.1) ${((ram - 1) / (64 - 1)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-muted mt-2">
                  <span>1 GB</span>
                  <span>64 GB</span>
                </div>
              </motion.div>

              {/* CPU Slider */}
              <motion.div
                className="p-6 border border-foreground/10 rounded-lg"
                variants={fadeUp}
                transition={fadeUpTransition}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      CPU Cores
                    </h3>
                    <p className="text-sm text-muted">
                      ${cpuPrice.toFixed(2)} / month
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-accent">
                    {cpu} {cpu === 1 ? 'Core' : 'Cores'}
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={cpu}
                  onChange={(e) => setCpu(Number(e.target.value))}
                  className="w-full"
                  style={{
                    background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${((cpu - 1) / (16 - 1)) * 100}%, rgba(255, 255, 255, 0.1) ${((cpu - 1) / (16 - 1)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-muted mt-2">
                  <span>1 Core</span>
                  <span>16 Cores</span>
                </div>
              </motion.div>

              {/* Storage Slider */}
              <motion.div
                className="p-6 border border-foreground/10 rounded-lg"
                variants={fadeUp}
                transition={fadeUpTransition}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      Storage
                    </h3>
                    <p className="text-sm text-muted">
                      ${storagePrice.toFixed(2)} / month
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-accent">
                    {storage} GB
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={storage}
                  onChange={(e) => setStorage(Number(e.target.value))}
                  className="w-full"
                  style={{
                    background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${((storage - 20) / (500 - 20)) * 100}%, rgba(255, 255, 255, 0.1) ${((storage - 20) / (500 - 20)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-muted mt-2">
                  <span>20 GB</span>
                  <span>500 GB</span>
                </div>
              </motion.div>

              {/* Backups Toggle */}
              <motion.div
                className="p-6 border border-foreground/10 rounded-lg"
                variants={fadeUp}
                transition={fadeUpTransition}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      Automated Backups
                    </h3>
                    <p className="text-sm text-muted">
                      Daily backups with 7-day retention
                    </p>
                  </div>
                  <button
                    onClick={() => setBackups(!backups)}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                      backups ? 'bg-accent' : 'bg-foreground/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-foreground transition-transform ${
                        backups ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {backups && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-muted mt-3"
                  >
                    +${backupsPrice.toFixed(2)} / month
                  </motion.p>
                )}
              </motion.div>
            </div>

            {/* Price Summary Card */}
            <motion.div
              className="lg:col-span-1"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              <div className="sticky top-24 p-6 border border-foreground/10 rounded-lg bg-foreground/5">
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted">RAM ({ram} GB)</span>
                    <span className="text-foreground font-medium">
                      ${ramPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">CPU ({cpu} {cpu === 1 ? 'Core' : 'Cores'})</span>
                    <span className="text-foreground font-medium">
                      ${cpuPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Storage ({storage} GB)</span>
                    <span className="text-foreground font-medium">
                      ${storagePrice.toFixed(2)}
                    </span>
                  </div>
                  {backups && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex justify-between items-center"
                    >
                      <span className="text-muted">Backups</span>
                      <span className="text-foreground font-medium">
                        ${backupsPrice.toFixed(2)}
                      </span>
                    </motion.div>
                  )}
                </div>

                <div className="pt-4 border-t border-foreground/10 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">
                      Monthly Total
                    </span>
                    <span className="text-3xl font-bold text-accent">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <motion.button
                  onClick={() => {
                    updateConfig({ ram, cpu, storage, backups });
                    router.push('/dashboard');
                  }}
                  className="w-full px-6 py-3 bg-accent text-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  Continue to Dashboard
                </motion.button>

                <p className="text-xs text-muted text-center mt-4">
                  No credit card required to start
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

