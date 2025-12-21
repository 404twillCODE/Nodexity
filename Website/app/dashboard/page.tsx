'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import ResourceBar from "@/components/ResourceBar";
import ServerCard from "@/components/ServerCard";
import { useServerContext } from "@/components/context/ServerContext";
import { useResourcePoolConfig } from "@/components/context/ResourcePoolConfigContext";
import {
  fadeUp,
  fadeUpTransition,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "@/components/motionVariants";

export default function DashboardPage() {
  const { resourcePool, servers } = useServerContext();
  const { config } = useResourcePoolConfig();
  const usedRam = resourcePool.usedRam;
  const totalRam = resourcePool.totalRam;
  return (
    <div className="p-8">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Page Header */}
          <motion.div
            className="mb-8"
            variants={fadeUp}
            transition={fadeUpTransition}
          >
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Dashboard
            </h1>
            <p className="text-muted">
              Overview of your infrastructure
            </p>
          </motion.div>

          {/* Resource Pool Summary Card */}
          <motion.div
            className="p-6 border border-foreground/10 rounded-lg mb-10"
            variants={fadeUp}
            transition={fadeUpTransition}
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Resource Pool
            </h2>
            
            {/* RAM Usage Bar */}
            <div className="mb-6">
              <ResourceBar
                label="RAM"
                value={usedRam}
                max={totalRam}
                unit="GB"
              />
            </div>

            {/* Resource Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-foreground/5 rounded-lg border border-foreground/10">
                <div className="text-sm text-muted mb-1">Total RAM</div>
                <div className="text-2xl font-semibold text-foreground">
                  {totalRam.toFixed(1)} GB
                </div>
              </div>
              <div className="p-4 bg-foreground/5 rounded-lg border border-foreground/10">
                <div className="text-sm text-muted mb-1">Used RAM</div>
                <div className="text-2xl font-semibold text-foreground">
                  {usedRam.toFixed(1)} GB
                </div>
              </div>
              <div className="p-4 bg-foreground/5 rounded-lg border border-foreground/10">
                <div className="text-sm text-muted mb-1">Available RAM</div>
                <div className="text-2xl font-semibold text-foreground">
                  {(totalRam - usedRam).toFixed(1)} GB
                </div>
              </div>
            </div>

            {/* Pooled Usage Note */}
            <div className="pt-4 border-t border-foreground/10">
              <p className="text-sm text-muted">
                Resources are shared across all servers.
              </p>
            </div>
          </motion.div>

          {/* Servers Section */}
          <motion.div
            variants={fadeUp}
            transition={fadeUpTransition}
          >
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Servers
            </h2>
            {servers.length === 0 ? (
              <div className="p-12 border border-foreground/10 rounded-lg text-center">
                <p className="text-lg text-foreground mb-2">
                  No servers yet
                </p>
                <p className="text-muted mb-6">
                  Create your first server to start using your resource pool.
                </p>
                <motion.div
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <Link
                    href="/dashboard/servers/create"
                    className="inline-block px-6 py-3 bg-accent text-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    Create Server
                  </Link>
                </motion.div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {servers.map((server, index) => (
                  <ServerCard
                    key={server.id}
                    id={server.id}
                    name={server.name}
                    type={`${server.type} ${server.version}`}
                    ram={`${server.ram} GB`}
                    status={server.status}
                    index={index}
                  />
                ))}
                {servers.length > 5 && (
                  <motion.div
                    className="pt-2"
                    variants={fadeUp}
                    transition={fadeUpTransition}
                  >
                    <Link
                      href="/dashboard/servers"
                      className="text-sm text-accent hover:text-accent/80 transition-colors text-center block"
                    >
                      View all {servers.length} servers →
                    </Link>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
    </div>
  );
}

