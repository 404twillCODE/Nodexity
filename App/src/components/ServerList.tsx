import { motion } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";
import ServerCard from "./ServerCard";
import { useServerManager } from "../hooks/useServerManager";
import JavaStatusIndicator from "./JavaStatusIndicator";
import CreateServerButton from "./CreateServerButton";
import { useToast } from "./ToastProvider";

interface ServerListProps {
  onServerClick?: (serverName: string) => void;
}

const AggregateStatsPanel = memo(function AggregateStatsPanel({
  hasServers,
  servers,
  getAllServersUsage,
  getServersDiskUsage,
  getPlayerCount,
  getSystemContext,
  isScrollingRef,
  refreshMs,
  onReady,
}: {
  hasServers: boolean;
  servers: Array<{ id: string; status: string }>;
  getAllServersUsage: () => Promise<{ success: boolean; totalCPU?: number; totalRAM?: number; totalRAMMB?: number }>;
  getServersDiskUsage: () => Promise<{ success: boolean; totalSizeGB?: number }>;
  getPlayerCount: (serverName: string) => Promise<{ success: boolean; online?: number; max?: number }>;
  getSystemContext: () => Promise<{
    memory?: { totalGB: number; freeGB: number };
    drives?: Array<{ letter: string; totalGB: number; usedGB: number }>;
    serversDirectory?: string;
  }>;
  isScrollingRef: React.MutableRefObject<boolean>;
  refreshMs: number;
  onReady?: () => void;
}) {
  const [aggregateStats, setAggregateStats] = useState<{
    totalCPU: number;
    totalRAM: number;
    totalRAMMB: number;
    totalDiskGB: number;
    totalPlayersOnline: number;
    totalPlayersMax: number;
  } | null>(null);
  const [diskUsageGB, setDiskUsageGB] = useState<number>(0);
  const [diskTotalGB, setDiskTotalGB] = useState<number>(0);
  const [diskUsedGB, setDiskUsedGB] = useState<number>(0);
  const [systemAvailableRAMMB, setSystemAvailableRAMMB] = useState<number>(0);
  const lastStatsRef = useRef<{ cpu: number; ramMB: number; diskGB: number; playersOnline: number; playersMax: number } | null>(null);
  const usageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const diskIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!hasServers) {
      setAggregateStats(null);
      return;
    }

    const loadUsageStats = async () => {
      if (isScrollingRef.current) return;
      try {
        const running = servers.filter((s) => s.status === "RUNNING");
        const [usageResult, ...playerResults] = await Promise.all([
          getAllServersUsage(),
          ...running.map((server) => getPlayerCount(server.id)),
        ]);
        if (usageResult.success) {
          let totalPlayersOnline = 0;
          let totalPlayersMax = 0;
          for (let i = 0; i < running.length; i++) {
            const res = playerResults[i];
            if (res?.success && typeof res.online === "number") {
              totalPlayersOnline += res.online;
              totalPlayersMax += res.max ?? 0;
            }
          }
          const nextStats = {
            totalCPU: usageResult.totalCPU || 0,
            totalRAM: usageResult.totalRAM || 0,
            totalRAMMB: usageResult.totalRAMMB || 0,
            totalDiskGB: diskUsageGB || 0,
            totalPlayersOnline,
            totalPlayersMax,
          };

          const last = lastStatsRef.current;
          const cpuDiff = Math.abs((last?.cpu ?? 0) - nextStats.totalCPU);
          const ramDiff = Math.abs((last?.ramMB ?? 0) - nextStats.totalRAMMB);
          const diskDiff = Math.abs((last?.diskGB ?? 0) - nextStats.totalDiskGB);
          const playersChanged =
            (last?.playersOnline ?? -1) !== nextStats.totalPlayersOnline ||
            (last?.playersMax ?? -1) !== nextStats.totalPlayersMax;

          if (!last || cpuDiff > 0.5 || ramDiff > 10 || diskDiff > 0.01 || playersChanged) {
            lastStatsRef.current = {
              cpu: nextStats.totalCPU,
              ramMB: nextStats.totalRAMMB,
              diskGB: nextStats.totalDiskGB,
              playersOnline: nextStats.totalPlayersOnline,
              playersMax: nextStats.totalPlayersMax,
            };
            requestAnimationFrame(() => {
              setAggregateStats(nextStats);
              onReady?.();
            });
          }
        }
      } catch (error) {
        console.error("Failed to load aggregate stats:", error);
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

    const loadSystemContext = async () => {
      try {
        const info = await getSystemContext();
        if (info?.memory?.freeGB) {
          setSystemAvailableRAMMB(info.memory.freeGB * 1024);
        } else if (info?.memory?.totalGB) {
          setSystemAvailableRAMMB(info.memory.totalGB * 1024);
        }

        if (info?.drives?.length) {
          const serversDir = info.serversDirectory || "";
          const match = info.drives.find((drive) => {
            if (!drive.letter) return false;
            return serversDir.toLowerCase().startsWith(drive.letter.toLowerCase());
          });
          const total = match?.totalGB ?? info.drives.reduce((sum, drive) => sum + (drive.totalGB || 0), 0);
          const used = match?.usedGB ?? info.drives.reduce((sum, drive) => sum + (drive.usedGB || 0), 0);
          setDiskTotalGB(total);
          setDiskUsedGB(used);
        }
      } catch (error) {
        console.error('Failed to load system context:', error);
      }
    };

    loadUsageStats();
    loadDiskStats();
    loadSystemContext();

    if (usageIntervalRef.current) clearInterval(usageIntervalRef.current);
    if (diskIntervalRef.current) clearInterval(diskIntervalRef.current);

    const usageInterval = Math.max(500, Math.floor(refreshMs / 2));
    usageIntervalRef.current = setInterval(loadUsageStats, usageInterval); // fast CPU/RAM
    diskIntervalRef.current = setInterval(loadDiskStats, 15000); // slow disk scan

    return () => {
      if (usageIntervalRef.current) clearInterval(usageIntervalRef.current);
      if (diskIntervalRef.current) clearInterval(diskIntervalRef.current);
    };
  }, [hasServers, servers, getAllServersUsage, getServersDiskUsage, getPlayerCount, getSystemContext, diskUsageGB, isScrollingRef]);

  if (!aggregateStats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border bg-background-secondary/40 rounded p-6 mb-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-border bg-background-secondary/60 px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono uppercase tracking-wider mb-2">
            <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="7" y="7" width="10" height="10" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" />
            </svg>
            CPU Usage
          </div>
          <div className="text-2xl font-semibold text-text-primary font-mono">
            {aggregateStats.totalCPU.toFixed(1)}%
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-background-secondary">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.min(100, aggregateStats.totalCPU)}%` }}
            />
          </div>
        </div>
        <div className="rounded border border-border bg-background-secondary/60 px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono uppercase tracking-wider mb-2">
            <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="7" width="18" height="10" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11h2M11 11h2M15 11h2" />
            </svg>
            RAM Usage
          </div>
          <div className="text-2xl font-semibold text-text-primary font-mono">
            {aggregateStats.totalRAMMB.toFixed(0)} MB
          </div>
          <div className="text-xs text-text-muted font-mono mt-1">
            ({aggregateStats.totalRAM.toFixed(2)} GB)
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-background-secondary">
            <div
              className="h-full rounded-full bg-accent/80 transition-all"
              style={{ width: `${Math.min(100, systemAvailableRAMMB ? (aggregateStats.totalRAMMB / systemAvailableRAMMB) * 100 : 0)}%` }}
            />
          </div>
        </div>
        <div className="rounded border border-border bg-background-secondary/60 px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono uppercase tracking-wider mb-2">
            <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="1" />
            </svg>
            Disk Usage
          </div>
          <div className="text-2xl font-semibold text-text-primary font-mono">
            {aggregateStats.totalDiskGB.toFixed(2)} GB
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-background-secondary">
            <div
              className="h-full rounded-full bg-accent/60 transition-all"
              style={{ width: `${Math.min(100, diskTotalGB ? (diskUsedGB / diskTotalGB) * 100 : 0)}%` }}
            />
          </div>
        </div>
        <div className="rounded border border-border bg-background-secondary/60 px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono uppercase tracking-wider mb-2">
            <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Players
          </div>
          <div className="text-2xl font-semibold text-text-primary font-mono">
            {aggregateStats.totalPlayersOnline} / {aggregateStats.totalPlayersMax}
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-background-secondary">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${aggregateStats.totalPlayersMax ? Math.min(100, (aggregateStats.totalPlayersOnline / aggregateStats.totalPlayersMax) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function ServerList({ onServerClick }: ServerListProps) {
  const { servers, startServer, stopServer, loading, getAllServersUsage, getServersDiskUsage, getPlayerCount } = useServerManager();
  const getSystemContext = async () => {
    if (!window.electronAPI) return {};
    const [info, settings] = await Promise.all([
      window.electronAPI.server.getSystemInfo(),
      window.electronAPI.server.getAppSettings()
    ]);
    return {
      ...info,
      serversDirectory: settings?.serversDirectory || ""
    };
  };
  const { notify } = useToast();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [statsReady, setStatsReady] = useState(false);
  const [refreshMs, setRefreshMs] = useState(2000);

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

  useEffect(() => {
    setStatsReady(false);
  }, [servers.length]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!window.electronAPI) return;
      try {
        const settings = await window.electronAPI.server.getAppSettings();
        const nextRate = Math.max(1, Math.min(10, Number(settings?.statusRefreshRate ?? 2)));
        setRefreshMs(nextRate * 1000);
      } catch (error) {
        console.error('Failed to load app settings:', error);
      }
    };

    const handleSettingsUpdate = (updated: import("../hooks/useServerManager").AppSettings) => {
      const nextRate = Math.max(1, Math.min(10, Number(updated?.statusRefreshRate ?? 2)));
      setRefreshMs(nextRate * 1000);
    };

    loadSettings();
    const unsubscribe = window.electronAPI?.server?.onAppSettingsUpdated?.(handleSettingsUpdate);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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

      {!loading && servers.length > 0 && (
        <AggregateStatsPanel
          hasServers={servers.length > 0}
          servers={servers}
          getAllServersUsage={getAllServersUsage}
          getServersDiskUsage={getServersDiskUsage}
          getPlayerCount={getPlayerCount}
          getSystemContext={getSystemContext}
          isScrollingRef={isScrollingRef}
          refreshMs={refreshMs}
          onReady={() => setStatsReady(true)}
        />
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
              Create your first server to get started with Nodexity
            </p>
          </div>
          <CreateServerButton />
        </motion.div>
      ) : !statsReady ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="system-card p-6 text-center"
        >
          <div className="text-text-muted font-mono text-sm">Loading server stats...</div>
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
                onStart={() => handleStart(server.id)}
                onStop={() => handleStop(server.id)}
                onClick={() => onServerClick?.(server.id)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
