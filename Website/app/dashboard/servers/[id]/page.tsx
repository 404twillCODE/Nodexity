'use client';

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import ResourceBar from "@/components/ResourceBar";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
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
  const router = useRouter();
  const { servers, startServer, stopServer, restartServer, deleteServer } = useServerContext();
  const serverId = params.id as string;
  
  const server = servers.find((s) => s.id === serverId);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  if (!server) {
    return (
      <div className="p-8">
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
      </div>
    );
  }

  const isOnline = server.status === 'Online';
  const isOffline = server.status === 'Offline';
  const isRestarting = server.status === 'Restarting';
  
  // Mock resource usage data
  const ramUsage = isOnline ? Math.min(server.ram * 0.75, server.ram) : 0; // 75% usage when online
  const cpuUsage = isOnline ? 45 : 0; // 45% CPU when online

  const handleStart = () => {
    startServer(serverId);
  };

  const handleStop = () => {
    stopServer(serverId);
  };

  const handleRestart = () => {
    restartServer(serverId);
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteServer(serverId);
    setDeleteModalOpen(false);
    router.push('/dashboard/servers');
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
  };

  return (
    <div className="p-8">
      <motion.div
        className="max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Header */}
        <motion.div
          className="mb-10"
          variants={fadeUp}
          transition={fadeUpTransition}
        >
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-bold text-foreground">
              {server.name}
            </h1>
            <StatusBadge status={server.status} size="md" />
          </div>
        </motion.div>

        {/* Overview Card */}
        <motion.div
          className="p-6 border border-foreground/10 rounded-lg mb-8"
          variants={fadeUp}
          transition={fadeUpTransition}
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted mb-1">Server Type</div>
              <div className="text-lg font-semibold text-foreground">
                {server.type}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Version</div>
              <div className="text-lg font-semibold text-foreground">
                {server.version}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">RAM Allocation</div>
              <div className="text-lg font-semibold text-foreground">
                {server.ram} GB
              </div>
            </div>
          </div>
        </motion.div>

        {/* Controls Section */}
        <motion.div
          className="p-6 border border-foreground/10 rounded-lg mb-8"
          variants={fadeUp}
          transition={fadeUpTransition}
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Controls
          </h2>
          <div className="flex items-center gap-3">
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

        {/* Resource Usage Section */}
        <motion.div
          className="p-6 border border-foreground/10 rounded-lg mb-8"
          variants={fadeUp}
          transition={fadeUpTransition}
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Resource Usage
          </h2>
          <div className="flex flex-col gap-6">
            <ResourceBar
              label="RAM"
              value={ramUsage}
              max={server.ram}
              unit="GB"
            />
            <ResourceBar
              label="CPU"
              value={cpuUsage}
              max={100}
              unit="%"
              percentage={cpuUsage}
            />
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          className="p-6 border border-red-500/20 rounded-lg bg-red-500/5"
          variants={fadeUp}
          transition={fadeUpTransition}
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Danger Zone
          </h2>
          <div>
            <p className="text-sm text-muted mb-4">
              Permanently delete this server. This action cannot be undone.
            </p>
            <motion.button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              Delete Server
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        serverName={server.name}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

