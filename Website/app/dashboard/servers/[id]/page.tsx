'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatusBadge from "@/components/StatusBadge";
import ResourceBar from "@/components/ResourceBar";
import { useServerContext } from "@/components/context/ServerContext";
import {
  fadeUp,
  fadeUpTransition,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "@/components/motionVariants";

export default function ServerDetailPage() {
  const params = useParams();
  const { servers, startServer, stopServer, restartServer } = useServerContext();
  const serverId = params.id as string;
  
  const server = servers.find((s) => s.id === serverId);

  if (!server) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 ml-60 p-8">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeUp}
              transition={fadeUpTransition}
              className="flex flex-col items-center gap-6"
            >
              <h1 className="text-4xl font-bold text-foreground">
                Server not found
              </h1>
              <p className="text-muted">
                The server you're looking for doesn't exist or has been removed.
              </p>
              <Link
                href="/dashboard/servers"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                ← Back to Servers
              </Link>
            </motion.div>
          </motion.div>
        </main>
      </div>
    );
  }

  const isOnline = server.status === 'Online';
  const isOffline = server.status === 'Offline';
  const isRestarting = server.status === 'Restarting';
  const storageAllocated = Math.round(server.ram * 1.25); // Estimate storage based on RAM

  const handleStart = () => {
    startServer(serverId);
  };

  const handleStop = () => {
    stopServer(serverId);
  };

  const handleRestart = () => {
    restartServer(serverId);
  };

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
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {server.name}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="text-muted">
                    {server.type} {server.version}
                  </span>
                  <StatusBadge status={server.status} size="md" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isOffline && (
                <motion.button
                  onClick={handleStart}
                  disabled={isRestarting}
                  className={`px-4 py-2 bg-accent text-foreground font-medium rounded-lg transition-colors ${
                    isRestarting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-accent/90'
                  }`}
                  whileHover={!isRestarting ? buttonHover : {}}
                  whileTap={!isRestarting ? buttonTap : {}}
                >
                  Start
                </motion.button>
              )}
              {isOnline && (
                <motion.button
                  onClick={handleStop}
                  disabled={isRestarting}
                  className={`px-4 py-2 bg-accent text-foreground font-medium rounded-lg transition-colors ${
                    isRestarting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-accent/90'
                  }`}
                  whileHover={!isRestarting ? buttonHover : {}}
                  whileTap={!isRestarting ? buttonTap : {}}
                >
                  Stop
                </motion.button>
              )}
              <motion.button
                onClick={handleRestart}
                disabled={isRestarting}
                className={`px-4 py-2 border border-foreground/20 text-foreground font-medium rounded-lg transition-colors ${
                  isRestarting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-foreground/30 hover:bg-foreground/5'
                }`}
                whileHover={!isRestarting ? buttonHover : {}}
                whileTap={!isRestarting ? buttonTap : {}}
              >
                {isRestarting ? 'Restarting...' : 'Restart'}
              </motion.button>
            </div>
          </motion.div>

          {/* Resource Section */}
          <motion.div
            className="p-6 border border-foreground/10 rounded-lg mb-8"
            variants={fadeUp}
            transition={fadeUpTransition}
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Resources
            </h2>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground">RAM Allocation</span>
                  <span className="text-sm text-muted">{server.ram} GB allocated</span>
                </div>
                <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(server.ram / 8) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">CPU</span>
                <span className="text-sm text-muted">Shared CPU</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground">Storage</span>
                  <span className="text-sm text-muted">{storageAllocated} GB allocated</span>
                </div>
                <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(storageAllocated / 50) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Info Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={staggerContainer}
          >
            <motion.div
              className="p-4 border border-foreground/10 rounded-lg"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              <h3 className="text-sm font-medium text-muted mb-2">Server ID</h3>
              <p className="text-foreground font-mono text-sm">{server.id}</p>
            </motion.div>
            <motion.div
              className="p-4 border border-foreground/10 rounded-lg"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              <h3 className="text-sm font-medium text-muted mb-2">Software</h3>
              <p className="text-foreground">{server.type}</p>
            </motion.div>
            <motion.div
              className="p-4 border border-foreground/10 rounded-lg"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              <h3 className="text-sm font-medium text-muted mb-2">Version</h3>
              <p className="text-foreground">{server.version}</p>
            </motion.div>
            <motion.div
              className="p-4 border border-foreground/10 rounded-lg"
              variants={fadeUp}
              transition={fadeUpTransition}
            >
              <h3 className="text-sm font-medium text-muted mb-2">Created At</h3>
              <p className="text-foreground">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

