'use client';

import Link from "next/link";
import { motion } from "framer-motion";
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
  const { startServer, stopServer, restartServer } = useServerContext();
  const isOnline = status === 'Online';
  const isOffline = status === 'Offline';
  const isRestarting = status === 'Restarting';

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    startServer(id);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopServer(id);
  };

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation();
    restartServer(id);
  };

  return (
    <motion.div
      className="p-6 border border-foreground/10 rounded-lg hover:border-foreground/20 transition-colors"
      variants={fadeUp}
      transition={fadeUpTransition}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Server info */}
        <Link
          href={`/dashboard/servers/${id}`}
          className="flex-1 cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-foreground hover:text-accent transition-colors">
              {name}
            </h3>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                isOnline
                  ? 'bg-accent/20 text-accent'
                  : isRestarting
                  ? 'bg-accent/30 text-accent'
                  : 'bg-foreground/10 text-muted'
              }`}
            >
              {status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">{type}</span>
            <span className="text-muted">•</span>
            <span className="text-muted">{ram} RAM</span>
          </div>
        </Link>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isOffline && (
            <motion.button
              type="button"
              onClick={handleStart}
              disabled={isRestarting}
              className={`px-4 py-2 bg-accent text-foreground font-medium rounded-lg transition-colors text-sm ${
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
              type="button"
              onClick={handleStop}
              disabled={isRestarting}
              className={`px-4 py-2 bg-accent text-foreground font-medium rounded-lg transition-colors text-sm ${
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
            type="button"
            onClick={handleRestart}
            disabled={isRestarting}
            className={`px-4 py-2 border border-foreground/20 text-foreground font-medium rounded-lg transition-colors text-sm ${
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
      </div>
    </motion.div>
  );
}

