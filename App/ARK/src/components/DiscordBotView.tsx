import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BotStatus {
  running: boolean;
  username: string | null;
  guilds: number;
}

interface BotLogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export default function DiscordBotView() {
  const [status, setStatus] = useState<BotStatus>({ running: false, username: null, guilds: 0 });
  const [logs, setLogs] = useState<BotLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const logOutputRef = useRef<HTMLDivElement>(null);

  const loadStatus = useCallback(async () => {
    if (!window.electronAPI?.discord) return;
    try {
      const s = await window.electronAPI.discord.getStatus();
      setStatus(s);
    } catch {}
  }, []);

  const loadLogs = useCallback(async () => {
    if (!window.electronAPI?.discord) return;
    try {
      const l = await window.electronAPI.discord.getLogs();
      setLogs(l);
    } catch {}
  }, []);

  useEffect(() => {
    loadStatus();
    loadLogs();
    const loadSettings = async () => {
      if (!window.electronAPI) return;
      try {
        const s = await window.electronAPI.server.getAppSettings();
        setSettings(s);
      } catch {}
    };
    loadSettings();
  }, [loadStatus, loadLogs]);

  useEffect(() => {
    if (!window.electronAPI?.discord) return;
    const unsubLog = window.electronAPI.discord.onLog((entry: BotLogEntry) => {
      setLogs((prev) => [...prev.slice(-499), entry]);
    });
    const unsubStatus = window.electronAPI.discord.onStatusUpdate((data: BotStatus) => {
      setStatus(data);
    });
    return () => {
      unsubLog?.();
      unsubStatus?.();
    };
  }, []);

  useEffect(() => {
    if (logOutputRef.current) {
      logOutputRef.current.scrollTop = logOutputRef.current.scrollHeight;
    }
  }, [logs]);

  const handleStart = async () => {
    if (!window.electronAPI?.discord) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.discord.action("start");
      if (!result.success) {
        setLogs((prev) => [...prev, { timestamp: new Date().toLocaleTimeString(), level: "ERROR", message: result.message }]);
      }
      await loadStatus();
    } catch (err) {
      setLogs((prev) => [...prev, { timestamp: new Date().toLocaleTimeString(), level: "ERROR", message: String(err) }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!window.electronAPI?.discord) return;
    setLoading(true);
    try {
      await window.electronAPI.discord.action("stop");
      await loadStatus();
    } catch {} finally {
      setLoading(false);
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "ERROR": return "text-red-400";
      case "WARNING": return "text-yellow-400";
      case "SUCCESS": return "text-green-400";
      default: return "text-text-secondary";
    }
  };

  const discordConfig = (settings as Record<string, unknown>).discord as Record<string, unknown> | undefined;
  const hasToken = !!(discordConfig?.token);

  return (
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
          DISCORD BOT
        </h1>
        <p className="text-text-secondary font-mono text-sm">
          Manage your ARK servers remotely via Discord slash commands
        </p>
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 100, damping: 15 }}
        className="system-card p-6 mb-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${status.running ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500/50"}`} />
            <div>
              <div className="text-lg font-semibold text-text-primary font-mono">
                {status.running ? (status.username || "Bot Online") : "Bot Offline"}
              </div>
              <div className="text-sm text-text-secondary font-mono">
                {status.running
                  ? `Connected to ${status.guilds} server${status.guilds !== 1 ? "s" : ""}`
                  : hasToken ? "Not connected" : "No token configured — set it in Settings > Discord"}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!status.running ? (
              <motion.button
                onClick={handleStart}
                disabled={loading || !hasToken}
                className={`btn-primary ${loading || !hasToken ? "opacity-50 cursor-not-allowed" : ""}`}
                whileHover={!loading && hasToken ? { scale: 1.02 } : {}}
                whileTap={!loading && hasToken ? { scale: 0.98 } : {}}
              >
                {loading ? "STARTING..." : "START BOT"}
              </motion.button>
            ) : (
              <motion.button
                onClick={handleStop}
                disabled={loading}
                className={`btn-secondary ${loading ? "opacity-50" : ""}`}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? "STOPPING..." : "STOP BOT"}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Slash Commands Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
        className="system-card p-5 mb-4"
      >
        <h2 className="text-sm font-semibold text-text-primary font-mono uppercase tracking-wider mb-3">
          Available Slash Commands
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-mono">
          {[
            { cmd: "/ark start [server]", desc: "Start an ARK server" },
            { cmd: "/ark stop [server]", desc: "Stop an ARK server" },
            { cmd: "/ark restart [server]", desc: "Restart an ARK server" },
            { cmd: "/ark status", desc: "Show all server statuses" },
            { cmd: "/ark update [--force]", desc: "Update via SteamCMD" },
            { cmd: "/ark ip", desc: "How to join the server" },
            { cmd: "/ark help", desc: "Show command list" },
          ].map((item) => (
            <div key={item.cmd} className="flex gap-3 items-start">
              <code className="text-accent shrink-0 text-xs bg-accent/10 px-1.5 py-0.5 rounded">{item.cmd}</code>
              <span className="text-text-muted text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bot Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 100, damping: 15 }}
        className="system-card overflow-hidden flex flex-col"
        style={{ height: "calc(100vh - 520px)", minHeight: 240 }}
      >
        <div className="px-4 py-2 border-b border-border flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Bot Logs</span>
          <button
            onClick={() => setLogs([])}
            className="text-xs font-mono text-text-muted hover:text-text-primary transition-colors uppercase tracking-wider"
          >
            Clear
          </button>
        </div>
        <div
          ref={logOutputRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-0.5"
        >
          {logs.length === 0 && (
            <div className="text-text-muted text-center py-8">No logs yet. Start the bot to see activity.</div>
          )}
          <AnimatePresence initial={false}>
            {logs.map((entry, i) => (
              <motion.div
                key={`${entry.timestamp}-${i}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
                className={`${getLogColor(entry.level)} leading-relaxed`}
              >
                <span className="text-text-muted/40 mr-2 text-xs">[{entry.timestamp}]</span>
                <span className={`mr-2 text-xs font-semibold ${getLogColor(entry.level)}`}>{entry.level}</span>
                {entry.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
