import { motion } from "framer-motion";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ToggleSwitch from "./ToggleSwitch";
import { useServerManager } from "../hooks/useServerManager";

interface ConsoleLine {
  id: string;
  text: string;
  timestamp: string;
  type?: 'stdout' | 'stderr' | 'command';
}

interface ConsolePanelProps {
  selectedServer?: string | null;
}

export default function ConsolePanel({ selectedServer: propSelectedServer }: ConsolePanelProps) {
  const { servers, sendCommand } = useServerManager();
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [input, setInput] = useState("");
  const [internalSelectedServer, setInternalSelectedServer] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [settings, setSettings] = useState<any>(null);
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
  const logBufferRef = useRef<string>("");
  
  // Use prop if provided, otherwise use internal state
  const selectedServer = propSelectedServer !== undefined ? propSelectedServer : internalSelectedServer;

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

    const handleSettingsUpdate = (updated: any) => {
      setSettings(updated || {});
      setAutoScroll(updated?.consoleAutoScroll !== false);
    };

    const unsubscribe = window.electronAPI?.server?.onAppSettingsUpdated?.(handleSettingsUpdate);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const activeServer = servers.find(s => s.status === 'RUNNING');

  useEffect(() => {
    // Only auto-select if no prop is provided
    if (propSelectedServer === undefined) {
      if (activeServer && !internalSelectedServer) {
        setInternalSelectedServer(activeServer.name);
      } else if (!activeServer) {
        setInternalSelectedServer(null);
      }
    }
  }, [activeServer, internalSelectedServer, propSelectedServer]);

  // Clear console and reset scroll intent when selected server changes (from prop)
  useEffect(() => {
    if (propSelectedServer !== undefined) {
      setLines([]);
      userScrolledRef.current = false;
      const t1 = setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
      const t2 = setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 350);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [propSelectedServer]);

  useEffect(() => {
    if (!window.electronAPI) return;

    const handleLog = (data: { serverName: string; type: 'stdout' | 'stderr'; data: string }) => {
      if (data.serverName === selectedServer) {
        const buffered = logBufferRef.current + data.data;
        const parts = buffered.split('\n');
        logBufferRef.current = parts.pop() ?? "";

        if (parts.length === 0) return;

        const timestamp = new Date().toLocaleTimeString();
        const newLines = parts.map((line, index) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index}`,
          text: line,
          timestamp,
          type: data.type,
        }));

        setLines(prev => {
          const maxLines = settings?.maxConsoleLines || 1000;
          const merged = [...prev, ...newLines];
          return merged.slice(-maxLines);
        });
      }
    };

    window.electronAPI.server.onServerLog(handleLog);

    return () => {
      window.electronAPI?.server.removeServerLogListener();
    };
  }, [selectedServer, settings]);

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

  // Scroll to bottom when lines change, after layout (double rAF so scrollHeight is correct)
  useEffect(() => {
    if (!autoScroll || !scrollRef.current || userScrolledRef.current) return;
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollRef.current && autoScroll) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          lastScrollTopRef.current = scrollRef.current.scrollTop;
        }
      });
    });
    return () => cancelAnimationFrame(rafId);
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

  const handleClear = () => {
    setLines([]);
  };

  // Server log lines often start with [HH:mm:ss] - don't duplicate with our timestamp
  const lineHasServerTimestamp = (text: string) => /^\s*\[\d{1,2}:\d{2}(:\d{2})?\]/.test(text);

  // Common Minecraft server commands for autocomplete
  const commonCommands = [
    'help', 'list', 'stop', 'kick', 'ban', 'pardon', 'ban-ip', 'pardon-ip',
    'whitelist', 'op', 'deop', 'tp', 'give', 'gamemode', 'time', 'weather',
    'difficulty', 'gamerule', 'say', 'tell', 'me', 'seed', 'save-all', 'save-on',
    'save-off', 'reload', 'plugins', 'version', 'tps', 'mspt'
  ];

  // Update command suggestions based on input (only in command mode)
  useEffect(() => {
    if (!chatMode && input.trim() && selectedServer) {
      const query = input.toLowerCase().trim();
      const suggestions = commonCommands
        .filter(cmd => cmd.startsWith(query) && query.length > 0)
        .slice(0, 5);
      setCommandSuggestions(suggestions);
    } else {
      setCommandSuggestions([]);
    }
  }, [input, selectedServer, chatMode]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedServer) return;

    const inputText = input.trim();
    // In chat mode, prepend "say " to send as chat message
    const command = chatMode ? `say ${inputText}` : inputText;
    
    // Add to command history (avoid duplicates)
    setCommandHistory(prev => {
      const newHistory = prev.filter(c => c !== command);
      return [command, ...newHistory].slice(0, 50); // Keep last 50 commands
    });
    setHistoryIndex(-1);

    const commandLine: ConsoleLine = {
      id: Date.now().toString(),
      text: chatMode ? `[Chat] ${inputText}` : `> ${command}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'command',
    };
    setLines(prev => {
      const maxLines = settings?.maxConsoleLines || 1000;
      const newLines = [...prev, commandLine];
      return newLines.slice(-maxLines);
    });

    const result = await sendCommand(selectedServer, command);
    if (!result.success) {
      const errorLine: ConsoleLine = {
        id: Date.now().toString() + 'error',
        text: `Error: ${result.error}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'stderr',
      };
      setLines(prev => {
        const maxLines = settings?.maxConsoleLines || 1000;
        const newLines = [...prev, errorLine];
        return newLines.slice(-maxLines);
      });
    }

    setInput("");
    setCommandSuggestions([]);
    inputRef.current?.focus();
  }, [input, selectedServer, chatMode, sendCommand, settings]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-console-search]') as HTMLInputElement;
        searchInput?.focus();
        searchInput?.select();
      }
      // Ctrl/Cmd + K to clear
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-full flex flex-col p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary font-mono mb-1">
              CONSOLE
            </h1>
            <p className="text-text-secondary font-mono text-sm">
              System output and command interface
            </p>
          </div>
          <div className="flex items-center gap-3">
            {servers.length > 0 && (
              <select
                value={selectedServer || ''}
                onChange={(e) => {
                  if (propSelectedServer === undefined) {
                    setInternalSelectedServer(e.target.value || null);
                  }
                  setLines([]); // Clear console when switching servers
                }}
                disabled={propSelectedServer !== undefined}
                className="select-custom"
              >
                <option value="">Select server...</option>
                {servers.map(server => (
                  <option key={server.id} value={server.name}>
                    {server.name} ({server.status})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <input
              data-console-search
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search console... (Ctrl+F)"
              className="w-full bg-background-secondary border border-border px-4 py-2 pl-10 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded transition-colors"
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
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="select-custom"
            >
              <option value="all">All</option>
              <option value="stdout">Output</option>
              <option value="stderr">Errors</option>
              <option value="command">Commands</option>
            </select>
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-text-secondary font-mono text-sm">
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
          </div>
          <motion.button
            onClick={handleClear}
            disabled={lines.length === 0}
            className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: lines.length === 0 ? 1 : 1.02 }}
            whileTap={{ scale: lines.length === 0 ? 1 : 0.98 }}
          >
            CLEAR (Ctrl+K)
          </motion.button>
        </div>
      </motion.div>

      {/* Console Output */}
      <div className="flex-1 system-card p-0 flex flex-col overflow-hidden">
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
              {selectedServer
                ? searchQuery
                  ? "No lines match your search."
                  : `Console for ${selectedServer}. Start the server to see output.`
                : "Select a server to view console output."}
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
                    className={`group py-1 px-2 rounded transition-colors ${
                      line.type === 'stderr' 
                        ? 'text-red-400 bg-red-400/10 hover:bg-red-400/15' 
                        : line.type === 'command' 
                        ? 'text-accent bg-accent/10 hover:bg-accent/15' 
                        : 'text-text-primary hover:bg-background-secondary/50'
                    } ${isHighlighted ? 'ring-1 ring-accent/50' : ''}`}
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

        {/* Command Input */}
        <div className="border-t border-border p-4 bg-background-secondary/50">
          <form onSubmit={handleSubmit} className="space-y-2">
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
                  onKeyDown={handleKeyDown}
                  placeholder={selectedServer ? (chatMode ? `Type a message to send in chat...` : `Enter command for ${selectedServer}... (↑↓ for history, Tab for autocomplete)`) : "Select a server first..."}
                  disabled={!selectedServer}
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
                disabled={!selectedServer || !input.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3"
                whileHover={{ scale: !selectedServer || !input.trim() ? 1 : 1.02 }}
                whileTap={{ scale: !selectedServer || !input.trim() ? 1 : 0.98 }}
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
    </div>
  );
}
