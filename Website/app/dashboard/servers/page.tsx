'use client';

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useServerContext } from "@/components/context/ServerContext";
import {
  fadeUp,
  fadeUpTransition,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "@/components/motionVariants";

export default function ServersPage() {
  const { servers, deleteServer } = useServerContext();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteClick = (serverId: string, serverName: string) => {
    setServerToDelete({ id: serverId, name: serverName });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (serverToDelete) {
      deleteServer(serverToDelete.id);
      setDeleteModalOpen(false);
      setServerToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setServerToDelete(null);
  };

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
            className="mb-10 flex items-center justify-between"
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
              className="grid grid-cols-1 gap-3"
              variants={staggerContainer}
            >
              {servers.map((server, index) => (
                <ServerCardWithActions
                  key={server.id}
                  id={server.id}
                  name={server.name}
                  type={`${server.type} ${server.version}`}
                  ram={`${server.ram} GB`}
                  status={server.status}
                  index={index}
                  onDelete={() => handleDeleteClick(server.id, server.name)}
                />
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          serverName={serverToDelete?.name || ''}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
    </div>
  );
}

// Server Card with always-visible View and Delete buttons for Servers page
interface ServerCardWithActionsProps {
  id: string;
  name: string;
  type: string;
  ram: string;
  status: 'Online' | 'Offline' | 'Restarting';
  index: number;
  onDelete: () => void;
}

function ServerCardWithActions({
  id,
  name,
  type,
  ram,
  status,
  index,
  onDelete,
}: ServerCardWithActionsProps) {
  const getStatusColor = () => {
    if (status === 'Online') return 'bg-green-500';
    if (status === 'Restarting') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <motion.div
      className="p-5 bg-background border border-foreground/10 rounded-lg transition-all duration-200 hover:border-foreground/20 hover:shadow-lg"
      variants={fadeUp}
      transition={fadeUpTransition}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Server info */}
        <Link href={`/dashboard/servers/${id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/* Status indicator dot */}
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} flex-shrink-0`} />
            <h3 className="text-lg font-semibold text-foreground truncate">
              {name}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span>{type}</span>
            <span>•</span>
            <span>{ram}</span>
          </div>
        </Link>

        {/* Right side - Status badge and actions */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          {/* Status badge */}
          <span
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              status === 'Online'
                ? 'bg-green-500/20 text-green-400'
                : status === 'Restarting'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-foreground/10 text-muted'
            }`}
          >
            {status}
          </span>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <Link
                href={`/dashboard/servers/${id}`}
                className="px-3 py-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
              >
                View
              </Link>
            </motion.div>
            <motion.button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              Delete
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

