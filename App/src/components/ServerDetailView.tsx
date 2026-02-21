import { motion } from "framer-motion";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ToggleSwitch from "./ToggleSwitch";
import { useServerManager } from "../hooks/useServerManager";
import { useToast } from "./ToastProvider";
import StatusBadge from "./StatusBadge";
import FileEditor from "./FileEditor";
import PluginManager from "./PluginManager";
import ModManager from "./ModManager";
import WorldManager from "./WorldManager";
import ServerPropertiesEditor from "./ServerPropertiesEditor";
import { lineHasServerTimestamp } from "../utils/consoleUtils";

interface ServerDetailViewProps {
  serverName: string;
  onBack: () => void;
}

type Tab = "dashboard" | "console" | "files" | "plugins" | "mods" | "worlds" | "properties" | "settings";

interface ConsoleLine {
  id: string;
  text: string;
  timestamp: string;
  type?: 'stdout' | 'stderr' | 'command';
}

const GRAPH_RANGE_OPTIONS = [
  { id: '5m', label: '5 min', durationSeconds: 300 },
  { id: '10m', label: '10 min', durationSeconds: 600 },
  { id: '30m', label: '30 min', durationSeconds: 1800 },
  { id: '1h', label: '1 hr', durationSeconds: 3600 },
] as const;

function DashboardAreaGraph({
  values,
  timestamps,
  timeRangeSeconds,
  max,
  label,
  formatTick,
  currentValue,
}: {
  values: number[];
  timestamps: number[];
  timeRangeSeconds: number;
  max: number;
  label: string;
  formatTick: (v: number) => string;
  currentValue?: string;
}) {
  const w = 800;
  const h = 180;
  const leftPad = 48;
  const rightPad = 16;
  const padY = 10;
  const chartW = w - leftPad - rightPad;
  const chartH = h - padY * 2;
  const range = max > 0 ? max : 1;
  const yTicks = [0, 0.25 * range, 0.5 * range, 0.75 * range, range];
  if (values.length < 2 || timestamps.length !== values.length) {
    return (
      <div className="border border-border rounded-lg bg-background-secondary overflow-hidden flex flex-col min-h-[120px] h-full min-h-0">
        <div className="px-3 py-1.5 border-b border-border text-xs font-mono uppercase tracking-wider text-text-muted flex-shrink-0 flex items-center justify-between gap-2">
          <span className="truncate">{label}</span>
          {currentValue !== undefined && (
            <span className="text-text-muted/70 font-normal normal-case text-[11px] flex-shrink-0">{currentValue}</span>
          )}
        </div>
        <div className="flex-1 min-h-[80px] flex items-center justify-center text-text-muted font-mono text-sm">
          Collecting data…
        </div>
      </div>
    );
  }
  const now = Date.now();
  const windowMs = timeRangeSeconds * 1000;
  const minTime = now - windowMs;
  const maxTime = now;
  const xScale = (t: number) => leftPad + ((t - minTime) / (maxTime - minTime || 1)) * chartW;
  const yScale = (v: number) => padY + chartH - (Math.min(v, range) / range) * chartH;
  const linePoints = values.map((v, i) => `${xScale(timestamps[i])},${yScale(v)}`).join(' ');
  const firstX = xScale(timestamps[0]);
  const lastX = xScale(timestamps[timestamps.length - 1]);
  const baselineY = h - padY;
  const areaPoints = `${firstX},${baselineY} ${linePoints} ${lastX},${baselineY}`;
  return (
    <div className="border border-border rounded-lg bg-background-secondary overflow-hidden flex flex-col min-h-[120px] h-full min-h-0">
      <div className="px-3 py-1.5 border-b border-border text-xs font-mono uppercase tracking-wider text-text-muted flex-shrink-0 flex items-center justify-between gap-2">
        <span className="truncate">{label}</span>
        {currentValue !== undefined && (
          <span className="text-text-muted/60 font-normal normal-case text-[11px] flex-shrink-0">{currentValue}</span>
        )}
      </div>
      <div className="flex-1 min-h-[80px] min-w-0 w-full overflow-hidden flex">
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block text-accent flex-1 min-w-0 min-h-0">
          {yTicks.map((t, i) => (
            <text
              key={`y-${i}`}
              x={leftPad - 6}
              y={padY + chartH - (t / range) * chartH + 4}
              textAnchor="end"
              className="fill-current text-text-muted font-mono text-[10px]"
              style={{ fontFamily: 'ui-monospace, monospace' }}
            >
              {formatTick(t)}
            </text>
          ))}
          <polygon
            fill="currentColor"
            fillOpacity="0.2"
            points={areaPoints}
          />
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePoints}
          />
        </svg>
      </div>
    </div>
  );
}

