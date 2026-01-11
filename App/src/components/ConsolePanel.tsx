import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

interface ConsoleLine {
  id: string;
  text: string;
  timestamp: string;
}

const mockConsoleLines: ConsoleLine[] = [
  { id: "1", text: "> Starting server...", timestamp: "12:34:56" },
  { id: "2", text: "> Loading world data...", timestamp: "12:34:57" },
  { id: "3", text: "> Server initialized successfully", timestamp: "12:34:58" },
  { id: "4", text: "> Ready for connections on port 25565", timestamp: "12:34:59" },
];

export default function ConsolePanel() {
  const [lines, setLines] = useState<ConsoleLine[]>(mockConsoleLines);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newLine: ConsoleLine = {
      id: Date.now().toString(),
      text: `> ${input}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLines([...lines, newLine]);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
          CONSOLE
        </h1>
        <p className="text-text-secondary font-mono text-sm">
          System output and command interface
        </p>
      </motion.div>
      <div className="flex-1 system-card p-6 flex flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto font-mono text-sm text-text-secondary space-y-1 mb-4"
        >
          {lines.map((line, index) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-3"
            >
              <span className="text-text-muted text-xs">{line.timestamp}</span>
              <span>{line.text}</span>
            </motion.div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="> Enter command..."
            className="flex-1 bg-background-secondary border border-border px-4 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50"
          />
          <motion.button
            type="submit"
            className="btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            SEND
          </motion.button>
        </form>
      </div>
    </div>
  );
}

