import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useServerManager } from "../hooks/useServerManager";
import StatusBadge from "./StatusBadge";
import FileEditor from "./FileEditor";
import PluginManager from "./PluginManager";
import WorldManager from "./WorldManager";
import ServerPropertiesEditor from "./ServerPropertiesEditor";

interface ServerDetailViewProps {
  serverName: string;
  onBack: () => void;
}

type Tab = "console" | "files" | "plugins" | "worlds" | "properties" | "settings";

interface ConsoleLine {
  id: string;
  text: string;
  timestamp: string;
  type?: 'stdout' | 'stderr' | 'command';
}

export default function ServerDetailView({ serverName, onBack }: ServerDetailViewProps) {
  const { servers, sendCommand, startServer, stopServer, restartServer, killServer, loading } = useServerManager();
  const [isRestarting, setIsRestarting] = useState(false);
  const [showKillConfirm, setShowKillConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("console");
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [input, setInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const server = servers.find(s => s.name === serverName);

  useEffect(() => {
    // Load console settings
    const loadSettings = async () => {
      if (window.electronAPI) {
        try {
          const appSettings = await window.electronAPI.server.getAppSettings();
          setSettings(appSettings);
          setAutoScroll(appSettings.consoleAutoScroll !== false);
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!window.electronAPI || !serverName) return;

    // Load existing logs from log file
    const loadExistingLogs = async () => {
      if (!window.electronAPI) return;
      try {
        const maxLines = settings?.maxConsoleLines || 1000;
        const result = await window.electronAPI.server.getServerLogs(serverName, maxLines);
        if (result.success && result.lines) {
          const existingLines: ConsoleLine[] = result.lines.map((line, index) => ({
            id: `existing-${index}-${Date.now()}`,
            text: line,
            timestamp: new Date().toLocaleTimeString(),
            type: 'stdout' as const,
          }));
          setLines(existingLines);
        }
      } catch (error) {
        console.error('Failed to load existing logs:', error);
      }
    };

    // Set up log streaming for already running servers
    const setupStreaming = async () => {
      if (!window.electronAPI) return;
      try {
        await window.electronAPI.server.setupLogStreaming(serverName);
      } catch (error) {
        console.error('Failed to setup log streaming:', error);
      }
    };

    loadExistingLogs();
    setupStreaming();

    const handleLog = (data: { serverName: string; type: 'stdout' | 'stderr'; data: string }) => {
      if (data.serverName === serverName) {
        const logLines = data.data.split('\n');
        logLines.forEach((line, index) => {
          if (line.trim() || index === logLines.length - 1) {
            const newLine: ConsoleLine = {
              id: Date.now().toString() + Math.random() + index,
              text: line || ' ',
              timestamp: new Date().toLocaleTimeString(),
              type: data.type,
            };
            setLines((prev) => {
              const maxLines = settings?.maxConsoleLines || 1000;
              const newLines = [...prev, newLine];
              return newLines.slice(-maxLines);
            });
          }
        });
      }
    };

    window.electronAPI.server.onServerLog(handleLog);

    return () => {
      window.electronAPI?.server.removeServerLogListener();
    };
  }, [serverName, settings]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);
  
  // Show loading state while servers are loading (after all hooks)
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-text-muted font-mono">Loading server...</div>
      </div>
    );
  }

  // Define status variables after loading check (not hooks, so this is safe)
  const isRunning = server?.status === "RUNNING";
  const isStopped = server?.status === "STOPPED";
  const isStarting = server?.status === "STARTING";

  const handleSendCommand = async () => {
    if (!input.trim() || !serverName) return;
    const command = input.trim();
    setInput("");

    // Add command to console
    const commandLine: ConsoleLine = {
      id: Date.now().toString(),
      text: `> ${command}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'command',
    };
    setLines((prev) => [...prev, commandLine]);

    const result = await sendCommand(serverName, command);
    if (!result.success) {
      const errorLine: ConsoleLine = {
        id: Date.now().toString() + 'error',
        text: `Error: ${result.error}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'stderr',
      };
      setLines((prev) => [...prev, errorLine]);
    }
  };

  const handleStart = async () => {
    if (!server) return;
    const ramGB = server.ramGB || 4;
    const result = await startServer(serverName, ramGB);
    if (!result.success) {
      alert(`Failed to start server: ${result.error}`);
    }
  };

  const handleStop = async () => {
    const result = await stopServer(serverName);
    if (!result.success) {
      alert(`Failed to stop server: ${result.error}`);
    }
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    const ramGB = server?.ramGB || 4;
    const result = await restartServer(serverName, ramGB);
    if (!result.success) {
      alert(`Failed to restart server: ${result.error}`);
    }
    setIsRestarting(false);
  };

  const handleKill = async () => {
    if (!showKillConfirm) {
      setShowKillConfirm(true);
      return;
    }
    
    const result = await killServer(serverName);
    if (!result.success) {
      alert(`Failed to kill server: ${result.error}`);
    }
    setShowKillConfirm(false);
  };

  if (!server) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-text-muted font-mono mb-4">Server not found: {serverName}</div>
          <motion.button
            onClick={onBack}
            className="text-accent hover:text-accent/80 font-mono text-sm transition-colors px-4 py-2 border border-accent/30 rounded hover:bg-accent/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back to Servers
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background-secondary p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onBack}
              className="text-text-secondary hover:text-text-primary font-mono text-sm transition-colors"
              whileHover={{ x: -2 }}
            >
              ← BACK
            </motion.button>
            <div className="h-6 w-px bg-border"></div>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary font-mono mb-1">
                {server.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-text-secondary font-mono">
                <StatusBadge status={server.status} />
                <span>Version: {server.version}</span>
                <span>Port: {server.port}</span>
                {server.ramGB && <span>RAM: {server.ramGB}GB</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStopped && (
              <motion.button
                onClick={handleStart}
                className="btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                START
              </motion.button>
            )}
            {isRunning && (
              <>
                <motion.button
                  onClick={handleStop}
                  className="btn-secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  STOP
                </motion.button>
                <motion.button
                  onClick={handleRestart}
                  disabled={isRestarting}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isRestarting ? 1 : 1.02 }}
                  whileTap={{ scale: isRestarting ? 1 : 0.98 }}
                >
                  {isRestarting ? "RESTARTING..." : "RESTART"}
                </motion.button>
                <motion.button
                  onClick={handleKill}
                  className={showKillConfirm ? "bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-mono text-sm uppercase tracking-wider transition-colors" : "btn-secondary"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {showKillConfirm ? "CONFIRM KILL" : "KILL"}
                </motion.button>
              </>
            )}
            {isStarting && (
              <>
                <div className="text-sm text-yellow-400 font-mono uppercase tracking-wider px-4 py-2">
                  Starting...
                </div>
                <motion.button
                  onClick={handleKill}
                  className={showKillConfirm ? "bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-mono text-sm uppercase tracking-wider transition-colors" : "btn-secondary"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {showKillConfirm ? "CONFIRM KILL" : "KILL"}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-6 pt-4 border-b border-border bg-background-secondary overflow-x-auto">
        {(['console', 'files', 'plugins', 'worlds', 'properties', 'settings'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'text-accent border-accent'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            {tab === 'console' ? 'CONSOLE' : 
             tab === 'files' ? 'FILES' :
             tab === 'plugins' ? 'PLUGINS' :
             tab === 'worlds' ? 'WORLDS' :
             tab === 'properties' ? 'PROPERTIES' : 'SETTINGS'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "console" && (
          <div className="h-full flex flex-col">
            {/* Console Output */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 bg-background font-mono text-sm custom-scrollbar"
              style={{
                fontSize: settings?.consoleFontSize || 12,
                whiteSpace: settings?.consoleWordWrap ? 'pre-wrap' : 'pre',
              }}
            >
              {lines.length === 0 ? (
                <div className="text-text-muted text-center py-8">
                  {isRunning
                    ? "Console output will appear here..."
                    : "Start the server to see console output"}
                </div>
              ) : (
                lines.map((line) => (
                  <div
                    key={line.id}
                    className={`mb-1 ${
                      line.type === 'stderr'
                        ? 'text-red-400'
                        : line.type === 'command'
                        ? 'text-accent'
                        : 'text-text-primary'
                    }`}
                  >
                    {settings?.showTimestamps && (
                      <span className="text-text-muted mr-2">[{line.timestamp}]</span>
                    )}
                    <span>{line.text}</span>
                  </div>
                ))
              )}
            </div>

            {/* Console Input */}
            <div className="border-t border-border p-4 bg-background-secondary">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendCommand();
                    }
                  }}
                  placeholder={isRunning ? `> Enter command for ${serverName}...` : "> Server must be running to send commands"}
                  disabled={!isRunning}
                  className="flex-1 bg-background border border-border px-4 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                />
                <motion.button
                  onClick={handleSendCommand}
                  disabled={!isRunning || !input.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: !isRunning || !input.trim() ? 1 : 1.02 }}
                  whileTap={{ scale: !isRunning || !input.trim() ? 1 : 0.98 }}
                >
                  SEND
                </motion.button>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 text-xs text-text-muted font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded"
                  />
                  Auto-scroll
                </label>
                <button
                  onClick={() => setLines([])}
                  className="text-xs text-text-muted font-mono hover:text-text-primary transition-colors"
                >
                  Clear Console
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="h-full overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold text-text-primary font-mono mb-6">
                Server Settings
              </h2>
              <div className="space-y-6">
                <div className="system-card p-6">
                  <h3 className="text-sm font-semibold text-text-primary font-mono mb-4 uppercase tracking-wider">
                    Server Information
                  </h3>
                  <div className="space-y-3 text-sm text-text-secondary font-mono">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="text-text-primary">{server.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span className="text-text-primary">{server.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Port:</span>
                      <span className="text-text-primary">{server.port}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RAM:</span>
                      <span className="text-text-primary">{server.ramGB || 4}GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <StatusBadge status={server.status} />
                    </div>
                  </div>
                </div>

                <div className="system-card p-6">
                  <h3 className="text-sm font-semibold text-text-primary font-mono mb-4 uppercase tracking-wider">
                    RAM Configuration
                  </h3>
                  <p className="text-xs text-text-muted font-mono mb-4">
                    Server RAM allocation settings coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <FileEditor serverName={serverName} />
        )}

        {activeTab === "plugins" && (
          <PluginManager serverName={serverName} />
        )}

        {activeTab === "worlds" && (
          <WorldManager serverName={serverName} />
        )}

        {activeTab === "properties" && (
          <ServerPropertiesEditor serverName={serverName} />
        )}
      </div>
    </div>
  );
}