export default function ServerDetailView({ serverName, onBack }: ServerDetailViewProps) {
  const { servers, sendCommand, startServer, stopServer, restartServer, killServer, deleteServer, getServerUsage, updateServerRAM, refreshServers, loading, getPlayerCount } = useServerManager();
  const { notify } = useToast();
  const [isRestarting, setIsRestarting] = useState(false);
  const [showKillConfirm, setShowKillConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [input, setInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [settings, setSettings] = useState<import("../hooks/useServerManager").AppSettings | null>(null);
  const [serverUsage, setServerUsage] = useState<{ cpu: number; ram: number; ramMB: number } | null>(null);
  const [ramGB, setRamGB] = useState<number>(4);
  const [savingRAM, setSavingRAM] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'stdout' | 'stderr' | 'command'>('all');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandSuggestions, setCommandSuggestions] = useState<string[]>([]);
  const [chatMode, setChatMode] = useState(false);
  const [supportsPlugins, setSupportsPlugins] = useState<boolean | null>(null);
  const [supportsMods, setSupportsMods] = useState<boolean | null>(null);
  const [systemInfo, setSystemInfo] = useState<{ cpu: { tempCelsius?: number | null }; memory: { totalGB: number; freeGB: number; usedGB: number }; localAddress?: string | null } | null>(null);
  const [playerCount, setPlayerCount] = useState<{ online: number; max: number } | null>(null);
  const [usageHistory, setUsageHistory] = useState<{ timestamps: number[]; cpu: number[]; ramMB: number[] }>({ timestamps: [], cpu: [], ramMB: [] });
  const [playerCountHistory, setPlayerCountHistory] = useState<{ timestamps: number[]; values: number[] }>({ timestamps: [], values: [] });
  const [graphRange, setGraphRange] = useState<(typeof GRAPH_RANGE_OPTIONS)[number]['id']>('5m');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollTopRef = useRef<number>(0);
  const userScrolledRef = useRef<boolean>(false);

  const server = servers.find(s => s.id === serverName);

  // Check if server supports plugins
  useEffect(() => {
    const checkPluginSupport = async () => {
      if (!window.electronAPI || !window.electronAPI.server) return;
      if (typeof window.electronAPI.server.checkJarSupportsPlugins !== 'function') {
        setSupportsPlugins(false);
        return;
      }
      try {
        const result = await window.electronAPI.server.checkJarSupportsPlugins(serverName);
        const supports = result?.supportsPlugins ?? false;
        setSupportsPlugins(supports);
        if (!supports && activeTab === 'plugins') setActiveTab('console');
      } catch (error) {
        setSupportsPlugins(false);
      }
    };
    checkPluginSupport();
  }, [serverName, activeTab]);

  // Check if server supports mods (Fabric/Forge)
  useEffect(() => {
    const checkModSupport = async () => {
      if (!window.electronAPI?.server?.checkJarSupportsMods) return;
      try {
        const result = await window.electronAPI.server.checkJarSupportsMods(serverName);
        const supports = result?.supportsMods ?? false;
        setSupportsMods(supports);
        if (!supports && activeTab === 'mods') setActiveTab('console');
      } catch {
        setSupportsMods(false);
      }
    };
    checkModSupport();
  }, [serverName, activeTab]);
  
  // Define status variables early so they can be used in useEffect hooks
  const isRunning = server?.status === "RUNNING";
  const isStopped = server?.status === "STOPPED";
  const isStarting = server?.status === "STARTING";
  // Build usage history for graphs when on dashboard (keep up to 1 hr at 1 sample/sec)
  useEffect(() => {
    if (activeTab !== 'dashboard' || !serverUsage) return;
    const now = Date.now();
    setUsageHistory((prev) => {
      const maxLen = 3600;
      const prevTs = Array.isArray(prev.timestamps) ? prev.timestamps : [];
      const prevCpu = Array.isArray(prev.cpu) ? prev.cpu : [];
      const prevRam = Array.isArray(prev.ramMB) ? prev.ramMB : [];
      const timestamps = [...prevTs, now].slice(-maxLen);
      const cpu = [...prevCpu, serverUsage.cpu].slice(-maxLen);
      const ramMB = [...prevRam, serverUsage.ramMB].slice(-maxLen);
      return { timestamps, cpu, ramMB };
    });
  }, [activeTab, serverUsage?.cpu, serverUsage?.ramMB]);

  // Load dashboard data when dashboard tab is active (system info, player count)
  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    let cancelled = false;
    const load = async () => {
      if (!window.electronAPI) return;
      try {
        const [info, players] = await Promise.all([
          window.electronAPI.server.getSystemInfo(),
          isRunning ? getPlayerCount(serverName) : Promise.resolve(null)
        ]);
        if (!cancelled && info) setSystemInfo(info);
        if (!cancelled && players && players.success && 'online' in players && typeof players.online === 'number') {
          const online = players.online;
          const max = players.max ?? 0;
          setPlayerCount({ online, max });
          setPlayerCountHistory((prev) => {
            const maxLen = 3600;
            const ts = [...(prev.timestamps ?? []), Date.now()].slice(-maxLen);
            const vals = [...(prev.values ?? []), online].slice(-maxLen);
            return { timestamps: ts, values: vals };
          });
        } else if (!cancelled && !isRunning) {
          setPlayerCount(null);
        }
      } catch (e) {
        if (!cancelled) setSystemInfo(null);
      }
    };
    load();
    const interval = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeTab, serverName, isRunning, getPlayerCount]);

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

    const handleSettingsUpdate = (updated: import("../hooks/useServerManager").AppSettings) => {
      setSettings(updated || {});
      setAutoScroll((updated?.consoleAutoScroll as boolean | undefined) !== false);
    };

    const unsubscribe = window.electronAPI?.server?.onAppSettingsUpdated?.(handleSettingsUpdate);
    return () => {
      if (unsubscribe) unsubscribe();
    };
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
    const interval = setInterval(updateUsage, 1000);
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
          const existingLines: ConsoleLine[] = result.lines
            .filter((line) => line.trim() !== "")
            .map((line, index) => ({
              id: `existing-${index}-${Date.now()}`,
              text: line.trim(),
              timestamp: new Date().toLocaleTimeString(),
              type: "stdout" as const,
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
          if (line.trim() !== "") {
            const newLine: ConsoleLine = {
              id: Date.now().toString() + Math.random() + index,
              text: line.trim(),
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

  // When switching to a server, reset scroll intent and schedule scroll-to-bottom (logs load async)
  const scrollToBottomNextPaintRef = useRef(false);
  useEffect(() => {
    if (!serverName) return;
    userScrolledRef.current = false;
    scrollToBottomNextPaintRef.current = true;
    // Fallback: scroll again after delays so we hit bottom once logs have loaded
    const t1 = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 150);
    const t2 = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [serverName]);

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

  // Scroll to bottom when lines change (after paint so scrollHeight is correct)
  const scrollToBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
    lastScrollTopRef.current = container.scrollTop;
  }, []);

  // When switching to the console tab, scroll to bottom after the tab content is mounted
  useEffect(() => {
    if (activeTab !== 'console') return;
    userScrolledRef.current = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    });
    const t = setTimeout(() => scrollToBottom(), 100);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [activeTab, scrollToBottom]);

  // When we have lines and either auto-scroll is on or we just switched server, scroll to bottom after layout
  useEffect(() => {
    if (lines.length === 0) return;
    const shouldScroll = (autoScroll && !userScrolledRef.current) || scrollToBottomNextPaintRef.current;
    if (!shouldScroll) return;

    if (scrollToBottomNextPaintRef.current) {
      scrollToBottomNextPaintRef.current = false;
    }

    // Double rAF: run after React has committed and browser has laid out, so scrollHeight is correct
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    });
    return () => cancelAnimationFrame(raf1);
  }, [lines, autoScroll, scrollToBottom]);

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
      notify({
        type: "error",
        title: "Start failed",
        message: result.error || "Unable to start the server."
      });
    }
  };

  const handleStop = async () => {
    const result = await stopServer(serverName);
    if (!result.success) {
      notify({
        type: "error",
        title: "Stop failed",
        message: result.error || "Unable to stop the server."
      });
    }
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    const ramGB = server?.ramGB || 4;
    const result = await restartServer(serverName, ramGB);
    if (!result.success) {
      notify({
        type: "error",
        title: "Restart failed",
        message: result.error || "Unable to restart the server."
      });
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
      notify({
        type: "error",
        title: "Kill failed",
        message: result.error || "Unable to kill the server."
      });
    }
    setShowKillConfirm(false);
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${server?.name ?? serverName}"? This will permanently delete all server files and cannot be undone.`)) {
      setShowDeleteConfirm(false);
      return;
    }
    
    const result = await deleteServer(serverName);
    if (result.success) {
      onBack(); // Go back to server list
    } else {
      notify({
        type: "error",
        title: "Delete failed",
        message: result.error || "Unable to delete the server."
      });
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
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background-secondary p-4 sm:p-6 min-w-0">
        <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <motion.button
              onClick={onBack}
              className="text-text-secondary hover:text-text-primary font-mono text-sm transition-colors flex-shrink-0"
              whileHover={{ x: -2 }}
            >
              ← BACK
            </motion.button>
            <div className="h-6 w-px bg-border flex-shrink-0 hidden sm:block"></div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-text-primary font-mono mb-1 truncate">
                {server.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-text-secondary font-mono">
                <StatusBadge status={server.status} />
                <span className="whitespace-nowrap">Version: {server.version}</span>
                <span className="whitespace-nowrap">Port: {server.port}</span>
                {server.ramGB && <span className="whitespace-nowrap">RAM: {server.ramGB}GB</span>}
                {systemInfo?.localAddress && (
                  <>
                    <span className="text-accent flex-shrink-0">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const addr = `${systemInfo.localAddress}:${server?.port ?? 25565}`;
                        navigator.clipboard.writeText(addr);
                        notify({ type: 'success', title: 'Copied', message: 'LAN address copied to clipboard.' });
                      }}
                      title="Click to copy"
                      className="whitespace-nowrap text-xs sm:text-sm font-mono px-2 py-1 rounded border border-accent/40 text-accent bg-accent/5 hover:bg-accent/10 hover:border-accent/60 transition-colors"
                    >
                      {systemInfo.localAddress}:{server?.port ?? 25565}
                    </button>
                  </>
                )}
                {isRunning && serverUsage && (
                  <>
                    <span className="text-accent flex-shrink-0">•</span>
                    <span className="whitespace-nowrap">CPU: {serverUsage.cpu.toFixed(1)}%</span>
                    <span className="whitespace-nowrap">RAM: {serverUsage.ramMB.toFixed(0)} MB</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
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
      <div className="flex gap-2 px-4 sm:px-6 pt-3 sm:pt-4 border-b border-border bg-background-secondary overflow-x-auto min-w-0 shrink-0">
        {(['dashboard', 'console', 'files', 'plugins', 'mods', 'worlds', 'properties', 'settings'] as Tab[])
          .filter(tab => {
            if (tab === 'plugins' && supportsPlugins === false) return false;
            if (tab === 'mods' && supportsMods === false) return false;
            return true;
          })
          .map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'text-accent border-accent'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            {tab === 'dashboard' ? 'DASHBOARD' :
             tab === 'console' ? 'CONSOLE' :
             tab === 'files' ? 'FILES' :
             tab === 'plugins' ? 'PLUGINS' :
             tab === 'mods' ? 'MODS' :
             tab === 'worlds' ? 'WORLDS' :
             tab === 'properties' ? 'PROPERTIES' : 'SETTINGS'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden min-w-0 flex flex-col">
        {activeTab === "dashboard" && (
          <div className="h-full flex flex-col bg-background p-3 font-mono min-h-0 min-w-0 overflow-hidden">
            <div className="flex items-center justify-end gap-1 mb-1.5 flex-shrink-0 flex-wrap">
              <span className="text-text-muted text-xs uppercase tracking-wider mr-1.5">Graph</span>
              {GRAPH_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGraphRange(opt.id)}
                  className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                    graphRange === opt.id
                      ? 'bg-accent/20 text-accent border border-accent/40'
                      : 'text-text-muted hover:text-text-primary border border-transparent hover:border-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-2 min-h-0 min-w-0 overflow-hidden">
              {!isRunning ? (
                <div className="flex-1 min-h-0 flex items-center justify-center border border-border rounded-lg bg-background-secondary">
                  <div className="text-center">
                    <p className="text-text-muted font-mono text-sm uppercase tracking-wider">Server not running</p>
                    <p className="text-text-muted/70 font-mono text-xs mt-1">Start the server to see CPU, RAM, and player graphs</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                    <DashboardAreaGraph
                      values={(() => {
                        const rangeOpt = GRAPH_RANGE_OPTIONS.find((o) => o.id === graphRange);
                        const windowMs = (rangeOpt?.durationSeconds ?? 300) * 1000;
                        const cutoff = Date.now() - windowMs;
                        const indices = usageHistory.timestamps.map((t, i) => (t >= cutoff ? i : -1)).filter((i) => i >= 0);
                        return indices.map((i) => usageHistory.cpu[i]);
                      })()}
                      timestamps={(() => {
                        const rangeOpt = GRAPH_RANGE_OPTIONS.find((o) => o.id === graphRange);
                        const windowMs = (rangeOpt?.durationSeconds ?? 300) * 1000;
                        const cutoff = Date.now() - windowMs;
                        return usageHistory.timestamps.filter((t) => t >= cutoff);
                      })()}
                      timeRangeSeconds={GRAPH_RANGE_OPTIONS.find((o) => o.id === graphRange)?.durationSeconds ?? 300}
                      max={100}
                      label="CPU %"
                      formatTick={(v) => `${Math.round(v)}%`}
                      currentValue={serverUsage ? `${serverUsage.cpu.toFixed(1)}%` : undefined}
                    />
                  </div>
                  <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                    <DashboardAreaGraph
                      values={(() => {
                        const rangeOpt = GRAPH_RANGE_OPTIONS.find((o) => o.id === graphRange);
                        const windowMs = (rangeOpt?.durationSeconds ?? 300) * 1000;
                        const cutoff = Date.now() - windowMs;
                        const indices = usageHistory.timestamps.map((t, i) => (t >= cutoff ? i : -1)).filter((i) => i >= 0);
                        return indices.map((i) => usageHistory.ramMB[i]);
                      })()}
                      timestamps={(() => {
                        const rangeOpt = GRAPH_RANGE_OPTIONS.find((o) => o.id === graphRange);
                        const windowMs = (rangeOpt?.durationSeconds ?? 300) * 1000;
                        const cutoff = Date.now() - windowMs;
                        return usageHistory.timestamps.filter((t) => t >= cutoff);
                      })()}
                      timeRangeSeconds={GRAPH_RANGE_OPTIONS.find((o) => o.id === graphRange)?.durationSeconds ?? 300}
                      max={server?.ramGB ? server.ramGB * 1024 : (usageHistory.ramMB.length ? Math.max(...usageHistory.ramMB, 1) : 4096)}
                      label="RAM (MB)"
                      formatTick={(v) => `${Math.round(v)}`}
                      currentValue={serverUsage ? `${Math.round(serverUsage.ramMB)} MB` : undefined}
                    />
                  </div>
                  <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                    <DashboardAreaGraph
                      values={(() => {
                        const rangeOpt = GRAPH_RANGE_OPTIONS.find((o) => o.id === graphRange);
                        const windowMs = (rangeOpt?.durationSeconds ?? 300) * 1000;
                        const cutoff = Date.now() - windowMs;
                        const indices = (playerCountHistory.timestamps ?? []).map((t, i) => (t >= cutoff ? i : -1)).filter((i) => i >= 0);
                        return indices.map((i) => (playerCountHistory.values ?? [])[i] ?? 0);
                      })()}
                      timestamps={(() => {
                        const rangeOpt = GRAPH_RANGE_OPTIONS.find((o) => o.id === graphRange);
                        const windowMs = (rangeOpt?.durationSeconds ?? 300) * 1000;
                        const cutoff = Date.now() - windowMs;
                        return (playerCountHistory.timestamps ?? []).filter((t) => t >= cutoff);
                      })()}
                      timeRangeSeconds={GRAPH_RANGE_OPTIONS.find((o) => o.id === graphRange)?.durationSeconds ?? 300}
                      max={Math.max(playerCount?.max ?? 20, 1)}
                      label="Players"
                      formatTick={(v) => `${Math.round(v)}`}
                      currentValue={playerCount != null ? `${playerCount.online} / ${playerCount.max}` : undefined}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 flex-shrink-0 mt-2 min-w-0">
                <div className="border border-border rounded-lg p-2.5 bg-background-secondary min-w-0 overflow-hidden">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-0.5 truncate">CPU</div>
                  <div className="text-base text-accent font-mono truncate" title={serverUsage ? `${serverUsage.cpu.toFixed(1)}%` : ''}>
                    {serverUsage ? `${serverUsage.cpu.toFixed(1)}%` : isRunning ? '—' : '0%'}
                  </div>
                </div>
                <div className="border border-border rounded-lg p-2.5 bg-background-secondary min-w-0 overflow-hidden">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-0.5 truncate">RAM (used)</div>
                  <div className="text-base text-accent font-mono truncate" title={serverUsage ? `${Math.round(serverUsage.ramMB)} MB` : ''}>
                    {serverUsage ? `${Math.round(serverUsage.ramMB)} MB` : isRunning ? '—' : '0 MB'}
                  </div>
                  {server?.ramGB != null && (
                    <div className="text-xs text-text-muted mt-0.5 truncate">of {server.ramGB} GB</div>
                  )}
                </div>
                <div className="border border-border rounded-lg p-2.5 bg-background-secondary min-w-0 overflow-hidden">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-0.5 truncate">RAM %</div>
                  <div className="text-base text-accent font-mono truncate">
                    {serverUsage && server?.ramGB
                      ? `${((serverUsage.ramMB / (server.ramGB * 1024)) * 100).toFixed(1)}%`
                      : isRunning ? '—' : '0%'}
                  </div>
                </div>
                <div className="border border-border rounded-lg p-2.5 bg-background-secondary min-w-0 overflow-hidden">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-0.5 truncate">Players</div>
                  <div className="text-base text-accent font-mono truncate">
                    {playerCount != null ? `${playerCount.online} / ${playerCount.max}` : isRunning ? '—' : '0 / 0'}
                  </div>
                </div>
                <div className="border border-border rounded-lg p-2.5 bg-background-secondary min-w-0 overflow-hidden">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-0.5 truncate">System memory</div>
                  <div className="text-base text-accent font-mono truncate" title={systemInfo ? `${systemInfo.memory.usedGB} / ${systemInfo.memory.totalGB} GB` : ''}>
                    {systemInfo ? `${systemInfo.memory.usedGB} / ${systemInfo.memory.totalGB} GB` : '—'}
                  </div>
                </div>
                <div className="border border-border rounded-lg p-2.5 bg-background-secondary min-w-0 overflow-hidden">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-0.5 truncate">CPU temp</div>
                  <div className="text-base text-accent font-mono truncate">
                    {systemInfo?.cpu.tempCelsius != null ? `${systemInfo.cpu.tempCelsius} °C` : '—'}
                  </div>
                </div>
              </div>
          </div>
        )}
        {activeTab === "console" && (
          <div className="grid grid-rows-[auto_1fr_auto] h-full min-h-0 bg-background overflow-hidden">
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
                  onChange={(e) => setFilterType((e.target.value as 'all' | 'stdout' | 'stderr' | 'command') || 'all')}
                  className="select-custom"
                >
                  <option value="all">All</option>
                  <option value="stdout">Output</option>
                  <option value="stderr">Errors</option>
                  <option value="command">Commands</option>
                </select>
              </div>
            </div>

            {/* Console Output - middle row takes all space */}
            <div
              ref={scrollRef}
              className="min-h-0 overflow-y-auto overflow-x-hidden font-mono text-sm custom-scrollbar p-4"
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
                    const lineStyle =
                      line.type === "stderr"
                        ? "text-red-400 bg-red-400/10 hover:bg-red-400/15"
                        : line.type === "command"
                        ? "text-accent bg-accent/10 hover:bg-accent/15"
                        : "text-text-primary hover:bg-background-secondary/50";
                    return (
                      <div
                        key={line.id}
                        className={`group py-1 px-2 rounded transition-colors ${lineStyle} ${isHighlighted ? "ring-1 ring-accent/50" : ""}`}
                      >
                          {hasSearch ? (
                            <span 
                              className={`${
                                settings?.consoleWordWrap 
                                  ? 'whitespace-pre-wrap break-words' 
                                  : 'whitespace-pre'
                              }`}
                              dangerouslySetInnerHTML={{
                                __html: `${settings?.showTimestamps !== false && !lineHasServerTimestamp(lineText) ? `[${line.timestamp}] ` : ''}${lineText}`
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
                              className={`${
                                settings?.consoleWordWrap 
                                  ? 'whitespace-pre-wrap break-words' 
                                  : 'whitespace-pre'
                              }`}
                            >
                              {settings?.showTimestamps !== false && !lineHasServerTimestamp(lineText) ? `[${line.timestamp}] ` : ''}{lineText}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Console Input - fixed at bottom */}
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
                      placeholder={isRunning ? (chatMode ? `Type a message to send in chat...` : `Enter command for ${server.name}... (↑↓ for history, Tab for autocomplete)`) : "Server must be running to send commands"}
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
                    <span>↑↓ History</span>
                    <span>•</span>
                    <span>Tab Autocomplete</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-text-secondary font-mono text-xs">
                      <span>Auto-scroll</span>
                      <ToggleSwitch
                        checked={autoScroll}
                        onChange={(checked) => {
                          setAutoScroll(checked);
                          if (window.electronAPI && settings) {
                            window.electronAPI.server.saveAppSettings({
                              ...settings,
                              consoleAutoScroll: checked
                            }).then((saved) => {
                              setSettings(saved || { ...settings, consoleAutoScroll: checked });
                            });
                          }
                        }}
                        ariaLabel="Auto-scroll console"
                      />
                    </div>
                    <span className="text-text-muted font-mono text-xs">
                      {filteredLines.length} / {lines.length} lines
                      {searchQuery && ` (filtered)`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLines([])}
                      className="text-xs text-text-muted font-mono hover:text-text-primary transition-colors px-3 py-1 rounded border border-border hover:border-accent/30"
                    >
                      Clear (Ctrl+K)
                    </button>
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

                {/* External access */}
                <div className="system-card p-6">
                  <h3 className="text-sm font-semibold text-text-primary font-mono mb-2 uppercase tracking-wider">
                    External access
                  </h3>
                  <p className="text-xs text-text-muted font-mono">
                    To give this server a public address, use <strong className="text-text-secondary">Connect tunnels</strong> in the sidebar for instructions on using playit.gg, ngrok, Cloudflare Tunnel, or other tools. Point the tunnel at port <strong className="text-text-primary">{server.port}</strong>.
                  </p>
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
                          notify({
                            type: "success",
                            title: "RAM updated",
                            message: `Allocation set to ${ramGB}GB. Applies on next start.`
                          });
                        } else {
                          notify({
                            type: "error",
                            title: "RAM update failed",
                            message: result.error || "Unable to update RAM."
                          });
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

        {activeTab === "mods" && (
          <ModManager serverName={serverName} />
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

