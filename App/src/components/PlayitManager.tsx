import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useToast } from "./ToastProvider";

interface PlayitManagerProps {
  serverName: string;
}

const MAX_LOG_LINES = 200;
const PLAYIT_DASHBOARD_URL = "https://playit.gg/dashboard";
const PLAYIT_CLAIM_URL = "https://playit.gg/account/agents";

export default function PlayitManager({ serverName }: PlayitManagerProps) {
  const [secretInput, setSecretInput] = useState("");
  const [hasSecret, setHasSecret] = useState(false);
  const [savingSecret, setSavingSecret] = useState(false);
  const [status, setStatus] = useState<{
    running: boolean;
    connected: boolean;
    publicAddress: string | null;
    lastError: string | null;
    claimUrl: string | null;
  }>({ running: false, connected: false, publicAddress: null, lastError: null, claimUrl: null });
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [logLines, setLogLines] = useState<{ id: number; line: string; type: string }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const { notify } = useToast();

  const api = window.electronAPI?.playit;

  useEffect(() => {
    if (!api) return;
    api.getStatus(serverName).then(setStatus);
    api.hasSecret(serverName).then((r: { hasSecret: boolean }) => setHasSecret(r.hasSecret));
    const interval = setInterval(() => {
      api.getStatus(serverName).then(setStatus);
    }, 2000);
    return () => clearInterval(interval);
  }, [serverName, api]);

  useEffect(() => {
    if (!api) return;
    const unsub = api.onLog((name: string, line: string, type: string) => {
      if (name !== serverName) return;
      setLogLines((prev) => {
        const next = [...prev, { id: Date.now() + Math.random(), line, type }];
        return next.slice(-MAX_LOG_LINES);
      });
    });
    return unsub;
  }, [serverName, api]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines.length]);

  const handleSaveSecret = async () => {
    if (!api) return;
    setSavingSecret(true);
    try {
      const result = await api.setSecret(serverName, secretInput.trim());
      if (result.success) {
        setHasSecret(true);
        setSecretInput("");
        notify({ type: "success", title: "Secret saved", message: "Playit.gg secret key saved securely." });
      } else {
        notify({ type: "error", title: "Save failed", message: result.error || "Could not save secret." });
      }
    } catch (e) {
      notify({ type: "error", title: "Save failed", message: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setSavingSecret(false);
    }
  };

  const handleStart = async () => {
    if (!api) return;
    setStarting(true);
    try {
      const installResult = await api.ensureInstalled();
      if (!installResult.success && installResult.error) {
        notify({ type: "error", title: "Playit agent", message: installResult.error });
        setStarting(false);
        return;
      }
      const result = await api.start(serverName, {});
      if (result.success) {
        setLogLines([]);
        notify({ type: "success", title: "Playit started", message: "External access agent is starting." });
      } else {
        notify({ type: "error", title: "Start failed", message: result.error || "Could not start playit agent." });
      }
    } catch (e) {
      notify({ type: "error", title: "Start failed", message: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    if (!api) return;
    setStopping(true);
    try {
      await api.stop(serverName);
      notify({ type: "info", title: "Playit stopped", message: "External access agent stopped." });
    } catch (e) {
      notify({ type: "error", title: "Stop failed", message: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setStopping(false);
    }
  };

  const handleRestart = async () => {
    if (!api) return;
    setStarting(true);
    try {
      const result = await api.restart(serverName);
      if (result.success) {
        setLogLines([]);
        notify({ type: "success", title: "Playit restarted", message: "Agent is restarting." });
      } else {
        notify({ type: "error", title: "Restart failed", message: result.error || "Could not restart." });
      }
    } catch (e) {
      notify({ type: "error", title: "Restart failed", message: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setStarting(false);
    }
  };

  const copyAddress = () => {
    const addr = status.publicAddress || status.claimUrl;
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    notify({ type: "success", title: "Copied", message: "Address copied to clipboard." });
  };

  if (!api) {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="system-card p-6 text-center text-text-muted font-mono text-sm">
          Playit.gg integration is not available. Restart the app if you just updated.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 font-mono">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold text-text-primary uppercase tracking-wider">
            Enable External Access (playit.gg)
          </h2>
          <a
            href="https://playit.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline uppercase tracking-wider"
          >
            Powered by playit.gg
          </a>
        </div>

        {/* Secret key */}
        <div className="system-card p-6">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
            Playit.gg secret key
          </h3>
          <p className="text-xs text-text-muted mb-3">
            Get your secret key from{" "}
            <a
              href={PLAYIT_CLAIM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              playit.gg/account/agents
            </a>
            . Stored securely on your device (never sent to Nodexity servers).
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder={hasSecret ? "••••••••••••" : "Paste your playit.gg secret key"}
              className="flex-1 min-w-[200px] bg-background border border-border px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-accent/50 rounded"
            />
            <motion.button
              onClick={handleSaveSecret}
              disabled={savingSecret || !secretInput.trim()}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {savingSecret ? "SAVING..." : "SAVE"}
            </motion.button>
          </div>
          {hasSecret && (
            <p className="text-xs text-text-muted mt-2">A secret key is saved. Enter a new one above to replace it.</p>
          )}
        </div>

        {/* Start / Stop */}
        <div className="system-card p-6">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Agent control</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {!status.running ? (
              <motion.button
                onClick={handleStart}
                disabled={starting || !hasSecret}
                className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {starting ? "STARTING..." : "START AGENT"}
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={handleStop}
                  disabled={stopping}
                  className="btn-secondary text-sm px-4 py-2 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {stopping ? "STOPPING..." : "STOP"}
                </motion.button>
                <motion.button
                  onClick={handleRestart}
                  disabled={starting}
                  className="btn-secondary text-sm px-4 py-2 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {starting ? "RESTARTING..." : "RESTART"}
                </motion.button>
              </>
            )}
            {!hasSecret && (
              <span className="text-xs text-text-muted">Save a secret key above to start the agent.</span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="system-card p-6">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Status</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-text-muted">Agent: </span>
              <span className={status.running ? "text-green-400" : "text-text-secondary"}>
                {status.running ? "Running" : "Stopped"}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Connected: </span>
              <span className={status.connected ? "text-green-400" : "text-text-secondary"}>
                {status.connected ? "Yes" : "No"}
              </span>
            </div>
            {status.lastError && (
              <div className="col-span-2">
                <span className="text-text-muted">Last error: </span>
                <span className="text-red-400 text-xs">{status.lastError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Public address */}
        {(status.publicAddress || status.claimUrl) && (
          <div className="system-card p-6">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
              Public address
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="flex-1 min-w-0 truncate bg-background-secondary px-3 py-2 rounded text-sm text-accent">
                {status.publicAddress || status.claimUrl}
              </code>
              <motion.button
                onClick={copyAddress}
                className="btn-secondary text-xs px-3 py-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                COPY
              </motion.button>
            </div>
            {status.claimUrl && !status.publicAddress && (
              <p className="text-xs text-text-muted mt-2">
                Open the link above to claim your agent and add a Minecraft tunnel to your server&apos;s port.
              </p>
            )}
          </div>
        )}

        {/* Live logs */}
        <div className="system-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Live logs</h3>
            <a
              href={PLAYIT_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline"
            >
              Open playit.gg dashboard →
            </a>
          </div>
          <div
            className="bg-background border border-border rounded p-3 h-64 overflow-y-auto text-xs font-mono text-text-secondary custom-scrollbar"
          >
            {logLines.length === 0 && !status.running && (
              <div className="text-text-muted">Start the agent to see logs here.</div>
            )}
            {logLines.length === 0 && status.running && (
              <div className="text-text-muted">Waiting for agent output...</div>
            )}
            {logLines.map(({ id, line, type }) => (
              <div
                key={id}
                className={`py-0.5 break-all ${type === "stderr" ? "text-red-400/90" : ""}`}
              >
                {line}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
