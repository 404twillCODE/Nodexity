import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

export default function SteamCmdView() {
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [gameVersion, setGameVersion] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState("");
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  const loadSettings = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const s = await window.electronAPI.server.getAppSettings();
      setSettings(s);
    } catch {}
  }, []);

  useEffect(() => {
    loadSettings();
    checkVersions();
  }, [loadSettings]);

  useEffect(() => {
    if (!window.electronAPI?.steamcmd) return;
    const unsub = window.electronAPI.steamcmd.onProgress((msg: string) => {
      setProgress(msg);
    });
    return () => { unsub?.(); };
  }, []);

  const checkVersions = async () => {
    if (!window.electronAPI?.steamcmd) return;
    setChecking(true);
    try {
      const result = await window.electronAPI.steamcmd.checkVersions();
      setServerVersion(result.serverVersion || null);
      setGameVersion(result.gameVersion || null);
    } catch {} finally {
      setChecking(false);
    }
  };

  const handleUpdate = async (force: boolean) => {
    if (!window.electronAPI?.steamcmd) return;
    setUpdating(true);
    setProgress("Starting update...");
    setLastResult(null);
    try {
      const result = await window.electronAPI.steamcmd.update(force);
      setLastResult({ success: result.success, message: result.message });
      await checkVersions();
    } catch (err) {
      setLastResult({ success: false, message: String(err) });
    } finally {
      setUpdating(false);
      setProgress("");
    }
  };

  const steamCmdPath = (settings as Record<string, string>).steamCmdPath || "";
  const arkInstallPath = (settings as Record<string, string>).arkInstallPath || "";
  const isConfigured = !!steamCmdPath && !!arkInstallPath;

  const versionMatch = serverVersion && gameVersion && parseInt(serverVersion) === parseInt(gameVersion);
  const versionBehind = serverVersion && gameVersion && parseInt(serverVersion) < parseInt(gameVersion);

  return (
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
          STEAMCMD
        </h1>
        <p className="text-text-secondary font-mono text-sm">
          Check for updates and update your ARK Dedicated Server installation
        </p>
      </motion.div>

      {!isConfigured && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 100, damping: 15 }}
          className="system-card p-5 mb-4 border-yellow-500/20"
        >
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm text-text-primary font-mono font-semibold mb-1">SteamCMD not fully configured</p>
              <p className="text-xs text-text-muted font-mono">
                Set both <span className="text-accent">SteamCMD path</span> and <span className="text-accent">ARK install path</span> in Settings &gt; Server to use updates.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Version Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 100, damping: 15 }}
        className="system-card p-6 mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary font-mono uppercase tracking-wider">Version Check</h2>
          <motion.button
            onClick={checkVersions}
            disabled={checking}
            className={`btn-secondary text-xs ${checking ? "opacity-50" : ""}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {checking ? "CHECKING..." : "REFRESH"}
          </motion.button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">Server Version</div>
            <div className="text-lg font-mono text-text-primary">{serverVersion || "Unknown"}</div>
          </div>
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">Game Version</div>
            <div className="text-lg font-mono text-text-primary">{gameVersion || "Unknown"}</div>
          </div>
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">Status</div>
            <div className={`text-lg font-mono ${versionMatch ? "text-green-400" : versionBehind ? "text-yellow-400" : "text-text-muted"}`}>
              {versionMatch ? "Up to date" : versionBehind ? "Update available" : "Unknown"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Update Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
        className="system-card p-6 mb-4"
      >
        <h2 className="text-sm font-semibold text-text-primary font-mono uppercase tracking-wider mb-4">Update Server</h2>
        <div className="flex gap-3 mb-4">
          <motion.button
            onClick={() => handleUpdate(false)}
            disabled={updating || !isConfigured}
            className={`btn-primary ${updating || !isConfigured ? "opacity-50 cursor-not-allowed" : ""}`}
            whileHover={!updating && isConfigured ? { scale: 1.02 } : {}}
            whileTap={!updating && isConfigured ? { scale: 0.98 } : {}}
          >
            {updating ? "UPDATING..." : "UPDATE"}
          </motion.button>
          <motion.button
            onClick={() => handleUpdate(true)}
            disabled={updating || !isConfigured}
            className={`btn-secondary ${updating || !isConfigured ? "opacity-50 cursor-not-allowed" : ""}`}
            whileHover={!updating && isConfigured ? { scale: 1.02 } : {}}
            whileTap={!updating && isConfigured ? { scale: 0.98 } : {}}
          >
            FORCE UPDATE
          </motion.button>
        </div>
        {updating && progress && (
          <div className="bg-background rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
              <span className="text-sm font-mono text-text-secondary">{progress}</span>
            </div>
          </div>
        )}
        {lastResult && !updating && (
          <div className={`bg-background rounded-lg p-3 border ${lastResult.success ? "border-green-500/30" : "border-red-500/30"}`}>
            <span className={`text-sm font-mono ${lastResult.success ? "text-green-400" : "text-red-400"}`}>
              {lastResult.message}
            </span>
          </div>
        )}
      </motion.div>

      {/* Configuration Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 100, damping: 15 }}
        className="system-card p-5"
      >
        <h2 className="text-sm font-semibold text-text-primary font-mono uppercase tracking-wider mb-3">Configuration</h2>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-text-muted">SteamCMD Path</span>
            <span className="text-text-secondary truncate max-w-[60%] text-right">{steamCmdPath || "Not set"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">ARK Install Path</span>
            <span className="text-text-secondary truncate max-w-[60%] text-right">{arkInstallPath || "Not set"}</span>
          </div>
        </div>
        <p className="text-xs text-text-muted font-mono mt-3">
          Configure these paths in Settings &gt; Server tab.
        </p>
      </motion.div>
    </div>
  );
}
