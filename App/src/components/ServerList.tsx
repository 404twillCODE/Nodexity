import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import ServerCard from "./ServerCard";
import { useServerManager } from "../hooks/useServerManager";
import JavaStatusIndicator from "./JavaStatusIndicator";
import CreateServerButton from "./CreateServerButton";
import { useToast } from "./ToastProvider";

interface ServerListProps {
  onServerClick?: (serverName: string) => void;
}

export default function ServerList({ onServerClick }: ServerListProps) {
  const { servers, startServer, stopServer, loading, getAllServersUsage, getServersDiskUsage } = useServerManager();
  const { notify } = useToast();
  const [aggregateStats, setAggregateStats] = useState<{
    totalCPU: number;
    totalRAM: number;
    totalRAMMB: number;
    totalDiskGB: number;
  } | null>(null);
  const [diskUsageGB, setDiskUsageGB] = useState<number>(0);
  const lastStatsRef = useRef<{ cpu: number; ramMB: number; diskGB: number } | null>(null);
  const usageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const diskIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = async (serverName: string) => {
    const server = servers.find(s => s.name === serverName);
    const ramGB = server?.ramGB || 4;
    const result = await startServer(serverName, ramGB);
    if (!result.success) {
      notify({
        type: "error",
        title: "Start failed",
        message: result.error || "Unable to start the server."
      });
    }
  };

  const handleStop = async (serverName: string) => {
    const result = await stopServer(serverName);
    if (!result.success) {
      notify({
        type: "error",
        title: "Stop failed",
        message: result.error || "Unable to stop the server."
      });
    }
  };

  // Load aggregate stats
  useEffect(() => {
    if (servers.length === 0) {
      setAggregateStats(null);
      return;
    }

    const loadUsageStats = async () => {
      if (isScrollingRef.current) return;
      try {
        const usageResult = await getAllServersUsage();
        if (usageResult.success) {
          const nextStats = {
            totalCPU: usageResult.totalCPU || 0,
            totalRAM: usageResult.totalRAM || 0,
            totalRAMMB: usageResult.totalRAMMB || 0,
            totalDiskGB: diskUsageGB || 0
          };

          const last = lastStatsRef.current;
          const cpuDiff = Math.abs((last?.cpu ?? 0) - nextStats.totalCPU);
          const ramDiff = Math.abs((last?.ramMB ?? 0) - nextStats.totalRAMMB);
          const diskDiff = Math.abs((last?.diskGB ?? 0) - nextStats.totalDiskGB);

          if (!last || cpuDiff > 0.5 || ramDiff > 10 || diskDiff > 0.01) {
            lastStatsRef.current = {
              cpu: nextStats.totalCPU,
              ramMB: nextStats.totalRAMMB,
              diskGB: nextStats.totalDiskGB
            };
            requestAnimationFrame(() => setAggregateStats(nextStats));
          }
        }
      } catch (error) {
        console.error('Failed to load aggregate stats:', error);
      }
    };

    const loadDiskStats = async () => {
      try {
        const diskResult = await getServersDiskUsage();
        if (diskResult.success) {
          setDiskUsageGB(diskResult.totalSizeGB || 0);
        }
      } catch (error) {
        console.error('Failed to load disk usage:', error);
      }
    };

    loadUsageStats();
    loadDiskStats();

    if (usageIntervalRef.current) clearInterval(usageIntervalRef.current);
    if (diskIntervalRef.current) clearInterval(diskIntervalRef.current);

    usageIntervalRef.current = setInterval(loadUsageStats, 500); // fast CPU/RAM
    diskIntervalRef.current = setInterval(loadDiskStats, 15000); // slow disk scan

    return () => {
      if (usageIntervalRef.current) clearInterval(usageIntervalRef.current);
      if (diskIntervalRef.current) clearInterval(diskIntervalRef.current);
    };
  }, [servers, getAllServersUsage, getServersDiskUsage, diskUsageGB]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      isScrollingRef.current = true;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 200);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-8 custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
              SERVERS
            </h1>
            <p className="text-text-secondary font-mono text-sm">
              Manage your Minecraft server instances
            </p>
          </div>
          <div className="flex items-center gap-4">
            <JavaStatusIndicator />
            <CreateServerButton />
          </div>
        </div>
      </motion.div>

      {/* Aggregate Stats */}
      {!loading && servers.length > 0 && aggregateStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="system-card p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">CPU Usage</div>
                <div className="text-lg font-semibold text-text-primary font-mono">
                  {aggregateStats.totalCPU.toFixed(1)}%
                </div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">RAM Usage</div>
                <div className="text-lg font-semibold text-text-primary font-mono">
                  {aggregateStats.totalRAMMB.toFixed(0)} MB
                </div>
                <div className="text-xs text-text-muted font-mono">
                  ({aggregateStats.totalRAM.toFixed(2)} GB)
                </div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">Disk Usage</div>
                <div className="text-lg font-semibold text-text-primary font-mono">
                  {aggregateStats.totalDiskGB.toFixed(2)} GB
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="system-card p-8 text-center"
        >
          <div className="text-text-muted font-mono text-sm">Loading servers...</div>
        </motion.div>
      ) : servers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="system-card p-12 text-center"
        >
          <div className="mb-6">
            <div className="text-6xl mb-4 opacity-20">⚡</div>
            <h2 className="text-xl font-semibold text-text-primary font-mono mb-2">
              NO SERVERS FOUND
            </h2>
            <p className="text-text-muted font-mono text-sm mb-6">
              Create your first server to get started with HexNode
            </p>
          </div>
          <CreateServerButton />
        </motion.div>
      ) : (
        <div className="space-y-4">
          {servers.map((server, index) => (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 100,
                damping: 15,
              }}
            >
              <ServerCard
                server={server}
                onStart={() => handleStart(server.name)}
                onStop={() => handleStop(server.name)}
                onClick={() => onServerClick?.(server.name)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
