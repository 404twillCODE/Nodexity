'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import ServerTypeSelector from "@/components/ServerTypeSelector";
import RamSlider from "@/components/RamSlider";
import CreateServerSummary from "@/components/CreateServerSummary";
import { useServerContext } from "@/components/context/ServerContext";
import { useAssistantContext } from "@/components/context/AssistantContext";
import {
  fadeUp,
  fadeUpTransition,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "@/components/motionVariants";

export default function CreateServerPage() {
  const router = useRouter();
  const { resourcePool, addServer } = useServerContext();
  const { openAssistant } = useAssistantContext();
  const [serverType, setServerType] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [ramAllocation, setRamAllocation] = useState(1024); // 1 GB in MB

  // Pool stats
  const totalPool = resourcePool.totalRam * 1024; // Convert GB to MB
  const currentlyUsed = resourcePool.usedRam * 1024; // Convert GB to MB
  const available = totalPool - currentlyUsed; // Available in MB

  const versions = ['1.21', '1.20.4', '1.19.4'];

  // Handle AI auto-fill
  const handleAutoFill = (data: any) => {
    try {
      // Validate and set server type
      const validTypes = ['Paper', 'Fabric', 'Forge', 'Proxy'];
      const typeMap: { [key: string]: string } = {
        'Paper': 'Paper',
        'Fabric': 'Fabric',
        'Forge': 'Forge',
        'Proxy': 'Proxy (Velocity)',
      };

      if (data.type && validTypes.includes(data.type)) {
        setServerType(typeMap[data.type] || data.type);
      }

      // Validate and set version
      if (data.version && versions.includes(data.version)) {
        setVersion(data.version);
      }

      // Validate and set RAM (convert GB to MB, round to 0.25 increments, ensure within limits)
      if (data.ram && typeof data.ram === 'number') {
        const ramGB = Math.max(0.5, Math.min(data.ram, resourcePool.totalRam - resourcePool.usedRam));
        // Round to nearest 0.25 GB
        const roundedGB = Math.round(ramGB * 4) / 4;
        const ramMB = Math.round(roundedGB * 1024);
        // Ensure within available limits
        const clampedRAM = Math.max(512, Math.min(ramMB, available));
        setRamAllocation(clampedRAM);
      }
    } catch (error) {
      console.error('Error parsing auto-fill data:', error);
    }
  };

  const handleAIConfigure = () => {
    openAssistant(
      "Recommend the best server setup for my use case.",
      true,
      handleAutoFill
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serverType || !version) return;

    // Add server to context
    addServer({
      name: serverType,
      type: serverType,
      version: version,
      ram: ramAllocation / 1024, // Convert MB to GB
    });

    // Navigate to servers page
    router.push('/dashboard/servers');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-60 p-8">
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Page Header */}
          <motion.div
            className="mb-8 flex items-center justify-between"
            variants={fadeUp}
            transition={fadeUpTransition}
          >
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Create Server
              </h1>
              <p className="text-muted">
                Deploy a new server from your resource pool
              </p>
            </div>
            <motion.button
              type="button"
              onClick={handleAIConfigure}
              className="px-4 py-2 border border-accent/50 text-accent rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Let AI configure this
            </motion.button>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleCreate} className="flex flex-col gap-8">
            {/* Server Type */}
            <ServerTypeSelector
              selected={serverType}
              onSelect={setServerType}
            />

            {/* Version */}
            <motion.div
              className="flex flex-col gap-3"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              <label className="text-sm font-medium text-foreground">
                Version
              </label>
              <div className="flex flex-wrap gap-3">
                {versions.map((v) => (
                  <motion.button
                    key={v}
                    type="button"
                    onClick={() => setVersion(v)}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      version === v
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-foreground/10 text-foreground hover:border-foreground/20 hover:bg-foreground/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {v}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* RAM Allocation */}
            <RamSlider
              value={ramAllocation}
              onChange={setRamAllocation}
              min={512}
              max={available}
              totalPool={totalPool}
              currentlyUsed={currentlyUsed}
            />

            {/* Summary Card */}
            <CreateServerSummary
              serverType={serverType}
              version={version}
              ramAllocation={ramAllocation}
              totalPool={resourcePool.totalRam}
              currentlyUsed={resourcePool.usedRam}
            />

            {/* Action Buttons */}
            <motion.div
              className="flex items-center gap-4 pt-4"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              <motion.button
                type="submit"
                disabled={!serverType}
                className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                  serverType
                    ? 'bg-accent text-foreground hover:bg-accent/90'
                    : 'bg-foreground/10 text-muted cursor-not-allowed'
                }`}
                whileHover={serverType ? buttonHover : {}}
                whileTap={serverType ? buttonTap : {}}
              >
                Create Server
              </motion.button>
              <Link
                href="/dashboard/servers"
                className="text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </Link>
            </motion.div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

