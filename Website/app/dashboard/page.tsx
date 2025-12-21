'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import ResourceBar from "@/components/ResourceBar";
import { useServerContext } from "@/components/context/ServerContext";
import {
  fadeUp,
  fadeUpTransition,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "@/components/motionVariants";

export default function DashboardPage() {
  const { resourcePool, servers } = useServerContext();
  const usedRam = resourcePool.usedRam;
  const totalRam = resourcePool.totalRam;
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-60 p-8">
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
            className="p-6 border border-foreground/10 rounded-lg mb-8"
            variants={fadeUp}
            transition={fadeUpTransition}
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Resource Pool
            </h2>
            <div className="flex flex-col gap-6">
              <ResourceBar
                label="RAM"
                value={usedRam}
                max={totalRam}
                unit="GB"
              />
              <ResourceBar
                label="CPU"
                value={62}
                max={100}
                unit="%"
                percentage={62}
              />
              <ResourceBar
                label="Storage"
                value={32}
                max={50}
                unit="GB"
              />
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
              <div className="flex flex-col gap-4">
                {servers.slice(0, 3).map((server, index) => (
                  <motion.div
                    key={server.id}
                    className="p-4 border border-foreground/10 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {server.name}
                      </h3>
                      <span className="text-sm text-muted">
                        {server.type} {server.version}
                      </span>
                      <span className="text-sm text-muted">
                        • {server.ram} GB RAM
                      </span>
                    </div>
                  </motion.div>
                ))}
                {servers.length > 3 && (
                  <Link
                    href="/dashboard/servers"
                    className="text-sm text-accent hover:text-accent/80 transition-colors text-center"
                  >
                    View all {servers.length} servers →
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

