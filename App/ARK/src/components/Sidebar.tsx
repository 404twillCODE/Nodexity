import { useState } from "react";
import { motion } from "framer-motion";

type View = "servers" | "settings" | "playit";

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const menuItems: { id: View; label: string; icon: React.ReactNode }[] = [
  {
    id: "servers",
    label: "SERVERS",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "SETTINGS",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar({ currentView, onViewChange, collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = onCollapsedChange ? (controlledCollapsed ?? false) : internalCollapsed;
  const setCollapsed = onCollapsedChange
    ? (value: boolean | ((prev: boolean) => boolean)) => onCollapsedChange(typeof value === "function" ? value(controlledCollapsed ?? false) : value)
    : setInternalCollapsed;

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 56 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="shrink-0 border-r border-border bg-background-secondary h-full flex flex-col overflow-hidden"
    >
      <nav className="flex-1 p-2 pt-4 space-y-0.5">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 25,
            }}
            onClick={() => onViewChange(item.id)}
            title={collapsed ? item.label : undefined}
            className={`w-full text-left flex items-center gap-3 px-3 py-3 text-sm font-mono uppercase tracking-wider transition-all ${
              collapsed ? "justify-center px-2" : ""
            } ${
              currentView === item.id
                ? "text-accent bg-accent/10 border-l-2 border-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-background"
            }`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </motion.button>
        ))}
      </nav>
      <div className="shrink-0">
        <div className="px-2 pt-2 pb-1">
          <button
            type="button"
            title={collapsed ? "Connect tunnels" : undefined}
            onClick={(e) => {
              e.preventDefault();
              onViewChange("playit");
              (e.currentTarget as HTMLButtonElement).blur();
            }}
            className={`w-full text-center flex items-center gap-3 rounded-md text-xs font-mono uppercase tracking-wider transition-all duration-150 border ${
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
            } ${
              currentView === "playit"
                ? "text-accent border-accent/50 bg-accent/10"
                : "text-text-secondary border-border bg-background/50 hover:border-accent/30 hover:text-text-primary hover:bg-background"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {!collapsed && <span>Connect tunnels</span>}
          </button>
        </div>
        <div className={`py-2 bg-background/30 flex items-center gap-1.5 flex-wrap ${collapsed ? "justify-center px-1" : "px-3 justify-between"}`}>
          {!collapsed && (
            <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider leading-tight">
              <span>v0.1.0</span>
              <span className="opacity-50 mx-1">·</span>
              <a href="https://modrinth.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Modrinth</a>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <a href="https://discord.gg/rFJeUQ6CbE" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-[#5865F2] transition-colors p-0.5" title="Discord" aria-label="Discord">
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
        <button
          type="button"
          onClick={() => setCollapsed((c: boolean) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full flex items-center justify-center gap-2 py-2 text-text-muted hover:text-text-primary hover:bg-background/50 transition-colors border-t border-border"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </motion.span>
          {!collapsed && <span className="text-[10px] font-mono uppercase tracking-wider">Collapse</span>}
        </button>
      </div>
    </motion.div>
  );
}

