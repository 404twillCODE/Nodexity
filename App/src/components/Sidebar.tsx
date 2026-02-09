import { motion } from "framer-motion";

type View = "servers" | "settings";

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const menuItems: { id: View; label: string }[] = [
  { id: "servers", label: "SERVERS" },
  { id: "settings", label: "SETTINGS" },
];

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-background-secondary h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="text-lg font-semibold text-text-primary font-mono"
        >
          NODEXITY
        </motion.h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: index * 0.1,
              type: "spring",
              stiffness: 200,
              damping: 25,
            }}
            onClick={() => onViewChange(item.id)}
            className={`w-full text-left px-4 py-3 text-sm font-mono uppercase tracking-wider transition-all ${
              currentView === item.id
                ? "text-accent bg-accent/10 border-l-2 border-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-background"
            }`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            {item.label}
          </motion.button>
        ))}
      </nav>
      <div className="px-3 py-2 border-t border-border">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider leading-tight">
            <span>v0.1.0</span>
            <span className="opacity-50 mx-1">·</span>
            <a href="https://playit.gg" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">playit.gg</a>
            <span className="opacity-50 mx-1">·</span>
            <a href="https://modrinth.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Modrinth</a>
          </div>
          <div className="flex items-center gap-1.5">
            <a href="https://discord.gg/RVTAEbdDBJ" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-[#5865F2] transition-colors p-0.5" title="Discord" aria-label="Discord">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
            <a href="https://nodexity.com/donate" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-red-400 transition-colors p-0.5" title="Donate" aria-label="Donate">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

