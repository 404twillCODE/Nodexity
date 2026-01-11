import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge";
import { useServerManager } from "../hooks/useServerManager";

interface Server {
  id: string;
  name: string;
  version: string;
  status: "RUNNING" | "STOPPED" | "STARTING";
  port: number;
  ramGB?: number;
}

interface ServerCardProps {
  server: Server;
  onStart?: () => void;
  onStop?: () => void;
  onClick?: () => void;
}

export default function ServerCard({ server, onStart, onStop, onClick }: ServerCardProps) {
  const { restartServer, killServer, getPlayerCount } = useServerManager();
  const [playerCount, setPlayerCount] = useState<{ online: number; max: number } | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [showKillConfirm, setShowKillConfirm] = useState(false);
  
  const isRunning = server.status === "RUNNING";
  const isStopped = server.status === "STOPPED";
  const isStarting = server.status === "STARTING";

  // Poll player count when server is running
  useEffect(() => {
    if (!isRunning) {
      setPlayerCount(null);
      return;
    }

    const updatePlayerCount = async () => {
      const result = await getPlayerCount(server.name);
      if (result.success && 'online' in result && 'max' in result && result.online !== undefined && result.max !== undefined) {
        setPlayerCount({ online: result.online, max: result.max });
      }
    };

    updatePlayerCount();
    const interval = setInterval(updatePlayerCount, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [isRunning, server.name, getPlayerCount]);

  const handleRestart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRestarting(true);
    const ramGB = server.ramGB || 4;
    const result = await restartServer(server.name, ramGB);
    if (!result.success) {
      alert(`Failed to restart server: ${result.error}`);
    }
    setIsRestarting(false);
  };

  const handleKill = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showKillConfirm) {
      setShowKillConfirm(true);
      return;
    }
    
    const result = await killServer(server.name);
    if (!result.success) {
      alert(`Failed to kill server: ${result.error}`);
    }
    setShowKillConfirm(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    onClick?.();
  };

  return (
    <motion.div
      className="system-card p-6 relative cursor-pointer"
      onClick={handleCardClick}
      whileHover={{ 
        borderColor: 'rgba(46, 242, 162, 0.3)',
        transition: { duration: 0.3 }
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-text-primary font-mono">
              {server.name}
            </h3>
            <StatusBadge status={server.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary font-mono">
            <div className="flex items-center gap-1">
              <span className="text-text-muted">Version:</span>
              <span className="text-text-primary">{server.version}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-text-muted">Port:</span>
              <span className="text-text-primary">{server.port}</span>
            </div>
            {server.ramGB && (
              <div className="flex items-center gap-1">
                <span className="text-text-muted">RAM:</span>
                <span className="text-text-primary">{server.ramGB}GB</span>
              </div>
            )}
            {isRunning && playerCount && (
              <div className="flex items-center gap-1">
                <span className="text-text-muted">Players:</span>
                <span className="text-accent font-semibold">{playerCount.online}/{playerCount.max}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6 pt-4 border-t border-border">
        {isStopped && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onStart?.();
            }}
            className="btn-primary flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={false}
          >
            START
          </motion.button>
        )}
        {isRunning && (
          <>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onStop?.();
              }}
              className="btn-secondary flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              STOP
            </motion.button>
            <motion.button
              onClick={handleRestart}
              disabled={isRestarting}
              className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: isRestarting ? 1 : 1.02 }}
              whileTap={{ scale: isRestarting ? 1 : 0.98 }}
            >
              {isRestarting ? "RESTARTING..." : "RESTART"}
            </motion.button>
            <motion.button
              onClick={handleKill}
              className={`flex-1 ${showKillConfirm ? 'bg-red-500 hover:bg-red-600' : 'btn-secondary'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showKillConfirm ? "CONFIRM KILL" : "KILL"}
            </motion.button>
          </>
        )}
        {isStarting && (
          <>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-sm text-yellow-400 font-mono uppercase tracking-wider">
                Starting...
              </div>
            </div>
            <motion.button
              onClick={handleKill}
              className={`flex-1 ${showKillConfirm ? 'bg-red-500 hover:bg-red-600' : 'btn-secondary'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showKillConfirm ? "CONFIRM KILL" : "KILL"}
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}
