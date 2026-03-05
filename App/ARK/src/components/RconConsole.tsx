import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RconConsoleLine {
  id: string;
  text: string;
  type: "command" | "response" | "error" | "system";
  timestamp: string;
}

const QUICK_COMMANDS = [
  { label: "List Players", command: "listplayers" },
  { label: "Save World", command: "saveworld" },
  { label: "Get Chat", command: "getchat" },
  { label: "Resume", command: "cheat slomo 1" },
  { label: "Pause", command: "cheat slomo 0.001" },
  { label: "Exit Server", command: "doexit" },
] as const;

export default function RconConsole() {
  const [host, setHost] = useState("127.0.0.1");
  const [port, setPort] = useState("32330");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lines, setLines] = useState<RconConsoleLine[]>([
    { id: "init", text: "RCON Console ready. Configure connection and test.", type: "system", timestamp: new Date().toLocaleTimeString() },
  ]);
  const [commandInput, setCommandInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  let lineCounter = useRef(0);

  useEffect(() => {
    const loadSettings = async () => {
      if (!window.electronAPI) return;
      try {
        const settings = await window.electronAPI.server.getAppSettings();
        if (settings.rcon?.defaultPassword) setPassword(settings.rcon.defaultPassword);
        if (settings.defaultRconPort) setPort(String(settings.defaultRconPort));
      } catch {}
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const appendLine = useCallback((text: string, type: RconConsoleLine["type"]) => {
    lineCounter.current += 1;
    setLines((prev) => [
      ...prev.slice(-499),
      { id: `line-${lineCounter.current}`, text, type, timestamp: new Date().toLocaleTimeString() },
    ]);
  }, []);

  const handleTestConnection = async () => {
    if (!window.electronAPI?.rcon) return;
    setTesting(true);
    appendLine(`Testing connection to ${host}:${port}...`, "system");
    try {
      const result = await window.electronAPI.rcon.test(host, parseInt(port), password);
      if (result.success) {
        setConnected(true);
        appendLine("Connection successful! RCON is available.", "system");
      } else {
        setConnected(false);
        appendLine("Connection failed. Check host, port, and password.", "error");
      }
    } catch (err) {
      setConnected(false);
      appendLine(`Connection error: ${err}`, "error");
    } finally {
      setTesting(false);
    }
  };

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    if (!window.electronAPI?.rcon) {
      appendLine("RCON API not available", "error");
      return;
    }

    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setCommandInput("");
    appendLine(`> ${cmd}`, "command");

    try {
      const timeout = 10000;
      const result = await window.electronAPI.rcon.execute(host, parseInt(port), password, cmd, timeout);
      if (result.success) {
        appendLine(result.response || "(no response)", "response");
        if (!connected) setConnected(true);
      } else {
        appendLine(`Error: ${result.response}`, "error");
      }
    } catch (err) {
      appendLine(`Error: ${err}`, "error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(commandInput);
    } else if (e.key === "ArrowUp" && history.length > 0) {
      e.preventDefault();
      const newIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setCommandInput(history[newIndex] || "");
    } else if (e.key === "ArrowDown" && history.length > 0) {
      e.preventDefault();
      const newIndex = historyIndex < 0 ? -1 : Math.min(history.length, historyIndex + 1);
      setHistoryIndex(newIndex);
      setCommandInput(newIndex >= history.length ? "" : history[newIndex] || "");
    }
  };

  const getLineColor = (type: RconConsoleLine["type"]) => {
    switch (type) {
      case "command": return "text-accent";
      case "response": return "text-green-400";
      case "error": return "text-red-400";
      case "system": return "text-text-muted";
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
          RCON CONSOLE
        </h1>
        <p className="text-text-secondary font-mono text-sm">
          Remote console for ARK server management
        </p>
      </motion.div>

      {/* Connection Config */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 100, damping: 15 }}
        className="system-card p-5 mb-4"
      >
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1.5">Host</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1.5">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1.5">Password</label>
            <div className="flex gap-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-background border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                placeholder="RCON password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-2 text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>
          <motion.button
            onClick={handleTestConnection}
            disabled={testing || !password}
            className={`btn-secondary whitespace-nowrap ${testing ? "opacity-50" : ""}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {testing ? "TESTING..." : "TEST"}
          </motion.button>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500" : "bg-red-500/60"}`} />
            <span className="text-xs font-mono text-text-muted">{connected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Commands */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
        className="flex gap-2 mb-4 flex-wrap"
      >
        {QUICK_COMMANDS.map((qc) => (
          <motion.button
            key={qc.command}
            onClick={() => executeCommand(qc.command)}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-background-secondary border border-border rounded hover:border-accent/40 hover:text-accent text-text-secondary transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {qc.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Console Output */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 100, damping: 15 }}
        className="system-card overflow-hidden flex flex-col"
        style={{ height: "calc(100vh - 420px)", minHeight: 300 }}
      >
        <div className="px-4 py-2 border-b border-border flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Output</span>
          <button
            onClick={() => setLines([{ id: "cleared", text: "Console cleared.", type: "system", timestamp: new Date().toLocaleTimeString() }])}
            className="text-xs font-mono text-text-muted hover:text-text-primary transition-colors uppercase tracking-wider"
          >
            Clear
          </button>
        </div>
        <div
          ref={outputRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-0.5"
        >
          <AnimatePresence initial={false}>
            {lines.map((line) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
                className={`${getLineColor(line.type)} leading-relaxed break-all`}
              >
                <span className="text-text-muted/40 mr-2 text-xs">[{line.timestamp}]</span>
                {line.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="px-4 py-3 border-t border-border flex gap-2">
          <span className="text-accent font-mono text-sm select-none pt-1.5">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter RCON command..."
            className="flex-1 bg-transparent border-none outline-none text-text-primary font-mono text-sm placeholder-text-muted/50"
          />
          <motion.button
            onClick={() => executeCommand(commandInput)}
            disabled={!commandInput.trim()}
            className="btn-primary text-xs px-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            SEND
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
