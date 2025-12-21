'use client';

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useServerContext } from "@/components/context/ServerContext";
import { fadeUp, fadeUpTransition, buttonHover, buttonTap } from "@/components/motionVariants";

interface ServerCardProps {
  id: string;
  name: string;
  type: string;
  ram: string;
  status: 'Online' | 'Offline' | 'Restarting';
  index: number;
}

export default function ServerCard({ id, name, type, ram, status, index }: ServerCardProps) {
  const { startServer, stopServer } = useServerContext();
  const [isHovered, setIsHovered] = useState(false);
  const isOnline = status === 'Online';
  const isOffline = status === 'Offline';
  const isRestarting = status === 'Restarting';

  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startServer(id);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopServer(id);
  };

  const getStatusColor = () => {
    if (isOnline) return 'bg-green-500';
    if (isRestarting) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <motion.div
      className="group relative p-5 bg-background border border-foreground/10 rounded-lg transition-all duration-200 hover:border-foreground/20 hover:shadow-lg"
      variants={fadeUp}
      transition={fadeUpTransition}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/dashboard/servers/${id}`} className="block">
        <div className="flex items-center justify-between">
          {/* Left side - Server info */}
          <div className="flex-1 min-w-0">
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
          </div>

          {/* Right side - Status badge and actions */}
          <div className="flex items-center gap-3 ml-4 flex-shrink-0">
            {/* Status badge - always visible */}
            <span
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                isOnline
                  ? 'bg-green-500/20 text-green-400'
                  : isRestarting
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-foreground/10 text-muted'
              }`}
            >
              {status}
            </span>

            {/* Hover actions */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                  onClick={(e) => e.preventDefault()}
                >
                  {/* Start/Stop button - only show when applicable */}
                  {isOffline && !isRestarting && (
                    <motion.button
                      type="button"
                      onClick={handleStart}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-accent text-foreground hover:bg-accent/90 transition-colors"
                      whileHover={buttonHover}
                      whileTap={buttonTap}
                    >
                      Start
                    </motion.button>
                  )}
                  {isOnline && !isRestarting && (
                    <motion.button
                      type="button"
                      onClick={handleStop}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-accent text-foreground hover:bg-accent/90 transition-colors"
                      whileHover={buttonHover}
                      whileTap={buttonTap}
                    >
                      Stop
                    </motion.button>
                  )}
                  {/* View button */}
                  <Link
                    href={`/dashboard/servers/${id}`}
                    className="px-3 py-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    View →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

