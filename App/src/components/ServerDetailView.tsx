import { motion } from "framer-motion";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  const { servers, sendCommand, startServer, stopServer, restartServer, killServer, deleteServer, getServerUsage, updateServerRAM, refreshServers, loading } = useServerManager();
  const [isRestarting, setIsRestarting] = useState(false);
  const [showKillConfirm, setShowKillConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("console");
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [input, setInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [serverUsage, setServerUsage] = useState<{ cpu: number; ram: number; ramMB: number } | null>(null);
  const [ramGB, setRamGB] = useState<number>(4);
  const [savingRAM, setSavingRAM] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'stdout' | 'stderr' | 'command'>('all');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandSuggestions, setCommandSuggestions] = useState<string[]>([]);
  const [chatMode, setChatMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollTopRef = useRef<number>(0);
  const userScrolledRef = useRef<boolean>(false);

  const server = servers.find(s => s.name === serverName);
  
  // Define status variables early so they can be used in useEffect hooks
  const isRunning = server?.status === "RUNNING";
  const isStopped = server?.status === "STOPPED";
  const isStarting = server?.status === "STARTING";

  // Initialize RAM from server
  useEffect(() => {
    if (server?.ramGB !== undefined) {
      setRamGB(server.ramGB);
    } else if (!server?.ramGB) {
      setRamGB(4); // Default to 4GB if not set
    }
  }, [server?.ramGB]);

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

  // Poll server usage when running
  useEffect(() => {
    if (!isRunning || !serverName) {
      setServerUsage(null);
      return;
    }

    const updateUsage = async () => {
      if (!window.electronAPI) return;
      try {
        const result = await getServerUsage(serverName);
        if (result.success && 'cpu' in result && 'ramMB' in result && result.cpu !== undefined && result.ramMB !== undefined) {
          setServerUsage({
            cpu: result.cpu,
            ram: ('ram' in result && result.ram) ? result.ram : result.ramMB / 1024,
            ramMB: result.ramMB
          });
        }
      } catch (error) {
        console.error('Failed to get server usage:', error);
      }
    };

    updateUsage();
    const interval = setInterval(updateUsage, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [isRunning, serverName, getServerUsage]);

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

  // Track user scroll to prevent auto-scroll when user is reading
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      userScrolledRef.current = !isNearBottom;
      lastScrollTopRef.current = container.scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Throttled scroll update to prevent lag
  useEffect(() => {
    if (autoScroll && scrollRef.current && !userScrolledRef.current) {
      // Clear any pending scroll
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Use requestAnimationFrame for smooth scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        if (scrollRef.current && autoScroll && !userScrolledRef.current) {
          const container = scrollRef.current;
          container.scrollTop = container.scrollHeight;
          lastScrollTopRef.current = container.scrollTop;
        }
      }, 16); // ~60fps
    }
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [lines, autoScroll]);

  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Filter and search lines (memoized and optimized)
  const filteredLines = useMemo(() => {
    let filtered = lines;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(line => line.type === filterType);
    }

    // Search filter (using debounced query)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(line => 
        line.text.toLowerCase().includes(query) ||
        line.timestamp.toLowerCase().includes(query)
      );
    }

    // Limit visible lines for performance (show last 500 lines max)
    // If searching, show all matches, otherwise limit
    if (!debouncedSearchQuery.trim() && filtered.length > 500) {
      filtered = filtered.slice(-500);
    }

    return filtered;
  }, [lines, filterType, debouncedSearchQuery]);

  // Common Minecraft server commands for autocomplete
  const commonCommands = [
    'help', 'list', 'stop', 'kick', 'ban', 'pardon', 'ban-ip', 'pardon-ip',
    'whitelist', 'op', 'deop', 'tp', 'give', 'gamemode', 'time', 'weather',
    'difficulty', 'gamerule', 'say', 'tell', 'me', 'seed', 'save-all', 'save-on',
    'save-off', 'reload', 'plugins', 'version', 'tps', 'mspt'
  ];

  // Update command suggestions based on input (only in command mode)
  useEffect(() => {
    if (!chatMode && input.trim() && serverName) {
      const query = input.toLowerCase().trim();
      const suggestions = commonCommands
        .filter(cmd => cmd.startsWith(query) && query.length > 0)
        .slice(0, 5);
      setCommandSuggestions(suggestions);
    } else {
      setCommandSuggestions([]);
    }
  }, [input, serverName, chatMode]);

  const handleSendCommand = useCallback(async () => {
    if (!input.trim() || !serverName) return;
    const inputText = input.trim();
    // In chat mode, prepend "say " to send as chat message
    const command = chatMode ? `say ${inputText}` : inputText;
    
    // Add to command history (avoid duplicates)
    setCommandHistory(prev => {
      const newHistory = prev.filter(c => c !== command);
      return [command, ...newHistory].slice(0, 50); // Keep last 50 commands
    });
    setHistoryIndex(-1);
    
    setInput("");

    // Add command to console
    const commandLine: ConsoleLine = {
      id: Date.now().toString(),
      text: chatMode ? `[Chat] ${inputText}` : `> ${command}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'command',
    };
    setLines((prev) => {
      const maxLines = settings?.maxConsoleLines || 1000;
      const newLines = [...prev, commandLine];
      return newLines.slice(-maxLines);
    });

    const result = await sendCommand(serverName, command);
    if (!result.success) {
      const errorLine: ConsoleLine = {
        id: Date.now().toString() + 'error',
        text: `Error: ${result.error}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'stderr',
      };
      setLines((prev) => {
        const maxLines = settings?.maxConsoleLines || 1000;
        const newLines = [...prev, errorLine];
        return newLines.slice(-maxLines);
      });
    }
    setCommandSuggestions([]);
    inputRef.current?.focus();
  }, [input, serverName, chatMode, sendCommand, settings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && activeTab === 'console') {
        e.preventDefault();
        const searchInput = document.querySelector(`[data-console-search="${serverName}"]`) as HTMLInputElement;
        searchInput?.focus();
        searchInput?.select();
      }
      // Ctrl/Cmd + K to clear
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && activeTab === 'console') {
        e.preventDefault();
        setLines([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, serverName]);
  
  // Show loading state while servers are loading (after all hooks)
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-text-muted font-mono">Loading server...</div>
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Command history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab' && commandSuggestions.length > 0) {
      e.preventDefault();
      setInput(commandSuggestions[0]);
      setCommandSuggestions([]);
    } else {
      // Reset history index when typing
      if (historyIndex !== -1) {
        setHistoryIndex(-1);
      }
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

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${serverName}"? This will permanently delete all server files and cannot be undone.`)) {
      setShowDeleteConfirm(false);
      return;
    }
    
    const result = await deleteServer(serverName);
    if (result.success) {
      onBack(); // Go back to server list
    } else {
      alert(`Failed to delete server: ${result.error}`);
      setShowDeleteConfirm(false);
    }
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
                {isRunning && serverUsage && (
                  <>
                    <span className="text-accent">•</span>
                    <span>CPU: {serverUsage.cpu.toFixed(1)}%</span>
                    <span>RAM: {serverUsage.ramMB.toFixed(0)} MB</span>
                  </>
                )}
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
          <div className="h-full flex flex-col bg-background">
            {/* Search and Filter Bar */}
            <div className="border-b border-border p-3 bg-background-secondary/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 relative">
                  <input
                    data-console-search={serverName}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search console... (Ctrl+F)"
                    className="w-full bg-background border border-border px-4 py-2 pl-10 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded transition-colors"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-background border border-border px-3 py-2 text-text-primary font-mono text-xs focus:outline-none focus:border-accent/50 rounded transition-colors"
                >
                  <option value="all">All</option>
                  <option value="stdout">Output</option>
                  <option value="stderr">Errors</option>
                  <option value="command">Commands</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-text-secondary font-mono text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => {
                        setAutoScroll(e.target.checked);
                        if (window.electronAPI && settings) {
                          window.electronAPI.server.saveAppSettings({
                            ...settings,
                            consoleAutoScroll: e.target.checked
                          }).then(() => {
                            setSettings({ ...settings, consoleAutoScroll: e.target.checked });
                          });
                        }
                      }}
                      className="w-4 h-4 accent-accent cursor-pointer rounded"
                    />
                    Auto-scroll
                  </label>
                  <span className="text-text-muted font-mono text-xs">
                    {filteredLines.length} / {lines.length} lines
                    {searchQuery && ` (filtered)`}
                  </span>
                </div>
                <button
                  onClick={() => setLines([])}
                  className="text-xs text-text-muted font-mono hover:text-text-primary transition-colors px-3 py-1 rounded border border-border hover:border-accent/30"
                >
                  Clear (Ctrl+K)
                </button>
              </div>
            </div>

            {/* Console Output */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-sm custom-scrollbar p-4"
              style={{
                fontSize: `${settings?.consoleFontSize || 13}px`,
                fontFamily: 'Consolas, "Courier New", monospace',
              }}
            >
              {filteredLines.length === 0 ? (
                <div className="text-text-muted text-sm text-center py-8">
                  {isRunning
                    ? searchQuery
                      ? "No lines match your search."
                      : "Console output will appear here..."
                    : "Start the server to see console output"}
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredLines.map((line) => {
                    const isHighlighted = debouncedSearchQuery && line.text.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
                    const lineText = line.text;
                    const hasSearch = debouncedSearchQuery && debouncedSearchQuery.trim();
                    
                    return (
                      <div
                        key={line.id}
                        className={`group flex gap-3 py-1 px-2 rounded transition-colors ${
                          line.type === 'stderr' 
                            ? 'text-red-400 bg-red-400/10 hover:bg-red-400/15' 
                            : line.type === 'command' 
                            ? 'text-accent bg-accent/10 hover:bg-accent/15' 
                            : 'text-text-primary hover:bg-background-secondary/50'
                        } ${isHighlighted ? 'ring-1 ring-accent/50' : ''}`}
                      >
                          {hasSearch ? (
                            <span 
                              className={`flex-1 ${
                                settings?.consoleWordWrap 
                                  ? 'whitespace-pre-wrap break-words' 
                                  : 'whitespace-pre'
                              }`}
                              dangerouslySetInnerHTML={{
                                __html: lineText
                                  .replace(/&/g, '&amp;')
                                  .replace(/</g, '&lt;')
                                  .replace(/>/g, '&gt;')
                                  .replace(
                                    new RegExp(`(${debouncedSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                    '<mark class="bg-accent/30 text-accent">$1</mark>'
                                  )
                              }}
                            />
                          ) : (
                            <span 
                              className={`flex-1 ${
                                settings?.consoleWordWrap 
                                  ? 'whitespace-pre-wrap break-words' 
                                  : 'whitespace-pre'
                              }`}
                            >
                              {lineText}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Console Input */}
            <div className="border-t border-border p-4 bg-background-secondary/50">
              <form onSubmit={(e) => { e.preventDefault(); handleSendCommand(); }} className="space-y-2">
                {/* Command Suggestions */}
                {commandSuggestions.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {commandSuggestions.map((suggestion, idx) => (
                      <motion.button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setInput(suggestion);
                          setCommandSuggestions([]);
                          inputRef.current?.focus();
                        }}
                        className="px-3 py-1 bg-accent/10 border border-accent/30 text-accent text-xs font-mono rounded hover:bg-accent/20 transition-colors"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSendCommand();
                        } else {
                          handleKeyDown(e);
                        }
                      }}
                      placeholder={isRunning ? (chatMode ? `Type a message to send in chat...` : `Enter command for ${serverName}... (↑↓ for history, Tab for autocomplete)`) : "Server must be running to send commands"}
                      disabled={!isRunning}
                      className="w-full bg-background border border-border px-4 py-3 pl-10 pr-12 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-sm focus:shadow-md focus:shadow-accent/10"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent font-mono text-sm pointer-events-none">
                      &gt;
                    </span>
                    {commandHistory.length > 0 && historyIndex >= 0 && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted text-xs font-mono">
                        {historyIndex + 1}/{commandHistory.length}
                      </span>
                    )}
                  </div>
                  <motion.button
                    type="submit"
                    disabled={!isRunning || !input.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3"
                    whileHover={{ scale: !isRunning || !input.trim() ? 1 : 1.02 }}
                    whileTap={{ scale: !isRunning || !input.trim() ? 1 : 0.98 }}
                  >
                    SEND
                  </motion.button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
                    <span>↑↓ History</span>
                    <span>•</span>
                    <span>Tab Autocomplete</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatMode(!chatMode)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                      chatMode
                        ? 'bg-accent/20 border border-accent/40 text-accent'
                        : 'bg-background-secondary/50 border border-border text-text-secondary hover:border-accent/30'
                    }`}
                  >
                    {chatMode ? '💬 Chat' : '⚙️ Command'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="h-full overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-text-primary font-mono mb-6">
                Server Settings
              </h2>
              <div className="space-y-6">
                {/* Server Information */}
                <div className="system-card p-6">
                  <h3 className="text-sm font-semibold text-text-primary font-mono mb-4 uppercase tracking-wider">
                    Server Information
                  </h3>
                  <div className="space-y-3 text-sm text-text-secondary font-mono">
                    <div className="flex justify-between items-center">
                      <span>Name:</span>
                      <span className="text-text-primary">{server.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Version:</span>
                      <span className="text-text-primary">{server.version}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Port:</span>
                      <span className="text-text-primary">{server.port}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <StatusBadge status={server.status} />
                    </div>
                  </div>
                </div>

                {/* RAM Configuration */}
                <div className="system-card p-6">
                  <h3 className="text-sm font-semibold text-text-primary font-mono mb-4 uppercase tracking-wider">
                    RAM Configuration
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-text-secondary font-mono mb-2">
                        Allocated RAM (GB)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          min="1"
                          max="64"
                          value={ramGB}
                          onChange={(e) => setRamGB(Math.max(1, Math.min(64, parseInt(e.target.value) || 1)))}
                          disabled={isRunning || savingRAM}
                          className="flex-1 bg-background border border-border px-4 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-text-muted font-mono text-sm">GB</span>
                      </div>
                      <p className="text-xs text-text-muted font-mono mt-2">
                        {isRunning 
                          ? "Stop the server to change RAM allocation" 
                          : "This setting will be applied the next time you start the server"}
                      </p>
                    </div>
                    <motion.button
                      onClick={async () => {
                        if (!server) return;
                        setSavingRAM(true);
                        const result = await updateServerRAM(serverName, ramGB);
                        if (result.success) {
                          // Refresh servers to get updated RAM value
                          await refreshServers();
                          alert(`RAM allocation updated to ${ramGB}GB. This will take effect on the next server start.`);
                        } else {
                          alert(`Failed to update RAM: ${result.error}`);
                        }
                        setSavingRAM(false);
                      }}
                      disabled={isRunning || savingRAM || ramGB === (server?.ramGB ?? 4)}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: isRunning || savingRAM || ramGB === (server?.ramGB ?? 4) ? 1 : 1.02 }}
                      whileTap={{ scale: isRunning || savingRAM || ramGB === (server?.ramGB ?? 4) ? 1 : 0.98 }}
                    >
                      {savingRAM ? "SAVING..." : "SAVE RAM SETTINGS"}
                    </motion.button>
                  </div>
                </div>

                {/* Performance Metrics */}
                {isRunning && serverUsage && (
                  <div className="system-card p-6">
                    <h3 className="text-sm font-semibold text-text-primary font-mono mb-4 uppercase tracking-wider">
                      Performance Metrics
                    </h3>
                    <div className="space-y-3 text-sm text-text-secondary font-mono">
                      <div className="flex justify-between items-center">
                        <span>CPU Usage:</span>
                        <span className="text-text-primary">
                          {serverUsage.cpu > 0 ? `${serverUsage.cpu.toFixed(1)}%` : '< 0.1%'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Current RAM Usage:</span>
                        <span className="text-text-primary">
                          {serverUsage.ramMB.toFixed(0)} MB ({serverUsage.ram.toFixed(2)} GB)
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Allocated RAM:</span>
                        <span className="text-text-primary font-semibold">{server.ramGB || 4} GB</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span>Usage Percentage:</span>
                          <span className="text-text-primary">
                            {((serverUsage.ramMB / ((server.ramGB || 4) * 1024)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted font-mono mt-4">
                      Note: CPU usage may show 0% on Windows. RAM usage reflects actual memory consumption by the server process.
                    </p>
                  </div>
                )}

                {/* Danger Zone */}
                <div className="system-card p-6 border-2 border-red-500/30">
                  <h3 className="text-sm font-semibold text-red-400 font-mono mb-4 uppercase tracking-wider">
                    Danger Zone
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-text-muted font-mono mb-4">
                        Permanently delete this server and all its files. This action cannot be undone.
                      </p>
                      <motion.button
                        onClick={handleDelete}
                        className={showDeleteConfirm 
                          ? "bg-red-500 hover:bg-red-600 px-6 py-3 rounded font-mono text-sm uppercase tracking-wider transition-colors text-white w-full" 
                          : "bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 px-6 py-3 rounded font-mono text-sm uppercase tracking-wider transition-colors text-red-400 w-full"}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {showDeleteConfirm ? "CONFIRM DELETE SERVER" : "DELETE SERVER"}
                      </motion.button>
                      {showDeleteConfirm && (
                        <p className="text-xs text-red-400 font-mono mt-2 text-center">
                          Click again to confirm deletion
                        </p>
                      )}
                    </div>
                  </div>
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

