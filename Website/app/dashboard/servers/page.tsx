'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import ServerCard from "@/components/ServerCard";
import { useServerContext } from "@/components/context/ServerContext";
import {
  fadeUp,
  fadeUpTransition,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "@/components/motionVariants";

export default function ServersPage() {
  const { servers } = useServerContext();

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
            className="mb-8 flex items-center justify-between"
            variants={fadeUp}
            transition={fadeUpTransition}
          >
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Servers
              </h1>
              <p className="text-muted">
                All servers running within your resource pool
              </p>
            </div>
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
          </motion.div>

          {/* Servers List */}
          {servers.length === 0 ? (
            <motion.div
              className="p-12 border border-foreground/10 rounded-lg text-center"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
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
            </motion.div>
          ) : (
            <motion.div
              className="flex flex-col gap-4"
              variants={staggerContainer}
            >
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
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

